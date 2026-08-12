import {
  BadRequestException,
  ConflictException,
  forwardRef,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { createHash, randomBytes } from 'crypto';
import {
  Prisma,
  ReservationEventScheduleMode,
  UpcomingClassEnrollmentStatus,
  UpcomingExperienceType,
  VenueReservationPaymentChannel,
} from '@prisma/client';
import { MailService } from '../../mail/services/mail.service';
import { AdminPaymentNotifyService } from '../../mail/services/admin-payment-notify.service';
import { emailBrandingFromProcessEnv } from '../../mail/utils/email-html-branding';
import { STRIPE_EMBEDDED_CHECKOUT_BASE } from '../../stripe/utils/stripe-embedded-checkout.util';
import {
  stripeAutomaticTaxParams,
  stripeTaxProductData,
} from '../../stripe/utils/stripe-tax.util';
import {
  attachPaymentIntentCheckoutMetadata,
  buildCheckoutCorrelationMetadata,
  resolvePaymentIntentIdForCheckoutSession,
} from '../../stripe/utils/stripe-checkout-pi-enrich.util';
import { paymentIntentIdFromSession } from '../../stripe/types/stripe-webhook.types';
import { StripeService } from '../../stripe/services/stripe.service';
import { CHECKOUT_TTL_MINUTES } from '../constants/upcoming-events.constants';
import {
  assessClassEventReadiness,
  templateSnapshotFromVenueConfig,
} from '../utils/admin-bookable-class.util';
import {
  ADMIN_CLASS_PACKAGE_ENROLLMENT_INCLUDE,
  UpcomingEventsRepository,
} from './upcoming-events.repository';
import {
  buildClassBundleConfirmationHtml,
  buildClassBundleConfirmationSubject,
  buildClassBundleConfirmationText,
} from '../mail/class-bundle-confirmation.mail';
import {
  buildClassEnrollmentConfirmationHtml,
  buildClassEnrollmentConfirmationSubject,
  buildClassEnrollmentConfirmationText,
} from '../mail/class-enrollment-confirmation.mail';
import {
  buildClassMonthPackageSelections,
  buildClassSessionBundleSelections,
  buildClassSessionCartSelections,
} from '../utils/class-package-selections.util';
import {
  assertMonthSessionsAvailable,
  assertValidMonthIso,
  currentCalendarMonthIso,
  listPurchasableMonths,
  resolveMonthSessions,
  sessionCalendarMonthIso,
} from '../utils/class-month-package.util';
import { mapClassSessionPublic } from '../utils/class-session-public.util';
import { buildPublicScheduleDisplay } from '../utils/upcoming-event-public-schedule.util';
import {
  buildClassPaymentRequestHtml,
  buildClassPaymentRequestSubject,
  buildClassPaymentRequestText,
} from '../mail/class-payment-request.mail';
import { CreateAdminClassEnrollmentDto } from '../dto/create-admin-class-enrollment.dto';
import { formatEnrollmentReference } from '../utils/enrollment-reference.util';
import { UpcomingEventsService } from './upcoming-events.service';

@Injectable()
export class AdminClassEnrollmentService {
  private readonly logger = new Logger(AdminClassEnrollmentService.name);

  constructor(
    private readonly repository: UpcomingEventsRepository,
    private readonly stripeService: StripeService,
    private readonly mail: MailService,
    private readonly adminPaymentNotify: AdminPaymentNotifyService,
    @Inject(forwardRef(() => UpcomingEventsService))
    private readonly upcomingEvents: UpcomingEventsService,
  ) {}

  private get prisma() {
    return this.repository.asPrisma();
  }

  async getAdminClassBookingContext(eventId: string) {
    return this.getAdminClassBookingContextLite(eventId);
  }

  async getAdminClassBookingContextLite(eventId: string) {
    const event = await this.repository.findAdminUpcomingEventOrThrow(eventId);
    if (event.experienceType !== UpcomingExperienceType.CLASSES) {
      throw new BadRequestException('This event is not a class event.');
    }
    if (!event.slug?.trim()) {
      throw new BadRequestException(
        'Event slug is required for class booking.',
      );
    }

    const now = new Date();
    const venueConfigRow = await this.repository.findVenueConfigWithTemplate(
      event.id,
    );

    const schedule = venueConfigRow?.reservationEventTemplate
      ? buildPublicScheduleDisplay(venueConfigRow.reservationEventTemplate)
      : null;
    const timezone =
      schedule?.mode === 'RECURRING_WEEKLY'
        ? schedule.timezone
        : 'America/New_York';

    const sessionRows = await this.repository.findActiveClassSessionsForEvent(
      event.id,
      now,
    );

    const seatCounts = await this.repository.batchSeatsRemaining(
      sessionRows.map((row) => ({ id: row.id, capacity: row.capacity })),
    );

    const sessions = sessionRows.map((row) => {
      const sold = seatCounts.get(row.id) ?? 0;
      return {
        ...mapClassSessionPublic(row),
        seatsRemaining: Math.max(0, row.capacity - sold),
      };
    });

    const template = templateSnapshotFromVenueConfig(venueConfigRow);
    const readiness = assessClassEventReadiness({
      slug: event.slug,
      template,
      upcomingSessionCount: sessions.filter((s) => s.seatsRemaining > 0).length,
    });

    const currentMonthIso = currentCalendarMonthIso(timezone, now);
    const monthPackage =
      venueConfigRow && event.experienceType === UpcomingExperienceType.CLASSES
        ? (() => {
            const enabled = venueConfigRow.classPackageEnabled ?? false;
            const price =
              venueConfigRow.classPackagePrice != null
                ? Number(venueConfigRow.classPackagePrice)
                : null;
            const mappedSessions = sessions.map((s) => ({
              startsAt: new Date(s.startsAt),
              endsAt: new Date(s.endsAt),
              timezone: s.timezone || timezone,
            }));
            const currentMonthSessionCount = mappedSessions.filter(
              (s) =>
                s.endsAt > now &&
                sessionCalendarMonthIso(s.startsAt, s.timezone) ===
                  currentMonthIso,
            ).length;
            return {
              enabled,
              price,
              label: venueConfigRow.classPackageLabel ?? null,
              currentMonthIso,
              currentMonthSessionCount,
              purchasable:
                enabled &&
                price != null &&
                Number.isFinite(price) &&
                price >= 0.5 &&
                currentMonthSessionCount > 0,
              purchasableMonths: listPurchasableMonths(mappedSessions, now),
            };
          })()
        : null;

    return {
      event: {
        id: event.id,
        slug: event.slug.trim(),
        name: event.eventType.name.trim(),
        timezone,
      },
      schedule,
      sessions,
      monthPackage,
      readiness,
    };
  }

  async listAdminBookableClassEvents() {
    const now = new Date();
    const events = await this.repository.listActiveClassEventsWithVenueConfig();

    const bookable: Array<{
      id: string;
      name: string;
      slug: string;
      timezone: string;
      weekdayCount: number;
      sectionCount: number;
      upcomingSessionCount: number;
    }> = [];

    const eventIds = events.map((event) => event.id);
    const allSessions =
      await this.repository.listActiveClassSessionSummariesForEvents(
        eventIds,
        now,
      );

    const seatCounts = await this.repository.batchSeatsRemaining(
      allSessions.map((session) => ({
        id: session.id,
        capacity: session.capacity,
      })),
    );

    const sessionsByEvent = new Map<string, typeof allSessions>();
    for (const session of allSessions) {
      const list = sessionsByEvent.get(session.eventId) ?? [];
      list.push(session);
      sessionsByEvent.set(session.eventId, list);
    }

    for (const event of events) {
      const template = templateSnapshotFromVenueConfig(event.venueConfig);
      const sessions = sessionsByEvent.get(event.id) ?? [];
      const upcomingSessionCount = sessions.filter((session) => {
        const sold = seatCounts.get(session.id) ?? 0;
        return session.capacity - sold > 0;
      }).length;

      const assessment = assessClassEventReadiness({
        slug: event.slug,
        template,
        upcomingSessionCount,
      });
      if (!assessment.isBookable || !template || !event.slug?.trim()) {
        continue;
      }

      bookable.push({
        id: event.id,
        name: event.eventType.name.trim(),
        slug: event.slug.trim(),
        timezone: template.timezone,
        weekdayCount: template.activeWeekdayCount,
        sectionCount: template.activeSectionCount,
        upcomingSessionCount,
      });
    }

    return { events: bookable };
  }

  async createAdminClassCashEnrollment(
    adminUserId: string,
    dto: CreateAdminClassEnrollmentDto,
  ) {
    const resolved = await this.resolveAdminClassPurchase(dto);
    const customer = this.normalizeClassCustomer(dto);

    if (resolved.kind === 'session') {
      const enrollment = await this.repository.createClassEnrollment({
        sessionId: resolved.session.id,
        amount: resolved.session.price,
        currency: resolved.session.currency,
        status: UpcomingClassEnrollmentStatus.PAID,
        paymentChannel: VenueReservationPaymentChannel.CASH,
        paymentMethodType: 'cash',
        paidAt: new Date(),
        customerName: customer.customerName,
        customerEmail: customer.customerEmail,
        customerPhone: customer.customerPhone,
        createdByAdminId: adminUserId,
        boxOfficeDetails: this.toBoxOfficeJson(dto.boxOfficeDetails),
      });
      await this.sendClassConfirmation(enrollment);
      await this.adminPaymentNotify.notifyPaymentOutcome({
        outcome: 'PAID',
        flow: 'CLASS_SESSION',
        customerName: enrollment.customerName,
        customerEmail: enrollment.customerEmail,
        amount: Number(enrollment.amount),
        currency: enrollment.currency,
        contextLabel: `${enrollment.session.event.eventType.name} — ${this.sessionLabel(enrollment.session)}`,
        reference: enrollment.id.slice(0, 8).toUpperCase(),
      });
      this.logger.log(
        `admin-class-cash enrollmentId=${enrollment.id} admin=${adminUserId}`,
      );
      return {
        enrollmentId: enrollment.id,
        message: 'Class reservation confirmed.',
      };
    }

    const packageEnrollment = await this.createAdminPaidPackageEnrollment({
      eventId: resolved.event.id,
      amount: resolved.totalAmount,
      customer,
      selections: resolved.selections,
      resolvedItems: resolved.resolved,
      checkoutFlow: resolved.checkoutFlow,
      adminUserId,
      boxOfficeDetails: dto.boxOfficeDetails,
    });

    return {
      enrollmentId: packageEnrollment.id,
      message: 'Class reservation confirmed.',
    };
  }

  async createAdminClassCheckoutSession(
    adminUserId: string,
    dto: CreateAdminClassEnrollmentDto,
  ) {
    const resolved = await this.resolveAdminClassPurchase(dto);
    const customer = this.normalizeClassCustomer(dto);
    const expiresAt = new Date(Date.now() + CHECKOUT_TTL_MINUTES * 60 * 1000);
    const frontendUrl = this.stripeService.frontendUrl();
    const returnUrl = `${frontendUrl}/pay/class/return?session_id={CHECKOUT_SESSION_ID}`;
    const rawToken = randomBytes(32).toString('hex');
    const payTokenHash = this.hashClassPayToken(rawToken);
    const eventName = resolved.event.eventType.name;

    if (resolved.kind === 'session') {
      const session = resolved.session;
      const amountCents = Math.round(Number(session.price) * 100);
      const classLabel = this.sessionLabel(session);
      const productName = `${eventName} — class`;
      const { checkout, paymentIntentId, metadata } =
        await this.createEnrichedAdminClassCheckout({
          customerEmail: customer.customerEmail,
          description: `${productName} — ${classLabel}`,
          baseMetadata: {
            flow: 'class_session',
            upcomingEventId: resolved.event.id,
            sessionId: session.id,
            adminUserId,
            paymentChannel: 'STRIPE',
          },
          lineItems: [
            {
              quantity: 1,
              price_data: {
                currency: session.currency,
                unit_amount: amountCents,
                product_data: stripeTaxProductData({
                  name: productName,
                  description: classLabel,
                }),
              },
            },
          ],
          returnUrl,
          expiresAt,
        });

      const enrollment = await this.repository.createClassEnrollment({
        sessionId: session.id,
        amount: session.price,
        currency: session.currency,
        status: UpcomingClassEnrollmentStatus.PENDING_PAYMENT,
        paymentChannel: VenueReservationPaymentChannel.STRIPE,
        stripeCheckoutSessionId: checkout.id,
        payTokenHash,
        customerName: customer.customerName,
        customerEmail: customer.customerEmail,
        customerPhone: customer.customerPhone,
        createdByAdminId: adminUserId,
        boxOfficeDetails: this.toBoxOfficeJson(dto.boxOfficeDetails),
        expiresAt,
      });

      await this.attachAdminCheckoutMetadata({
        checkoutSessionId: checkout.id,
        paymentIntentId,
        metadata: {
          ...metadata,
          enrollmentId: enrollment.id,
        },
      });

      const payUrl = this.buildClassPayUrl(rawToken);
      await this.sendClassPaymentRequestEmail({
        enrollmentId: enrollment.id,
        customerName: customer.customerName,
        customerEmail: customer.customerEmail,
        amount: Number(session.price),
        eventLabel: eventName,
        classLabel,
        payUrl,
      });

      this.logger.log(
        `admin-class-checkout enrollmentId=${enrollment.id} session=${checkout.id} admin=${adminUserId}`,
      );
      return {
        enrollmentId: enrollment.id,
        message: 'Payment link sent to customer.',
        payUrl,
      };
    }

    const { checkout, paymentIntentId, metadata } =
      await this.createEnrichedAdminClassCheckout({
        customerEmail: customer.customerEmail,
        description: `${resolved.productName} — ${resolved.productDescription}`,
        baseMetadata: {
          flow: resolved.checkoutFlow,
          upcomingEventId: resolved.event.id,
          adminUserId,
          paymentChannel: 'STRIPE',
        },
        lineItems: [
          {
            quantity: 1,
            price_data: {
              currency: 'usd',
              unit_amount: Math.round(resolved.totalAmount * 100),
              product_data: stripeTaxProductData({
                name: resolved.productName,
                description: resolved.productDescription,
              }),
            },
          },
        ],
        returnUrl,
        expiresAt,
      });

    const packageEnrollment =
      await this.repository.createClassPackageEnrollment({
        eventId: resolved.event.id,
        amount: resolved.totalAmount,
        currency: 'usd',
        status: UpcomingClassEnrollmentStatus.PENDING_PAYMENT,
        paymentChannel: VenueReservationPaymentChannel.STRIPE,
        stripeCheckoutSessionId: checkout.id,
        payTokenHash,
        customerName: customer.customerName,
        customerEmail: customer.customerEmail,
        customerPhone: customer.customerPhone,
        selections: resolved.selections,
        createdByAdminId: adminUserId,
        boxOfficeDetails: this.toBoxOfficeJson(dto.boxOfficeDetails),
        expiresAt,
      });

    for (const row of resolved.resolved) {
      const enrollment = await this.repository.createClassEnrollment({
        sessionId: row.session.id,
        amount: row.session.price,
        currency: row.session.currency,
        status: UpcomingClassEnrollmentStatus.PENDING_PAYMENT,
        paymentChannel: VenueReservationPaymentChannel.STRIPE,
        customerName: customer.customerName,
        customerEmail: customer.customerEmail,
        customerPhone: customer.customerPhone,
        createdByAdminId: adminUserId,
        expiresAt,
      });
      await this.repository.createClassPackageEnrollmentItem({
        packageEnrollmentId: packageEnrollment.id,
        enrollmentId: enrollment.id,
        weekday: row.weekday,
      });
    }

    await this.attachAdminCheckoutMetadata({
      checkoutSessionId: checkout.id,
      paymentIntentId,
      metadata: {
        ...metadata,
        packageEnrollmentId: packageEnrollment.id,
      },
    });

    const payUrl = this.buildClassPayUrl(rawToken);
    await this.sendClassPaymentRequestEmail({
      enrollmentId: packageEnrollment.id,
      customerName: customer.customerName,
      customerEmail: customer.customerEmail,
      amount: resolved.totalAmount,
      eventLabel: eventName,
      classLabel: resolved.classLabel,
      payUrl,
    });

    this.logger.log(
      `admin-class-checkout packageId=${packageEnrollment.id} session=${checkout.id} admin=${adminUserId}`,
    );
    return {
      enrollmentId: packageEnrollment.id,
      message: 'Payment link sent to customer.',
      payUrl,
    };
  }

  private async createEnrichedAdminClassCheckout(args: {
    customerEmail: string;
    description: string;
    baseMetadata: Record<string, string>;
    lineItems: NonNullable<
      NonNullable<
        Parameters<StripeService['client']['checkout']['sessions']['create']>[0]
      >['line_items']
    >;
    returnUrl: string;
    expiresAt: Date;
  }) {
    const { correlationId, metadata } = buildCheckoutCorrelationMetadata(
      args.baseMetadata,
    );
    const checkout = (await this.stripeService.client.checkout.sessions.create({
      ...STRIPE_EMBEDDED_CHECKOUT_BASE,
      mode: 'payment',
      customer_email: args.customerEmail,
      ...stripeAutomaticTaxParams(),
      payment_intent_data: {
        description: args.description,
        receipt_email: args.customerEmail,
        metadata,
      },
      line_items: args.lineItems,
      metadata,
      expand: ['payment_intent'],
      return_url: args.returnUrl,
      expires_at: Math.floor(args.expiresAt.getTime() / 1000),
    })) as {
      id: string;
      client_secret: string | null;
      payment_intent?: string | { id?: string } | null;
    };

    if (!checkout.client_secret) {
      throw new BadRequestException('Could not start checkout.');
    }

    const paymentIntentId = await resolvePaymentIntentIdForCheckoutSession(
      this.stripeService.client,
      {
        checkoutSessionId: checkout.id,
        paymentIntentFromSession: paymentIntentIdFromSession(checkout),
        correlationId,
        logger: this.logger,
        opPrefix: 'admin_class.checkout',
      },
    );

    if (paymentIntentId) {
      await attachPaymentIntentCheckoutMetadata(this.stripeService.client, {
        paymentIntentId,
        checkoutSessionId: checkout.id,
        metadata,
      });
    } else {
      this.logger.warn(
        `admin-class-checkout-missing-pi session=${checkout.id} correlationId=${correlationId} flow=${args.baseMetadata.flow ?? 'none'}`,
      );
    }

    return { checkout, correlationId, paymentIntentId, metadata };
  }

  private async attachAdminCheckoutMetadata(args: {
    checkoutSessionId: string;
    paymentIntentId: string | null;
    metadata: Record<string, string>;
  }) {
    await this.stripeService.client.checkout.sessions.update(
      args.checkoutSessionId,
      { metadata: args.metadata },
    );
    if (args.paymentIntentId) {
      await attachPaymentIntentCheckoutMetadata(this.stripeService.client, {
        paymentIntentId: args.paymentIntentId,
        checkoutSessionId: args.checkoutSessionId,
        metadata: args.metadata,
      });
    }
  }

  async resolveClassPayCheckoutClientSecret(token: string): Promise<string> {
    const pending = await this.findPendingClassEnrollmentByPayToken(token);
    const sessionId = pending.stripeCheckoutSessionId;
    if (!sessionId) {
      throw new BadRequestException(
        'Checkout is not available for this enrollment.',
      );
    }

    const session =
      await this.stripeService.client.checkout.sessions.retrieve(sessionId);

    if (session.status === 'complete' && session.payment_status === 'paid') {
      throw new BadRequestException('This payment has already been completed.');
    }
    if (session.status === 'expired') {
      throw new BadRequestException('Payment link has expired.');
    }
    if (!session.client_secret) {
      throw new BadRequestException('Could not start checkout.');
    }
    return session.client_secret;
  }

  private sessionCalendarDateIso(startsAt: Date, timezone: string): string {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone || 'America/New_York',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(startsAt);
  }

  private sessionLabel(session: {
    startsAt: Date;
    endsAt: Date;
    timezone: string;
    section?: {
      label: string | null;
      startTime: string;
      endTime: string;
    } | null;
  }) {
    const when = session.startsAt.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZone: session.timezone,
    });
    const sectionPart = session.section?.label
      ? `${session.section.label} (${session.section.startTime}-${session.section.endTime})`
      : session.section
        ? `${session.section.startTime}-${session.section.endTime}`
        : null;
    return sectionPart ? `${when} - ${sectionPart}` : when;
  }

  private normalizeClassCustomer(dto: CreateAdminClassEnrollmentDto) {
    return {
      customerName: dto.customerName.trim(),
      customerEmail: dto.customerEmail.trim().toLowerCase(),
      customerPhone: dto.customerPhone?.trim() || null,
    };
  }

  private toBoxOfficeJson(
    value: Record<string, unknown> | undefined,
  ): Prisma.InputJsonValue | undefined {
    if (!value) return undefined;
    return value as Prisma.InputJsonValue;
  }

  private hashClassPayToken(rawToken: string): string {
    return createHash('sha256').update(rawToken).digest('hex');
  }

  private buildClassPayUrl(token: string): string {
    const frontendBase = this.stripeService.frontendUrl().replace(/\/$/, '');
    return `${frontendBase}/pay/class?token=${encodeURIComponent(token)}`;
  }

  private async findPendingClassEnrollmentByPayToken(rawToken: string) {
    const payTokenHash = this.hashClassPayToken(rawToken);
    const pkg =
      await this.repository.findPendingClassPackageEnrollmentByPayToken(
        payTokenHash,
      );
    if (pkg) {
      if (pkg.expiresAt && pkg.expiresAt.getTime() < Date.now()) {
        throw new BadRequestException('Payment link has expired.');
      }
      return pkg;
    }

    const enrollment =
      await this.repository.findPendingClassEnrollmentByPayToken(payTokenHash);
    if (!enrollment) {
      throw new NotFoundException('Payment link not found.');
    }
    if (enrollment.expiresAt && enrollment.expiresAt.getTime() < Date.now()) {
      throw new BadRequestException('Payment link has expired.');
    }
    return enrollment;
  }

  private async sendClassPaymentRequestEmail(args: {
    enrollmentId: string;
    customerName: string;
    customerEmail: string;
    amount: number;
    eventLabel: string;
    classLabel: string;
    payUrl: string;
  }): Promise<void> {
    const toEmail = args.customerEmail.trim().toLowerCase();
    if (!toEmail) return;

    const appPublicName =
      process.env.APP_PUBLIC_NAME?.trim() ?? 'Shamell Entertainment';
    const branding = emailBrandingFromProcessEnv();
    const amountUsd = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(args.amount);

    const mailInput = {
      recipientName: args.customerName.trim() || 'Guest',
      appPublicName,
      frontendBaseUrl: branding.siteBaseUrl,
      branding,
      enrollmentReference: args.enrollmentId.slice(0, 8).toUpperCase(),
      eventLabel: args.eventLabel,
      classLabel: args.classLabel,
      amountUsd,
      payUrl: args.payUrl,
    };

    await this.mail.sendTransactional({
      to: toEmail,
      toName: args.customerName,
      subject: buildClassPaymentRequestSubject(appPublicName),
      text: buildClassPaymentRequestText(mailInput),
      html: buildClassPaymentRequestHtml(mailInput),
    });
  }

  private async sendClassConfirmation(enrollment: {
    id: string;
    customerName: string;
    customerEmail: string;
    amount: Prisma.Decimal;
    currency: string;
    session: {
      startsAt: Date;
      endsAt: Date;
      timezone: string;
      section?: {
        label: string | null;
        startTime: string;
        endTime: string;
      } | null;
      event: { eventType: { name: string } };
    };
  }) {
    const eventName = enrollment.session.event.eventType.name;
    const amount = `${Number(enrollment.amount).toFixed(2)} ${enrollment.currency.toUpperCase()}`;
    const sessionLabel = this.sessionLabel(enrollment.session);
    const confirmationReference = formatEnrollmentReference(enrollment.id);
    const branding = emailBrandingFromProcessEnv();
    const { ok, errorText } = await this.mail.sendTransactional({
      to: enrollment.customerEmail,
      toName: enrollment.customerName,
      subject: buildClassEnrollmentConfirmationSubject(eventName),
      text: buildClassEnrollmentConfirmationText({
        eventName,
        customerName: enrollment.customerName,
        sessionLabel,
        amount,
        confirmationReference,
        siteBaseUrl: branding.siteBaseUrl,
      }),
      html: buildClassEnrollmentConfirmationHtml({
        eventName,
        customerName: enrollment.customerName,
        sessionLabel,
        amount,
        confirmationReference,
        branding,
      }),
    });
    if (!ok) {
      this.logger.warn(
        `class-confirmation-email-failed to=${enrollment.customerEmail} reason=${errorText ?? 'unknown'}`,
      );
      return false;
    }
    this.logger.log(
      `class-confirmation-email-sent to=${enrollment.customerEmail}`,
    );
    return true;
  }

  private async sendClassBundleConfirmation(
    pkg: {
      customerName: string;
      customerEmail: string;
      amount: Prisma.Decimal;
      currency: string;
      event: { eventType: { name: string } };
      items: Array<{
        enrollment: {
          id: string;
          amount: Prisma.Decimal;
          currency: string;
          session: {
            startsAt: Date;
            endsAt: Date;
            timezone: string;
            section?: {
              label: string | null;
              startTime: string;
              endTime: string;
            } | null;
            event: { eventType: { name: string } };
          };
        };
      }>;
    },
    checkoutFlow: string | undefined,
  ) {
    const eventName = pkg.event.eventType.name;
    const totalAmount = `${Number(pkg.amount).toFixed(2)} ${pkg.currency.toUpperCase()}`;
    const firstSession = pkg.items[0]?.enrollment.session;
    const dateLabel = firstSession
      ? this.sessionCalendarDateIso(
          firstSession.startsAt,
          firstSession.timezone,
        )
      : 'your scheduled date';
    const lines = pkg.items.map((item) => ({
      sessionLabel: this.sessionLabel(item.enrollment.session),
      amount: `${Number(item.enrollment.amount).toFixed(2)} ${item.enrollment.currency.toUpperCase()}`,
      confirmationReference: formatEnrollmentReference(item.enrollment.id),
    }));
    const branding = emailBrandingFromProcessEnv();
    const { ok, errorText } = await this.mail.sendTransactional({
      to: pkg.customerEmail,
      toName: pkg.customerName,
      subject: buildClassBundleConfirmationSubject(eventName, pkg.items.length),
      text: buildClassBundleConfirmationText({
        eventName,
        customerName: pkg.customerName,
        dateLabel,
        totalAmount,
        lines,
        siteBaseUrl: branding.siteBaseUrl,
      }),
      html: buildClassBundleConfirmationHtml({
        eventName,
        customerName: pkg.customerName,
        dateLabel,
        totalAmount,
        lines,
        branding,
      }),
    });
    if (!ok) {
      this.logger.warn(
        `class-bundle-email-failed flow=${checkoutFlow ?? 'package'} to=${pkg.customerEmail} reason=${errorText ?? 'unknown'}`,
      );
      return false;
    }
    this.logger.log(
      `class-bundle-email-sent flow=${checkoutFlow ?? 'package'} to=${pkg.customerEmail} sections=${pkg.items.length}`,
    );
    return true;
  }

  private async createAdminPaidPackageEnrollment(args: {
    eventId: string;
    amount: number;
    customer: {
      customerName: string;
      customerEmail: string;
      customerPhone: string | null;
    };
    selections: Prisma.InputJsonValue;
    resolvedItems: Array<{
      session: { id: string; price: Prisma.Decimal; currency: string };
      weekday: number;
    }>;
    checkoutFlow: string;
    adminUserId: string;
    boxOfficeDetails?: Record<string, unknown>;
  }) {
    const now = new Date();
    const packageEnrollment =
      await this.repository.createClassPackageEnrollment(
        {
          eventId: args.eventId,
          amount: args.amount,
          currency: 'usd',
          status: UpcomingClassEnrollmentStatus.PAID,
          paymentChannel: VenueReservationPaymentChannel.CASH,
          paymentMethodType: 'cash',
          paidAt: now,
          customerName: args.customer.customerName,
          customerEmail: args.customer.customerEmail,
          customerPhone: args.customer.customerPhone,
          selections: args.selections,
          createdByAdminId: args.adminUserId,
          boxOfficeDetails: this.toBoxOfficeJson(args.boxOfficeDetails),
        },
        ADMIN_CLASS_PACKAGE_ENROLLMENT_INCLUDE,
      );

    for (const row of args.resolvedItems) {
      const enrollment = await this.repository.createClassEnrollment({
        sessionId: row.session.id,
        amount: row.session.price,
        currency: row.session.currency,
        status: UpcomingClassEnrollmentStatus.PAID,
        paymentChannel: VenueReservationPaymentChannel.CASH,
        paymentMethodType: 'cash',
        paidAt: now,
        customerName: args.customer.customerName,
        customerEmail: args.customer.customerEmail,
        customerPhone: args.customer.customerPhone,
        createdByAdminId: args.adminUserId,
      });
      await this.repository.createClassPackageEnrollmentItem({
        packageEnrollmentId: packageEnrollment.id,
        enrollmentId: enrollment.id,
        weekday: row.weekday,
      });
    }

    const refreshed =
      await this.repository.findClassPackageEnrollmentWithAdminItems(
        packageEnrollment.id,
      );
    if (!refreshed) {
      throw new InternalServerErrorException(
        'Could not reload class package enrollment.',
      );
    }
    const emailPkg = refreshed;
    const isDayBundle = args.checkoutFlow === 'class_session_bundle';
    const isSessionCart = args.checkoutFlow === 'class_session_cart';

    let sent = false;
    if (emailPkg.items.length === 1) {
      sent = await this.sendClassConfirmation(emailPkg.items[0].enrollment);
    } else {
      sent = await this.sendClassBundleConfirmation(
        emailPkg,
        args.checkoutFlow,
      );
    }
    if (sent) {
      await this.repository.stampPackageEnrollmentEmailSent(emailPkg.id, now);
    }

    const firstSession = emailPkg.items[0]?.enrollment.session;
    const bundleDate =
      isDayBundle && firstSession
        ? this.sessionCalendarDateIso(
            firstSession.startsAt,
            firstSession.timezone,
          )
        : null;
    const contextLabel =
      isDayBundle && bundleDate
        ? `${emailPkg.event.eventType.name} — ${emailPkg.items.length} section(s) on ${bundleDate}`
        : isSessionCart
          ? `${emailPkg.event.eventType.name} — ${emailPkg.items.length} class${emailPkg.items.length === 1 ? '' : 'es'}`
          : `${emailPkg.event.eventType.name} — class package (${emailPkg.items.length} sessions)`;

    await this.adminPaymentNotify.notifyPaymentOutcome({
      outcome: 'PAID',
      flow: isDayBundle
        ? 'CLASS_DAY_BUNDLE'
        : isSessionCart
          ? 'CLASS_SESSION_CART'
          : 'CLASS_PACKAGE',
      customerName: emailPkg.customerName,
      customerEmail: emailPkg.customerEmail,
      amount: Number(emailPkg.amount),
      currency: emailPkg.currency,
      contextLabel,
      reference: emailPkg.id.slice(0, 8).toUpperCase(),
    });

    this.logger.log(
      `admin-class-cash packageId=${emailPkg.id} admin=${args.adminUserId}`,
    );
    return emailPkg;
  }

  private async resolveAdminClassPurchase(dto: CreateAdminClassEnrollmentDto) {
    const event = await this.repository.findAdminUpcomingEventOrThrow(
      dto.upcomingEventId,
    );
    if (event.experienceType !== UpcomingExperienceType.CLASSES) {
      throw new BadRequestException(
        'This event does not offer class sessions.',
      );
    }

    if (dto.purchaseKind === 'session') {
      if (!dto.sessionId?.trim()) {
        throw new BadRequestException('sessionId is required.');
      }
      const session = await this.repository.findActiveClassSessionForEvent(
        dto.sessionId.trim(),
        event.id,
      );
      if (!session) throw new NotFoundException('Class session not found.');
      if (session.endsAt <= new Date()) {
        throw new BadRequestException('This session has already ended.');
      }
      const remaining = await this.repository.seatsRemaining(
        session.id,
        session.capacity,
      );
      if (remaining <= 0) {
        throw new ConflictException('This session is full.');
      }
      return { kind: 'session' as const, event, session };
    }

    if (dto.purchaseKind === 'day_bundle') {
      if (!dto.sessionIds?.length) {
        throw new BadRequestException('sessionIds is required.');
      }
      const uniqueIds = [...new Set(dto.sessionIds)];
      if (uniqueIds.length !== dto.sessionIds.length) {
        throw new BadRequestException('Duplicate session ids are not allowed.');
      }

      const rows = await this.repository.findActiveClassSessionsByIdsForEvent(
        uniqueIds,
        event.id,
      );
      if (rows.length !== uniqueIds.length) {
        throw new NotFoundException(
          'One or more class sessions were not found.',
        );
      }

      const now = new Date();
      let totalAmount = 0;
      const resolved: Array<{
        session: (typeof rows)[0];
        weekday: number;
      }> = [];

      for (const sessionId of uniqueIds) {
        const session = rows.find((r) => r.id === sessionId);
        if (!session) continue;
        if (session.endsAt <= now) {
          throw new BadRequestException(
            'One or more sessions have already ended.',
          );
        }
        const remaining = await this.repository.seatsRemaining(
          session.id,
          session.capacity,
        );
        if (remaining <= 0) {
          throw new ConflictException('One or more sessions are full.');
        }
        totalAmount += Number(session.price);
        resolved.push({
          session,
          weekday: session.weekday ?? session.section?.weekday ?? 0,
        });
      }

      const amountCents = Math.round(totalAmount * 100);
      if (amountCents < 50) {
        throw new BadRequestException('Invalid bundle total.');
      }

      const bundleDateIso = this.sessionCalendarDateIso(
        resolved[0].session.startsAt,
        resolved[0].session.timezone,
      );
      for (const row of resolved) {
        const rowIso = this.sessionCalendarDateIso(
          row.session.startsAt,
          row.session.timezone,
        );
        if (rowIso !== bundleDateIso) {
          throw new BadRequestException(
            'All selected sessions must be on the same calendar day.',
          );
        }
      }

      const sectionCount = resolved.length;
      return {
        kind: 'day_bundle' as const,
        event,
        resolved,
        totalAmount,
        checkoutFlow: 'class_session_bundle',
        selections: buildClassSessionBundleSelections({
          dateIso: bundleDateIso,
          sessionIds: uniqueIds,
          items: resolved.map((row) => ({
            sessionId: row.session.id,
            weekday: row.weekday,
            sectionId: row.session.sectionId,
            amount: Number(row.session.price),
          })),
        }),
        productName: `${event.eventType.name} — ${sectionCount} class${sectionCount === 1 ? '' : 'es'}`,
        productDescription: `${sectionCount} section(s) on ${bundleDateIso}`,
        classLabel: `${sectionCount} section(s) on ${bundleDateIso}`,
      };
    }

    if (dto.purchaseKind === 'session_cart') {
      if (!dto.sessionIds?.length) {
        throw new BadRequestException('sessionIds is required.');
      }
      const uniqueIds = [...new Set(dto.sessionIds)];
      if (uniqueIds.length !== dto.sessionIds.length) {
        throw new BadRequestException('Duplicate session ids are not allowed.');
      }

      const rows = await this.repository.findActiveClassSessionsByIdsForEvent(
        uniqueIds,
        event.id,
      );
      if (rows.length !== uniqueIds.length) {
        throw new NotFoundException(
          'One or more class sessions were not found.',
        );
      }

      const now = new Date();
      let totalAmount = 0;
      const resolved: Array<{
        session: (typeof rows)[0];
        weekday: number;
        dateIso: string;
      }> = [];

      for (const sessionId of uniqueIds) {
        const session = rows.find((r) => r.id === sessionId);
        if (!session) continue;
        if (session.endsAt <= now) {
          throw new BadRequestException(
            'One or more sessions have already ended.',
          );
        }
        const remaining = await this.repository.seatsRemaining(
          session.id,
          session.capacity,
        );
        if (remaining <= 0) {
          throw new ConflictException('One or more sessions are full.');
        }
        totalAmount += Number(session.price);
        resolved.push({
          session,
          weekday: session.weekday ?? session.section?.weekday ?? 0,
          dateIso: this.sessionCalendarDateIso(
            session.startsAt,
            session.timezone,
          ),
        });
      }

      const amountCents = Math.round(totalAmount * 100);
      if (amountCents < 50) {
        throw new BadRequestException('Invalid cart total.');
      }

      const sectionCount = resolved.length;
      const dayCount = new Set(resolved.map((r) => r.dateIso)).size;
      return {
        kind: 'session_cart' as const,
        event,
        resolved,
        totalAmount,
        checkoutFlow: 'class_session_cart',
        selections: buildClassSessionCartSelections({
          sessionIds: uniqueIds,
          items: resolved.map((row) => ({
            sessionId: row.session.id,
            weekday: row.weekday,
            sectionId: row.session.sectionId,
            dateIso: row.dateIso,
            amount: Number(row.session.price),
          })),
        }),
        productName: `${event.eventType.name} — ${sectionCount} class${sectionCount === 1 ? '' : 'es'}`,
        productDescription: `${sectionCount} class${sectionCount === 1 ? '' : 'es'} across ${dayCount} day${dayCount === 1 ? '' : 's'}`,
        classLabel: `${sectionCount} class${sectionCount === 1 ? '' : 'es'} across ${dayCount} day${dayCount === 1 ? '' : 's'}`,
      };
    }

    if (!dto.monthIso?.trim()) {
      throw new BadRequestException('monthIso is required.');
    }
    const venueConfig = await this.repository.findVenueConfigForMonthPackage(
      event.id,
    );
    if (!venueConfig?.classPackageEnabled) {
      throw new BadRequestException(
        'Full month package is not available for this event.',
      );
    }
    if (
      venueConfig.reservationEventTemplate?.scheduleMode !==
      ReservationEventScheduleMode.RECURRING_WEEKLY
    ) {
      throw new BadRequestException(
        'Full month package is only available for recurring class events.',
      );
    }

    const packagePrice = Number(venueConfig.classPackagePrice);
    const amountCents = Math.round(packagePrice * 100);
    if (!Number.isFinite(packagePrice) || amountCents < 50) {
      throw new BadRequestException('Invalid full month package price.');
    }

    assertValidMonthIso(dto.monthIso);
    const timezone =
      venueConfig.reservationEventTemplate?.timezone ??
      venueConfig.reservationTimezone ??
      'America/New_York';
    const currentMonthIso = currentCalendarMonthIso(timezone);
    if (dto.monthIso !== currentMonthIso) {
      throw new BadRequestException(
        'Full month package is only available for the current month.',
      );
    }

    const monthSessions = await resolveMonthSessions(
      this.prisma,
      event.id,
      dto.monthIso,
      timezone,
    );
    await assertMonthSessionsAvailable(monthSessions, (sessionId, capacity) =>
      this.repository.seatsRemaining(sessionId, capacity),
    );

    const sessionIds = monthSessions.map((s) => s.id);
    const resolved = monthSessions.map((session) => ({
      session,
      weekday: session.weekday ?? session.section?.weekday ?? 0,
    }));
    const packageLabel =
      venueConfig.classPackageLabel?.trim() || 'Full month package';
    const sessionCount = resolved.length;

    return {
      kind: 'month_package' as const,
      event,
      resolved,
      totalAmount: packagePrice,
      checkoutFlow: 'class_month_package',
      selections: buildClassMonthPackageSelections({
        monthIso: dto.monthIso,
        sessionIds,
        items: resolved.map((row) => ({
          sessionId: row.session.id,
          weekday: row.weekday,
          sectionId: row.session.sectionId,
          amount: Number(row.session.price),
        })),
      }),
      productName: `${event.eventType.name} — ${packageLabel}`,
      productDescription: `${sessionCount} class${sessionCount === 1 ? '' : 'es'} in ${dto.monthIso}`,
      classLabel: `${packageLabel} (${dto.monthIso})`,
    };
  }
}
