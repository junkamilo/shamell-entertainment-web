import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Prisma,
  ReservationEventScheduleMode,
  UpcomingClassEnrollmentStatus,
  UpcomingExperienceType,
} from '@prisma/client';
import { STRIPE_EMBEDDED_CHECKOUT_BASE } from '../../stripe/utils/stripe-embedded-checkout.util';
import {
  stripeAutomaticTaxParams,
  stripeTaxProductData,
} from '../../stripe/utils/stripe-tax.util';
import { StripeService } from '../../stripe/services/stripe.service';
import { CHECKOUT_TTL_MINUTES } from '../constants/upcoming-events.constants';
import { UpcomingEventsRepository } from './upcoming-events.repository';
import { CreateClassCheckoutDto } from '../dto/create-class-checkout.dto';
import { CreateClassBundleCheckoutDto } from '../dto/create-class-bundle-checkout.dto';
import { CreateClassPackageCheckoutDto } from '../dto/create-class-package-checkout.dto';
import { CreateFixedEventCheckoutDto } from '../dto/create-fixed-event-checkout.dto';
import { resolveUpcomingPurchaseContext } from '../utils/upcoming-purchase-mode.util';
import { fixedTicketsRemaining } from '../utils/upcoming-fixed-ticket.util';
import {
  buildClassMonthPackageSelections,
  buildClassSessionBundleSelections,
} from '../utils/class-package-selections.util';
import {
  assertMonthSessionsAvailable,
  assertValidMonthIso,
  currentCalendarMonthIso,
  resolveMonthSessions,
} from '../utils/class-month-package.util';
import {
  sessionCalendarDateIso,
  sessionLabel as formatSessionLabel,
} from '../utils/upcoming-events-mapper.util';

type StripeCheckoutCreateParams = Parameters<
  StripeService['client']['checkout']['sessions']['create']
>[0];

type PackageChildRow = {
  session: {
    id: string;
    price: Prisma.Decimal | number;
    currency: string;
    sectionId?: string | null;
  };
  weekday: number;
};

@Injectable()
export class UpcomingEventsCheckoutService {
  constructor(
    private readonly repository: UpcomingEventsRepository,
    private readonly stripeService: StripeService,
  ) {}

