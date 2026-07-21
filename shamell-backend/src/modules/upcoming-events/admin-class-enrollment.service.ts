import {
  BadRequestException,
  ConflictException,
  forwardRef,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { createHash, randomBytes } from 'crypto';
import {
  EventPublicSection,
  Prisma,
  ReservationEventScheduleMode,
  UpcomingClassEnrollmentStatus,
  UpcomingExperienceType,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { AdminPaymentNotifyService } from '../mail/admin-payment-notify.service';
import { emailBrandingFromProcessEnv } from '../mail/email-html-branding';
import { STRIPE_EMBEDDED_CHECKOUT_BASE } from '../stripe/stripe-embedded-checkout.util';
import {
  stripeAutomaticTaxParams,
  stripeTaxProductData,
} from '../stripe/stripe-tax.util';
import { StripeService } from '../stripe/stripe.service';
import {
  assessClassEventReadiness,
  templateSnapshotFromVenueConfig,
} from './admin-bookable-class.util';
import {
  buildClassBundleConfirmationHtml,
  buildClassBundleConfirmationSubject,
  buildClassBundleConfirmationText,
} from './class-bundle-confirmation.mail';
import {
  buildClassEnrollmentConfirmationHtml,
  buildClassEnrollmentConfirmationSubject,
  buildClassEnrollmentConfirmationText,
} from './class-enrollment-confirmation.mail';
import {
  buildClassMonthPackageSelections,
  buildClassSessionBundleSelections,
} from './class-package-selections.util';
import {
  assertMonthSessionsAvailable,
  assertValidMonthIso,
  currentCalendarMonthIso,
  listPurchasableMonths,
  resolveMonthSessions,
  sessionCalendarMonthIso,
} from './class-month-package.util';
import { mapClassSessionPublic } from './class-session-public.util';
import { buildPublicScheduleDisplay } from './upcoming-event-public-schedule.util';
import {
  buildClassPaymentRequestHtml,
  buildClassPaymentRequestSubject,
  buildClassPaymentRequestText,
} from './class-payment-request.mail';
import { CreateAdminClassEnrollmentDto } from './dto/create-admin-class-enrollment.dto';
import { formatEnrollmentReference } from './enrollment-reference.util';
import { UpcomingEventsService } from './upcoming-events.service';

const CHECKOUT_TTL_MINUTES = 30;

@Injectable()
export class AdminClassEnrollmentService {
  private readonly logger = new Logger(AdminClassEnrollmentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly stripeService: StripeService,
    private readonly mail: MailService,
    private readonly adminPaymentNotify: AdminPaymentNotifyService,
    @Inject(forwardRef(() => UpcomingEventsService))
    private readonly upcomingEvents: UpcomingEventsService,
  ) {}

  async getAdminClassBookingContext(eventId: string) {
    return this.getAdminClassBookingContextLite(eventId);
  }

  async getAdminClassBookingContextLite(eventId: string) {
    const event = await this.assertAdminUpcomingEvent(eventId);
    if (event.experienceType !== UpcomingExperienceType.CLASSES) {
      throw new BadRequestException('This event is not a class event.');
    }
    if (!event.slug?.trim()) {
      throw new BadRequestException(
        'Event slug is required for class booking.',
      );
    }

    const now = new Date();
    const venueConfigRow = await this.prisma.upcomingVenueConfig.findUnique({
      where: { eventId: event.id },
      include: {
        reservationEventTemplate: {
          include: {
            weekdays: { orderBy: { weekday: 'asc' } },
            classSections: {
              orderBy: [{ weekday: 'asc' }, { sortOrder: 'asc' }],
            },
          },
        },
      },
    });

    const schedule = venueConfigRow?.reservationEventTemplate
      ? buildPublicScheduleDisplay(venueConfigRow.reservationEventTemplate)
      : null;
    const timezone =
      schedule?.mode === 'RECURRING_WEEKLY'
        ? schedule.timezone
        : 'America/New_York';

    const sessionRows = await this.prisma.upcomingClassSession.findMany({
      where: {
        eventId: event.id,
        isActive: true,
        endsAt: { gt: now },
      },
      include: { section: true },
      orderBy: [{ startsAt: 'asc' }, { sortOrder: 'asc' }],
    });

    const seatCounts = await this.batchSeatsRemaining(
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
    const events = await this.prisma.event.findMany({
      where: {
        publicSection: EventPublicSection.UPCOMING_EVENTS,
        isActive: true,
        experienceType: UpcomingExperienceType.CLASSES,
      },
      include: {
        eventType: true,
        venueConfig: {
          include: {
            reservationEventTemplate: {
              include: {
                weekdays: true,
                classSections: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

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
      eventIds.length === 0
        ? []
        : await this.prisma.upcomingClassSession.findMany({
            where: {
              eventId: { in: eventIds },
              isActive: true,
              endsAt: { gt: now },
            },
            select: { id: true, capacity: true, eventId: true },
          });

    const seatCounts = await this.batchSeatsRemaining(
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
      const enrollment = await this.prisma.upcomingClassEnrollment.create({
        data: {
          sessionId: resolved.session.id,
          amount: resolved.session.price,
          currency: resolved.session.currency,
          status: UpcomingClassEnrollmentStatus.PAID,
          paymentMethodType: 'cash',
          paidAt: new Date(),
          customerName: customer.customerName,
          customerEmail: customer.customerEmail,
          customerPhone: customer.customerPhone,
        },
        include: {
          session: {
            include: {
              section: true,
              event: { include: { eventType: true } },
            },
          },
        },
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
      const checkout = await this.stripeService.client.checkout.sessions.create({
        ...STRIPE_EMBEDDED_CHECKOUT_BASE,
        mode: 'payment',
        customer_email: customer.customerEmail,
        ...stripeAutomaticTaxParams(),
        payment_intent_data: {
          receipt_email: customer.customerEmail,
        },
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: session.currency,
              unit_amount: amountCents,
              product_data: stripeTaxProductData({
                name: `${eventName} — class`,
                description: this.sessionLabel(session),
              }),
            },
          },
        ],
        metadata: {
          flow: 'class_session',
          adminUserId,
          paymentChannel: 'STRIPE',
        },
        return_url: returnUrl,
        expires_at: Math.floor(expiresAt.getTime() / 1000),
      } as Parameters<
        StripeService['client']['checkout']['sessions']['create']
      >[0]);

      if (!checkout.client_secret) {
        throw new BadRequestException('Could not start checkout.');
      }

      const enrollment = await this.prisma.upcomingClassEnrollment.create({
        data: {
          sessionId: session.id,
          amount: session.price,
          currency: session.currency,
          status: UpcomingClassEnrollmentStatus.PENDING_PAYMENT,
          stripeCheckoutSessionId: checkout.id,
          payTokenHash,
          customerName: customer.customerName,
          customerEmail: customer.customerEmail,
          customerPhone: customer.customerPhone,
          expiresAt,
        },
      });

      await this.stripeService.client.checkout.sessions.update(checkout.id, {
        metadata: {
          flow: 'class_session',
          enrollmentId: enrollment.id,
          adminUserId,
          paymentChannel: 'STRIPE',
        },
      });

      const payUrl = this.buildClassPayUrl(rawToken);
      await this.sendClassPaymentRequestEmail({
        enrollmentId: enrollment.id,
        customerName: customer.customerName,
        customerEmail: customer.customerEmail,
        amount: Number(session.price),
        eventLabel: eventName,
        classLabel: this.sessionLabel(session),
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

    const checkout = await this.stripeService.client.checkout.sessions.create({
      ...STRIPE_EMBEDDED_CHECKOUT_BASE,
      mode: 'payment',
      customer_email: customer.customerEmail,
      ...stripeAutomaticTaxParams(),
      payment_intent_data: {
        receipt_email: customer.customerEmail,
      },
      line_items: [
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
      metadata: {
        flow: resolved.checkoutFlow,
        adminUserId,
        paymentChannel: 'STRIPE',
      },
      return_url: returnUrl,
      expires_at: Math.floor(expiresAt.getTime() / 1000),
    } as Parameters<
      StripeService['client']['checkout']['sessions']['create']
    >[0]);

    if (!checkout.client_secret) {
      throw new BadRequestException('Could not start checkout.');
    }

    const packageEnrollment =
      await this.prisma.upcomingClassPackageEnrollment.create({
        data: {
          eventId: resolved.event.id,
          amount: resolved.totalAmount,
          currency: 'usd',
          status: UpcomingClassEnrollmentStatus.PENDING_PAYMENT,
          stripeCheckoutSessionId: checkout.id,
          payTokenHash,
          customerName: customer.customerName,
          customerEmail: customer.customerEmail,
          customerPhone: customer.customerPhone,
          selections: resolved.selections,
          expiresAt,
        },
      });

    for (const row of resolved.resolved) {
      const enrollment = await this.prisma.upcomingClassEnrollment.create({
        data: {
          sessionId: row.session.id,
          amount: row.session.price,
          currency: row.session.currency,
          status: UpcomingClassEnrollmentStatus.PENDING_PAYMENT,
          customerName: customer.customerName,
          customerEmail: customer.customerEmail,
          customerPhone: customer.customerPhone,
          expiresAt,
        },
      });
      await this.prisma.upcomingClassPackageEnrollmentItem.create({
        data: {
          packageEnrollmentId: packageEnrollment.id,
          enrollmentId: enrollment.id,
          weekday: row.weekday,
        },
      });
    }

    await this.stripeService.client.checkout.sessions.update(checkout.id, {
      metadata: {
        flow: resolved.checkoutFlow,
        packageEnrollmentId: packageEnrollment.id,
        adminUserId,
        paymentChannel: 'STRIPE',
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

  async resolveClassPayCheckoutClientSecret(token: string): Promise<string> {
    const pending = await this.findPendingClassEnrollmentByPayToken(token);
    const sessionId = pending.stripeCheckoutSessionId;
    if (!sessionId) {
      throw new BadRequestException(
        'Checkout is not available for this enrollment.',
      );
    }

    const session = await this.stripeService.client.checkout.sessions.retrieve(
      sessionId,
    );

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

  private async assertAdminUpcomingEvent(eventId: string) {
    const event = await this.prisma.event.findFirst({
      where: { id: eventId, publicSection: EventPublicSection.UPCOMING_EVENTS },
      include: { eventType: true },
    });
    if (!event) throw new NotFoundException('Upcoming event not found.');
    return event;
  }

  private async batchSeatsRemaining(
    sessions: Array<{ id: string; capacity: number }>,
  ): Promise<Map<string, number>> {
    const counts = new Map<string, number>();
    if (sessions.length === 0) return counts;

    const now = new Date();
    const enrollments = await this.prisma.upcomingClassEnrollment.findMany({
      where: {
        sessionId: { in: sessions.map((s) => s.id) },
        OR: [
          { status: UpcomingClassEnrollmentStatus.PAID },
          {
            status: UpcomingClassEnrollmentStatus.PENDING_PAYMENT,
            OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
          },
        ],
      },
      select: { sessionId: true },
    });
    for (const row of enrollments) {
      counts.set(row.sessionId, (counts.get(row.sessionId) ?? 0) + 1);
    }
    return counts;
  }

  private async seatsRemaining(sessionId: string, capacity: number) {
    const now = new Date();
    const blocking = await this.prisma.upcomingClassEnrollment.count({
      where: {
        sessionId,
        OR: [
          { status: UpcomingClassEnrollmentStatus.PAID },
          {
            status: UpcomingClassEnrollmentStatus.PENDING_PAYMENT,
            OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
          },
        ],
      },
    });
    return Math.max(0, capacity - blocking);
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
      ? `${session.section.label} (${session.section.startTime}–${session.section.endTime})`
      : session.section
        ? `${session.section.startTime}–${session.section.endTime}`
        : null;
    return sectionPart ? `${when} — ${sectionPart}` : when;
  }

  private packageEnrollmentInclude() {
    return {
      event: { include: { eventType: true } },
      items: {
        include: {
          enrollment: {
            include: {
              session: {
                include: {
                  section: true,
                  event: { include: { eventType: true } },
                },
              },
            },
          },
        },
      },
    } as const;
  }

  private normalizeClassCustomer(dto: CreateAdminClassEnrollmentDto) {
    return {
      customerName: dto.customerName.trim(),
      customerEmail: dto.customerEmail.trim().toLowerCase(),
      customerPhone: dto.customerPhone?.trim() || null,
    };
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
    const pkg = await this.prisma.upcomingClassPackageEnrollment.findFirst({
      where: {
        payTokenHash,
        status: UpcomingClassEnrollmentStatus.PENDING_PAYMENT,
      },
      orderBy: { createdAt: 'desc' },
    });
    if (pkg) {
      if (pkg.expiresAt && pkg.expiresAt.getTime() < Date.now()) {
        throw new BadRequestException('Payment link has expired.');
      }
      return pkg;
    }

    const enrollment = await this.prisma.upcomingClassEnrollment.findFirst({
      where: {
        payTokenHash,
        status: UpcomingClassEnrollmentStatus.PENDING_PAYMENT,
      },
      orderBy: { createdAt: 'desc' },
    });
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
  }) {
    const now = new Date();
    const packageEnrollment =
      await this.prisma.upcomingClassPackageEnrollment.create({
        data: {
          eventId: args.eventId,
          amount: args.amount,
          currency: 'usd',
          status: UpcomingClassEnrollmentStatus.PAID,
          paymentMethodType: 'cash',
          paidAt: now,
          customerName: args.customer.customerName,
          customerEmail: args.customer.customerEmail,
          customerPhone: args.customer.customerPhone,
          selections: args.selections,
        },
        include: this.packageEnrollmentInclude(),
      });

    for (const row of args.resolvedItems) {
      const enrollment = await this.prisma.upcomingClassEnrollment.create({
        data: {
          sessionId: row.session.id,
          amount: row.session.price,
          currency: row.session.currency,
          status: UpcomingClassEnrollmentStatus.PAID,
          paymentMethodType: 'cash',
          paidAt: now,
          customerName: args.customer.customerName,
          customerEmail: args.customer.customerEmail,
          customerPhone: args.customer.customerPhone,
        },
        include: {
          session: {
            include: {
              section: true,
              event: { include: { eventType: true } },
            },
          },
        },
      });
      await this.prisma.upcomingClassPackageEnrollmentItem.create({
        data: {
          packageEnrollmentId: packageEnrollment.id,
          enrollmentId: enrollment.id,
          weekday: row.weekday,
        },
      });
    }

    const refreshed =
      await this.prisma.upcomingClassPackageEnrollment.findUnique({
        where: { id: packageEnrollment.id },
        include: this.packageEnrollmentInclude(),
      });
    const emailPkg = refreshed ?? packageEnrollment;
    const isDayBundle = args.checkoutFlow === 'class_session_bundle';

    let sent = false;
    if (emailPkg.items.length === 1) {
      sent = await this.sendClassConfirmation(emailPkg.items[0].enrollment);
    } else {
      sent = await this.sendClassBundleConfirmation(emailPkg, args.checkoutFlow);
    }
    if (sent) {
      await this.prisma.upcomingClassPackageEnrollment.update({
        where: { id: emailPkg.id },
        data: { customerEmailSentAt: now },
      });
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
        : `${emailPkg.event.eventType.name} — class package (${emailPkg.items.length} sessions)`;

    await this.adminPaymentNotify.notifyPaymentOutcome({
      outcome: 'PAID',
      flow: isDayBundle ? 'CLASS_DAY_BUNDLE' : 'CLASS_PACKAGE',
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
    const event = await this.assertAdminUpcomingEvent(dto.upcomingEventId);
    if (event.experienceType !== UpcomingExperienceType.CLASSES) {
      throw new BadRequestException('This event does not offer class sessions.');
    }

    if (dto.purchaseKind === 'session') {
      if (!dto.sessionId?.trim()) {
        throw new BadRequestException('sessionId is required.');
      }
      const session = await this.prisma.upcomingClassSession.findFirst({
        where: {
          id: dto.sessionId.trim(),
          eventId: event.id,
          isActive: true,
        },
      });
      if (!session) throw new NotFoundException('Class session not found.');
      if (session.endsAt <= new Date()) {
        throw new BadRequestException('This session has already ended.');
      }
      const remaining = await this.seatsRemaining(session.id, session.capacity);
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

      const rows = await this.prisma.upcomingClassSession.findMany({
        where: {
          id: { in: uniqueIds },
          eventId: event.id,
          isActive: true,
        },
        include: { section: true },
      });
      if (rows.length !== uniqueIds.length) {
        throw new NotFoundException('One or more class sessions were not found.');
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
        const remaining = await this.seatsRemaining(
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

    if (!dto.monthIso?.trim()) {
      throw new BadRequestException('monthIso is required.');
    }
    const venueConfig = await this.prisma.upcomingVenueConfig.findUnique({
      where: { eventId: event.id },
      include: {
        reservationEventTemplate: {
          include: { weekdays: true },
        },
      },
    });
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
      this.seatsRemaining(sessionId, capacity),
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