  async createClassCheckout(slug: string, dto: CreateClassCheckoutDto) {
    const event = await this.repository.findPublicUpcomingBySlug(slug);
    this.assertClassesExperience(event);
    const session = await this.repository.findActiveClassSessionForEvent(
      dto.sessionId,
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

    const amountCents = Math.round(Number(session.price) * 100);
    if (amountCents < 50) {
      throw new BadRequestException('Invalid session price.');
    }

    const expiresAt = new Date(Date.now() + CHECKOUT_TTL_MINUTES * 60 * 1000);
    const frontendUrl = this.stripeService.frontendUrl();
    const returnUrl = `${frontendUrl}/on-coming-events/${event.slug}/classes/return?session_id={CHECKOUT_SESSION_ID}`;

    const checkout = await this.createEmbeddedCheckoutSession({
      ...STRIPE_EMBEDDED_CHECKOUT_BASE,
      mode: 'payment',
      customer_email: dto.customerEmail,
      ...stripeAutomaticTaxParams(),
      payment_intent_data: {
        receipt_email: dto.customerEmail.trim().toLowerCase(),
      },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: session.currency,
            unit_amount: amountCents,
            product_data: stripeTaxProductData({
              name: `${event.eventType.name} ? class`,
              description: formatSessionLabel(session),
            }),
          },
        },
      ],
      metadata: { flow: 'class_session' },
      return_url: returnUrl,
      expires_at: Math.floor(expiresAt.getTime() / 1000),
    });

    const enrollment = await this.repository.createClassEnrollment(
      {
        sessionId: session.id,
        amount: session.price,
        currency: session.currency,
        status: UpcomingClassEnrollmentStatus.PENDING_PAYMENT,
        stripeCheckoutSessionId: checkout.id,
        customerName: dto.customerName.trim(),
        customerEmail: dto.customerEmail.trim().toLowerCase(),
        customerPhone: dto.customerPhone?.trim() || null,
        expiresAt,
      },
      {},
    );

    await this.attachCheckoutFlowMetadata(checkout.id, {
      flow: 'class_session',
      enrollmentId: enrollment.id,
    });

    return {
      clientSecret: checkout.client_secret!,
      enrollmentId: enrollment.id,
    };
  }

  async createClassBundleCheckout(
    slug: string,
    dto: CreateClassBundleCheckoutDto,
  ) {
    const event = await this.repository.findPublicUpcomingBySlug(slug);
    this.assertClassesExperience(event);

    const uniqueIds = [...new Set(dto.sessionIds)];
    if (uniqueIds.length !== dto.sessionIds.length) {
      throw new BadRequestException('Duplicate session ids are not allowed.');
    }

    const rows = await this.repository.findActiveClassSessionsByIdsForEvent(
      uniqueIds,
      event.id,
    );
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

    const bundleDateIso = sessionCalendarDateIso(
      resolved[0].session.startsAt,
      resolved[0].session.timezone,
    );
    for (const row of resolved) {
      const rowIso = sessionCalendarDateIso(
        row.session.startsAt,
        row.session.timezone,
      );
      if (rowIso !== bundleDateIso) {
        throw new BadRequestException(
          'All selected sessions must be on the same calendar day.',
        );
      }
    }

    const expiresAt = new Date(Date.now() + CHECKOUT_TTL_MINUTES * 60 * 1000);
    const frontendUrl = this.stripeService.frontendUrl();
    const returnUrl = `${frontendUrl}/on-coming-events/${event.slug}/classes/package-return?session_id={CHECKOUT_SESSION_ID}`;
    const sectionCount = resolved.length;
    const dateLabel = bundleDateIso;

    const checkout = await this.createEmbeddedCheckoutSession({
      ...STRIPE_EMBEDDED_CHECKOUT_BASE,
      mode: 'payment',
      customer_email: dto.customerEmail,
      ...stripeAutomaticTaxParams(),
      payment_intent_data: {
        receipt_email: dto.customerEmail.trim().toLowerCase(),
      },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'usd',
            unit_amount: amountCents,
            product_data: stripeTaxProductData({
              name: `${event.eventType.name} ? ${sectionCount} class${sectionCount === 1 ? '' : 'es'}`,
              description: `${sectionCount} section(s) on ${dateLabel}`,
            }),
          },
        },
      ],
      metadata: { flow: 'class_session_bundle' },
      return_url: returnUrl,
      expires_at: Math.floor(expiresAt.getTime() / 1000),
    });

    const packageEnrollment =
      await this.repository.createClassPackageEnrollment({
        eventId: event.id,
        amount: totalAmount,
        currency: 'usd',
        status: UpcomingClassEnrollmentStatus.PENDING_PAYMENT,
        stripeCheckoutSessionId: checkout.id,
        customerName: dto.customerName.trim(),
        customerEmail: dto.customerEmail.trim().toLowerCase(),
        customerPhone: dto.customerPhone?.trim() || null,
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
        expiresAt,
      });

    await this.createPackageChildrenEnrollments({
      packageEnrollmentId: packageEnrollment.id,
      resolved,
      customerName: dto.customerName.trim(),
      customerEmail: dto.customerEmail.trim().toLowerCase(),
      customerPhone: dto.customerPhone?.trim() || null,
      expiresAt,
    });

    await this.attachCheckoutFlowMetadata(checkout.id, {
      flow: 'class_session_bundle',
      packageEnrollmentId: packageEnrollment.id,
    });

    return {
      clientSecret: checkout.client_secret!,
      packageEnrollmentId: packageEnrollment.id,
    };
  }

  async createClassPackageCheckout(
    slug: string,
    dto: CreateClassPackageCheckoutDto,
  ) {
    const event = await this.repository.findPublicUpcomingBySlug(slug);
    this.assertClassesExperience(event);

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
      this.repository.asPrisma(),
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

    const expiresAt = new Date(Date.now() + CHECKOUT_TTL_MINUTES * 60 * 1000);
    const frontendUrl = this.stripeService.frontendUrl();
    const returnUrl = `${frontendUrl}/on-coming-events/${event.slug}/classes/package-return?session_id={CHECKOUT_SESSION_ID}`;
    const packageLabel =
      venueConfig.classPackageLabel?.trim() || 'Full month package';
    const sessionCount = resolved.length;

    const checkout = await this.createEmbeddedCheckoutSession({
      ...STRIPE_EMBEDDED_CHECKOUT_BASE,
      mode: 'payment',
      customer_email: dto.customerEmail,
      ...stripeAutomaticTaxParams(),
      payment_intent_data: {
        receipt_email: dto.customerEmail.trim().toLowerCase(),
      },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'usd',
            unit_amount: amountCents,
            product_data: stripeTaxProductData({
              name: `${event.eventType.name} ? ${packageLabel}`,
              description: `${sessionCount} class${sessionCount === 1 ? '' : 'es'} in ${dto.monthIso}`,
            }),
          },
        },
      ],
      metadata: { flow: 'class_month_package' },
      return_url: returnUrl,
      expires_at: Math.floor(expiresAt.getTime() / 1000),
    });

    const packageEnrollment =
      await this.repository.createClassPackageEnrollment({
        eventId: event.id,
        amount: packagePrice,
        currency: 'usd',
        status: UpcomingClassEnrollmentStatus.PENDING_PAYMENT,
        stripeCheckoutSessionId: checkout.id,
        customerName: dto.customerName.trim(),
        customerEmail: dto.customerEmail.trim().toLowerCase(),
        customerPhone: dto.customerPhone?.trim() || null,
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
        expiresAt,
      });

    await this.createPackageChildrenEnrollments({
      packageEnrollmentId: packageEnrollment.id,
      resolved,
      customerName: dto.customerName.trim(),
      customerEmail: dto.customerEmail.trim().toLowerCase(),
      customerPhone: dto.customerPhone?.trim() || null,
      expiresAt,
    });

    await this.attachCheckoutFlowMetadata(checkout.id, {
      flow: 'class_month_package',
      packageEnrollmentId: packageEnrollment.id,
    });

    return {
      clientSecret: checkout.client_secret!,
      packageEnrollmentId: packageEnrollment.id,
    };
  }

  async createFixedEventCheckout(
    slug: string,
    dto: CreateFixedEventCheckoutDto,
  ) {
    const { event, venueConfig } = await this.assertFixedTicketCheckout(slug);
    const capacity = venueConfig.fixedTicketCapacity;
    if (capacity == null || capacity < 1) {
      throw new BadRequestException(
        'Ticket capacity is not configured for this event.',
      );
    }
    const remaining = await fixedTicketsRemaining(
      this.repository.asPrisma(),
      event.id,
      capacity,
    );
    if (remaining <= 0) {
      throw new ConflictException('Tickets sold out.');
    }

    const amount = Number(event.price);
    const amountCents = Math.round(amount * 100);
    if (amountCents < 50) {
      throw new BadRequestException('Invalid event ticket price.');
    }

    const expiresAt = new Date(Date.now() + CHECKOUT_TTL_MINUTES * 60 * 1000);
    const frontendUrl = this.stripeService.frontendUrl();
    const returnUrl = `${frontendUrl}/on-coming-events/${event.slug}/return?session_id={CHECKOUT_SESSION_ID}`;

    const checkout = await this.createEmbeddedCheckoutSession({
      ...STRIPE_EMBEDDED_CHECKOUT_BASE,
      mode: 'payment',
      customer_email: dto.customerEmail,
      ...stripeAutomaticTaxParams(),
      payment_intent_data: {
        receipt_email: dto.customerEmail.trim().toLowerCase(),
      },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'usd',
            unit_amount: amountCents,
            product_data: stripeTaxProductData({
              name: `${event.eventType.name} ? ticket`,
              description: venueConfig.reservationEventLabel ?? 'Event ticket',
            }),
          },
        },
      ],
      metadata: { flow: 'fixed_event_ticket' },
      return_url: returnUrl,
      expires_at: Math.floor(expiresAt.getTime() / 1000),
    });

    const enrollment = await this.repository.createPendingFixedEventEnrollment({
      eventId: event.id,
      amount: event.price!,
      currency: 'usd',
      status: UpcomingClassEnrollmentStatus.PENDING_PAYMENT,
      stripeCheckoutSessionId: checkout.id,
      customerName: dto.customerName.trim(),
      customerEmail: dto.customerEmail.trim().toLowerCase(),
      customerPhone: dto.customerPhone?.trim() || null,
      expiresAt,
    });

    await this.attachCheckoutFlowMetadata(checkout.id, {
      flow: 'fixed_event_ticket',
      enrollmentId: enrollment.id,
    });

    return {
      clientSecret: checkout.client_secret!,
      enrollmentId: enrollment.id,
    };
  }

  private assertClassesExperience(event: {
    experienceType: UpcomingExperienceType | null;
  }) {
    if (event.experienceType !== UpcomingExperienceType.CLASSES) {
      throw new BadRequestException(
        'This event does not offer class sessions.',
      );
    }
  }

  private async createEmbeddedCheckoutSession(
    params: StripeCheckoutCreateParams,
  ) {
    const checkout =
      await this.stripeService.client.checkout.sessions.create(params);
    if (!checkout.client_secret) {
      throw new BadRequestException('Could not start checkout.');
    }
    return checkout;
  }

  private attachCheckoutFlowMetadata(
    checkoutId: string,
    metadata: Record<string, string>,
  ) {
    return this.stripeService.client.checkout.sessions.update(checkoutId, {
      metadata,
    });
  }

  private async createPackageChildrenEnrollments(args: {
    packageEnrollmentId: string;
    resolved: PackageChildRow[];
    customerName: string;
    customerEmail: string;
    customerPhone: string | null;
    expiresAt: Date;
  }) {
    for (const row of args.resolved) {
      const enrollment = await this.repository.createClassEnrollment(
        {
          sessionId: row.session.id,
          amount: row.session.price,
          currency: row.session.currency,
          status: UpcomingClassEnrollmentStatus.PENDING_PAYMENT,
          customerName: args.customerName,
          customerEmail: args.customerEmail,
          customerPhone: args.customerPhone,
          expiresAt: args.expiresAt,
        },
        {},
      );
      await this.repository.createClassPackageEnrollmentItem({
        packageEnrollmentId: args.packageEnrollmentId,
        enrollmentId: enrollment.id,
        weekday: row.weekday,
      });
    }
  }

  private async assertFixedTicketCheckout(slug: string) {
    const event = await this.repository.findPublicUpcomingBySlug(slug);
    const venueConfig =
      await this.repository.findVenueConfigWithReservationTemplate(event.id);
    if (
      !venueConfig?.reservationEventTemplate ||
      venueConfig.reservationEventTemplate.scheduleMode !==
        ReservationEventScheduleMode.FIXED_EVENT ||
      venueConfig.clientEnabled
    ) {
      throw new BadRequestException('This event does not offer ticket sales.');
    }
    const purchaseCtx = resolveUpcomingPurchaseContext({
      experienceType: event.experienceType,
      price: event.price != null ? Number(event.price) : null,
      clientEnabled: venueConfig.clientEnabled,
      templateScheduleMode: venueConfig.reservationEventTemplate.scheduleMode,
      reservationOpensAt: venueConfig.reservationOpensAt,
      reservationClosesAt: venueConfig.reservationClosesAt,
      reservationEventDate: venueConfig.reservationEventDate,
      reservationTimezone: venueConfig.reservationTimezone,
      fixedTicketCapacity: venueConfig.fixedTicketCapacity,
      ticketsRemaining:
        venueConfig.fixedTicketCapacity != null &&
        venueConfig.fixedTicketCapacity >= 1
          ? await fixedTicketsRemaining(
              this.repository.asPrisma(),
              event.id,
              venueConfig.fixedTicketCapacity,
            )
          : undefined,
    });
    if (
      purchaseCtx.purchaseMode !== 'fixed_ticket' ||
      !purchaseCtx.purchasable
    ) {
      throw new BadRequestException(
        'Ticket sales are not open for this event.',
      );
    }
    return { event, venueConfig };
  }
}
