import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  EventPublicSection,
  GalleryMediaType,
  Prisma,
  ReservationEventScheduleMode,
  UpcomingClassEnrollmentStatus,
  UpcomingExperienceType,
} from '@prisma/client';
import { buildPublicScheduleDisplay } from './upcoming-event-public-schedule.util';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { AdminPaymentNotifyService } from '../mail/admin-payment-notify.service';
import { fetchPaymentMethodDetails } from '../stripe/stripe-payment-details.util';
import { StripeService } from '../stripe/stripe.service';
import {
  parseCheckoutSession,
  paymentIntentIdFromSession,
  type StripeCheckoutSessionLite,
  type StripePaymentMethodDetails,
  type StripeWebhookEventLite,
} from '../stripe/stripe-webhook.types';
import {
  eventDateForReservations,
  resolveReservationWindow,
} from '../venue-layout-settings/reservation-sales-window.util';
import { CreateClassCheckoutDto } from './dto/create-class-checkout.dto';
import { CreateClassBundleCheckoutDto } from './dto/create-class-bundle-checkout.dto';
import { CreateClassPackageCheckoutDto } from './dto/create-class-package-checkout.dto';
import { regenerateClassSessionsForEvent } from './class-session-generator.util';
import { CreateFixedEventCheckoutDto } from './dto/create-fixed-event-checkout.dto';
import { UpsertClassSessionDto } from './dto/upsert-class-session.dto';
import { ReservationEventTemplatesService } from '../reservation-event-templates/reservation-event-templates.service';
import {
  buildTemplateSummary,
  deriveVenueConfigFromTemplate,
  experienceFromScheduleMode,
} from '../reservation-event-templates/reservation-event-template.util';
import { UpsertVenueConfigDto } from './dto/upsert-venue-config.dto';
import { resolveUpcomingPurchaseContext } from './upcoming-purchase-mode.util';
import {
  assignFixedEventTicketNumber,
  countBlockingFixedEventEnrollments,
  fixedEventStartsAtIso,
  fixedTicketPublicStats,
  fixedTicketsRemaining,
  normalizeFixedTicketCapacity,
} from './upcoming-fixed-ticket.util';
import { venueTablePublicStats } from './upcoming-venue-table.util';
import { emailBrandingFromProcessEnv } from '../mail/email-html-branding';
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
import { formatEnrollmentReference } from './enrollment-reference.util';
import {
  buildFixedTicketConfirmationHtml,
  buildFixedTicketConfirmationSubject,
  buildFixedTicketConfirmationText,
} from './fixed-ticket-confirmation.mail';

const CHECKOUT_TTL_MINUTES = 30;

@Injectable()
export class UpcomingEventsService {
  private readonly logger = new Logger(UpcomingEventsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly stripeService: StripeService,
    private readonly mail: MailService,
    private readonly adminPaymentNotify: AdminPaymentNotifyService,
    private readonly reservationTemplates: ReservationEventTemplatesService,
  ) {}

  async getPublicBySlug(slug: string) {
    const event = await this.findPublicUpcomingBySlug(slug);
    const base = this.mapPublicSummary(event);
    const hero = this.mapPublicHero(event);
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

    const schedule =
      venueConfigRow?.reservationEventTemplate ?
        buildPublicScheduleDisplay(venueConfigRow.reservationEventTemplate)
      : null;

    let hasActiveSessions = false;
    let sessions: (ReturnType<typeof this.mapSessionPublic> & {
      seatsRemaining: number;
    })[] = [];
    let ticketsRemaining: number | undefined;
    let fixedTicketCapacity: number | null | undefined;
    let ticketsSold: number | undefined;
    let tablesRemaining: number | undefined;
    let tableCapacity: number | undefined;
    let tablesSold: number | undefined;
    let eventStartsAt: string | null | undefined;

    if (event.experienceType === UpcomingExperienceType.CLASSES) {
      const rows = await this.prisma.upcomingClassSession.findMany({
        where: {
          eventId: event.id,
          isActive: true,
          endsAt: { gt: now },
        },
        include: { section: true },
        orderBy: [{ startsAt: 'asc' }, { sortOrder: 'asc' }],
      });
      sessions = await Promise.all(
        rows.map(async (s) => ({
          ...this.mapSessionPublic(s),
          seatsRemaining: await this.seatsRemaining(s.id, s.capacity),
        })),
      );
      hasActiveSessions = sessions.length > 0;
    }

    const templateScheduleMode =
      venueConfigRow?.reservationEventTemplate?.scheduleMode ?? null;
    const clientEnabled = venueConfigRow?.clientEnabled ?? false;
    if (
      templateScheduleMode === ReservationEventScheduleMode.FIXED_EVENT &&
      !clientEnabled &&
      venueConfigRow?.fixedTicketCapacity != null &&
      venueConfigRow.fixedTicketCapacity >= 1
    ) {
      fixedTicketCapacity = venueConfigRow.fixedTicketCapacity;
      const stats = await fixedTicketPublicStats(
        this.prisma,
        event.id,
        venueConfigRow.fixedTicketCapacity,
      );
      ticketsRemaining = stats.ticketsRemaining;
      ticketsSold = stats.ticketsSold;
      eventStartsAt = fixedEventStartsAtIso(venueConfigRow.reservationEventDate);
    }

    if (
      event.experienceType === UpcomingExperienceType.VENUE_SEATING &&
      clientEnabled &&
      venueConfigRow
    ) {
      eventStartsAt = fixedEventStartsAtIso(
        venueConfigRow.reservationEventDate ?? venueConfigRow.reservationOpensAt,
      );
      const window = resolveReservationWindow({
        reservationOpensAt: venueConfigRow.reservationOpensAt ?? null,
        reservationClosesAt: venueConfigRow.reservationClosesAt ?? null,
        reservationEventDate: venueConfigRow.reservationEventDate ?? null,
      });
      const eventDate = eventDateForReservations(window);
      if (eventDate) {
        const stats = await venueTablePublicStats(this.prisma, {
          eventId: event.id,
          eventDate,
          floorLayoutId: venueConfigRow.floorLayoutId ?? null,
        });
        if (stats.tableCapacity >= 1) {
          tableCapacity = stats.tableCapacity;
          tablesRemaining = stats.tablesRemaining;
          tablesSold = stats.tablesSold;
        }
      }
    }

    const purchaseCtx = resolveUpcomingPurchaseContext({
      experienceType: event.experienceType,
      price: event.price != null ? Number(event.price) : null,
      clientEnabled,
      templateScheduleMode,
      reservationOpensAt: venueConfigRow?.reservationOpensAt ?? null,
      reservationClosesAt: venueConfigRow?.reservationClosesAt ?? null,
      reservationEventDate: venueConfigRow?.reservationEventDate ?? null,
      reservationTimezone: venueConfigRow?.reservationTimezone ?? null,
      hasActiveSessions,
      fixedTicketCapacity,
      ticketsRemaining,
    });

    const scheduleTimezone =
      schedule?.mode === 'RECURRING_WEEKLY' ? schedule.timezone : 'America/New_York';
    const currentMonthIso = currentCalendarMonthIso(scheduleTimezone, now);
    const monthPackage =
      event.experienceType === UpcomingExperienceType.CLASSES && venueConfigRow ?
        (() => {
          const enabled = venueConfigRow.classPackageEnabled ?? false;
          const price =
            venueConfigRow.classPackagePrice != null ?
              Number(venueConfigRow.classPackagePrice)
            : null;
          const mappedSessions = sessions.map((s) => ({
            startsAt: new Date(s.startsAt),
            endsAt: new Date(s.endsAt),
            timezone: s.timezone || scheduleTimezone,
          }));
          const currentMonthSessionCount = mappedSessions.filter(
            (s) =>
              s.endsAt > now &&
              sessionCalendarMonthIso(s.startsAt, s.timezone) === currentMonthIso,
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
      : undefined;

    return {
      ...base,
      ...hero,
      schedule,
      hasActiveSessions,
      salesOpen: purchaseCtx.salesOpen,
      purchasable: purchaseCtx.purchasable,
      purchaseMode: purchaseCtx.purchaseMode,
      sessions,
      ...(monthPackage ? { monthPackage } : {}),
      ...(ticketsRemaining !== undefined ? { ticketsRemaining } : {}),
      ...(fixedTicketCapacity != null ? { fixedTicketCapacity } : {}),
      ...(ticketsSold !== undefined ? { ticketsSold } : {}),
      ...(eventStartsAt != null ? { eventStartsAt } : {}),
      ...(tableCapacity !== undefined ? { tableCapacity } : {}),
      ...(tablesRemaining !== undefined ? { tablesRemaining } : {}),
      ...(tablesSold !== undefined ? { tablesSold } : {}),
    };
  }

  async listPublicSessions(slug: string) {
    const event = await this.findPublicUpcomingBySlug(slug);
    if (event.experienceType !== UpcomingExperienceType.CLASSES) {
      throw new BadRequestException('This event does not offer class sessions.');
    }
    const now = new Date();
    const sessions = await this.prisma.upcomingClassSession.findMany({
      where: {
        eventId: event.id,
        isActive: true,
        endsAt: { gt: now },
      },
      orderBy: [{ startsAt: 'asc' }, { sortOrder: 'asc' }],
    });
    const withCounts = await Promise.all(
      sessions.map(async (s) => ({
        ...this.mapSessionPublic(s),
        seatsRemaining: await this.seatsRemaining(s.id, s.capacity),
      })),
    );
    return { event: this.mapPublicSummary(event), sessions: withCounts };
  }

  async createClassCheckout(slug: string, dto: CreateClassCheckoutDto) {
    const event = await this.findPublicUpcomingBySlug(slug);
    if (event.experienceType !== UpcomingExperienceType.CLASSES) {
      throw new BadRequestException('This event does not offer class sessions.');
    }
    const session = await this.prisma.upcomingClassSession.findFirst({
      where: {
        id: dto.sessionId,
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

    const amountCents = Math.round(Number(session.price) * 100);
    if (amountCents < 50) {
      throw new BadRequestException('Invalid session price.');
    }

    const expiresAt = new Date(Date.now() + CHECKOUT_TTL_MINUTES * 60 * 1000);
    const frontendUrl = this.stripeService.frontendUrl();
    const returnUrl = `${frontendUrl}/on-coming-events/${event.slug}/classes/return?session_id={CHECKOUT_SESSION_ID}`;

    const sessionParams = {
      ui_mode: 'embedded_page',
      mode: 'payment',
      customer_email: dto.customerEmail,
      payment_intent_data: {
        receipt_email: dto.customerEmail.trim().toLowerCase(),
      },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: session.currency,
            unit_amount: amountCents,
            product_data: {
              name: `${event.eventType.name} — class`,
              description: this.sessionLabel(session),
            },
          },
        },
      ],
      metadata: { flow: 'class_session' },
      return_url: returnUrl,
      expires_at: Math.floor(expiresAt.getTime() / 1000),
    };

    const checkout = await this.stripeService.client.checkout.sessions.create(
      sessionParams as Parameters<
        typeof this.stripeService.client.checkout.sessions.create
      >[0],
    );
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
        customerName: dto.customerName.trim(),
        customerEmail: dto.customerEmail.trim().toLowerCase(),
        customerPhone: dto.customerPhone?.trim() || null,
        expiresAt,
      },
    });

    await this.stripeService.client.checkout.sessions.update(checkout.id, {
      metadata: { flow: 'class_session', enrollmentId: enrollment.id },
    });

    return { clientSecret: checkout.client_secret, enrollmentId: enrollment.id };
  }

  async createClassBundleCheckout(
    slug: string,
    dto: CreateClassBundleCheckoutDto,
  ) {
    const event = await this.findPublicUpcomingBySlug(slug);
    if (event.experienceType !== UpcomingExperienceType.CLASSES) {
      throw new BadRequestException('This event does not offer class sessions.');
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
        throw new BadRequestException('One or more sessions have already ended.');
      }
      const remaining = await this.seatsRemaining(session.id, session.capacity);
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
      resolved[0]!.session.startsAt,
      resolved[0]!.session.timezone,
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

    const expiresAt = new Date(Date.now() + CHECKOUT_TTL_MINUTES * 60 * 1000);
    const frontendUrl = this.stripeService.frontendUrl();
    const returnUrl = `${frontendUrl}/on-coming-events/${event.slug}/classes/package-return?session_id={CHECKOUT_SESSION_ID}`;
    const sectionCount = resolved.length;
    const dateLabel = bundleDateIso;

    const checkout = await this.stripeService.client.checkout.sessions.create({
      ui_mode: 'embedded_page',
      mode: 'payment',
      customer_email: dto.customerEmail,
      payment_intent_data: {
        receipt_email: dto.customerEmail.trim().toLowerCase(),
      },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'usd',
            unit_amount: amountCents,
            product_data: {
              name: `${event.eventType.name} — ${sectionCount} class${sectionCount === 1 ? '' : 'es'}`,
              description: `${sectionCount} section(s) on ${dateLabel}`,
            },
          },
        },
      ],
      metadata: { flow: 'class_session_bundle' },
      return_url: returnUrl,
      expires_at: Math.floor(expiresAt.getTime() / 1000),
    } as Parameters<typeof this.stripeService.client.checkout.sessions.create>[0]);

    if (!checkout.client_secret) {
      throw new BadRequestException('Could not start checkout.');
    }

    const packageEnrollment = await this.prisma.upcomingClassPackageEnrollment.create({
      data: {
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
      },
    });

    for (const row of resolved) {
      const enrollment = await this.prisma.upcomingClassEnrollment.create({
        data: {
          sessionId: row.session.id,
          amount: row.session.price,
          currency: row.session.currency,
          status: UpcomingClassEnrollmentStatus.PENDING_PAYMENT,
          customerName: dto.customerName.trim(),
          customerEmail: dto.customerEmail.trim().toLowerCase(),
          customerPhone: dto.customerPhone?.trim() || null,
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
        flow: 'class_session_bundle',
        packageEnrollmentId: packageEnrollment.id,
      },
    });

    return {
      clientSecret: checkout.client_secret,
      packageEnrollmentId: packageEnrollment.id,
    };
  }

  async getPublicClassOptions(slug: string) {
    const detail = await this.getPublicBySlug(slug);
    if (detail.purchaseMode !== 'classes') {
      throw new BadRequestException('This event does not offer class sessions.');
    }
    const schedule = detail.schedule;
    const days =
      schedule?.mode === 'RECURRING_WEEKLY' ? schedule.days : [];
    const sessionsByDay = new Map<number, typeof detail.sessions>();
    for (const s of detail.sessions) {
      if (s.weekday == null) continue;
      const list = sessionsByDay.get(s.weekday) ?? [];
      list.push(s);
      sessionsByDay.set(s.weekday, list);
    }
    return {
      eventSlug: slug,
      timezone: schedule?.mode === 'RECURRING_WEEKLY' ? schedule.timezone : 'America/New_York',
      days: days.map((d) => ({
        ...d,
        sessions: (sessionsByDay.get(d.weekday) ?? []).sort(
          (a, b) => a.startsAt.localeCompare(b.startsAt),
        ),
      })),
    };
  }

  async createClassPackageCheckout(
    slug: string,
    dto: CreateClassPackageCheckoutDto,
  ) {
    const event = await this.findPublicUpcomingBySlug(slug);
    if (event.experienceType !== UpcomingExperienceType.CLASSES) {
      throw new BadRequestException('This event does not offer class sessions.');
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
      throw new BadRequestException('Full month package is not available for this event.');
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

    const expiresAt = new Date(Date.now() + CHECKOUT_TTL_MINUTES * 60 * 1000);
    const frontendUrl = this.stripeService.frontendUrl();
    const returnUrl = `${frontendUrl}/on-coming-events/${event.slug}/classes/package-return?session_id={CHECKOUT_SESSION_ID}`;
    const packageLabel =
      venueConfig.classPackageLabel?.trim() || 'Full month package';
    const sessionCount = resolved.length;

    const checkoutParams = {
      ui_mode: 'embedded_page',
      mode: 'payment',
      customer_email: dto.customerEmail,
      payment_intent_data: {
        receipt_email: dto.customerEmail.trim().toLowerCase(),
      },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'usd',
            unit_amount: amountCents,
            product_data: {
              name: `${event.eventType.name} — ${packageLabel}`,
              description: `${sessionCount} class${sessionCount === 1 ? '' : 'es'} in ${dto.monthIso}`,
            },
          },
        },
      ],
      metadata: { flow: 'class_month_package' },
      return_url: returnUrl,
      expires_at: Math.floor(expiresAt.getTime() / 1000),
    };

    const checkout = await this.stripeService.client.checkout.sessions.create(
      checkoutParams as Parameters<
        StripeService['client']['checkout']['sessions']['create']
      >[0],
    );

    if (!checkout.client_secret) {
      throw new BadRequestException('Could not start checkout.');
    }

    const packageEnrollment = await this.prisma.upcomingClassPackageEnrollment.create({
      data: {
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
      },
    });

    for (const row of resolved) {
      const enrollment = await this.prisma.upcomingClassEnrollment.create({
        data: {
          sessionId: row.session.id,
          amount: row.session.price,
          currency: row.session.currency,
          status: UpcomingClassEnrollmentStatus.PENDING_PAYMENT,
          customerName: dto.customerName.trim(),
          customerEmail: dto.customerEmail.trim().toLowerCase(),
          customerPhone: dto.customerPhone?.trim() || null,
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
        flow: 'class_month_package',
        packageEnrollmentId: packageEnrollment.id,
      },
    });

    return {
      clientSecret: checkout.client_secret,
      packageEnrollmentId: packageEnrollment.id,
    };
  }

  async regenerateAdminClassSessions(eventId: string) {
    await this.assertAdminUpcomingEvent(eventId);
    return regenerateClassSessionsForEvent(this.prisma, eventId);
  }

  async createFixedEventCheckout(slug: string, dto: CreateFixedEventCheckoutDto) {
    const { event, venueConfig } = await this.assertFixedTicketCheckout(slug);
    const capacity = venueConfig.fixedTicketCapacity;
    if (capacity == null || capacity < 1) {
      throw new BadRequestException('Ticket capacity is not configured for this event.');
    }
    const remaining = await fixedTicketsRemaining(this.prisma, event.id, capacity);
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

    const sessionParams = {
      ui_mode: 'embedded_page',
      mode: 'payment',
      customer_email: dto.customerEmail,
      payment_intent_data: {
        receipt_email: dto.customerEmail.trim().toLowerCase(),
      },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'usd',
            unit_amount: amountCents,
            product_data: {
              name: `${event.eventType.name} — ticket`,
              description: venueConfig.reservationEventLabel ?? 'Event ticket',
            },
          },
        },
      ],
      metadata: { flow: 'fixed_event_ticket' },
      return_url: returnUrl,
      expires_at: Math.floor(expiresAt.getTime() / 1000),
    };

    const checkout = await this.stripeService.client.checkout.sessions.create(
      sessionParams as Parameters<
        typeof this.stripeService.client.checkout.sessions.create
      >[0],
    );
    if (!checkout.client_secret) {
      throw new BadRequestException('Could not start checkout.');
    }

    const enrollment = await this.prisma.upcomingFixedEventEnrollment.create({
      data: {
        eventId: event.id,
        amount: event.price!,
        currency: 'usd',
        status: UpcomingClassEnrollmentStatus.PENDING_PAYMENT,
        stripeCheckoutSessionId: checkout.id,
        customerName: dto.customerName.trim(),
        customerEmail: dto.customerEmail.trim().toLowerCase(),
        customerPhone: dto.customerPhone?.trim() || null,
        expiresAt,
      },
    });

    await this.stripeService.client.checkout.sessions.update(checkout.id, {
      metadata: {
        flow: 'fixed_event_ticket',
        enrollmentId: enrollment.id,
      },
    });

    return { clientSecret: checkout.client_secret, enrollmentId: enrollment.id };
  }

  async getFixedEventSessionStatus(sessionId: string) {
    const enrollment = await this.prisma.upcomingFixedEventEnrollment.findUnique({
      where: { stripeCheckoutSessionId: sessionId },
      include: { event: { include: { eventType: true } } },
    });
    if (!enrollment) {
      throw new NotFoundException('Enrollment not found.');
    }
    const stripeSession =
      await this.stripeService.client.checkout.sessions.retrieve(sessionId);

    if (
      stripeSession.status === 'complete' &&
      stripeSession.payment_status === 'paid' &&
      enrollment.status === UpcomingClassEnrollmentStatus.PENDING_PAYMENT
    ) {
      try {
        await this.reconcileFixedTicketFromStripeSession(sessionId, stripeSession);
      } catch (err) {
        this.logger.warn(
          `fixed-ticket-reconcile-on-status-failed session=${sessionId} reason=${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }

    const refreshed = await this.prisma.upcomingFixedEventEnrollment.findUnique({
      where: { stripeCheckoutSessionId: sessionId },
      include: { event: { include: { eventType: true } } },
    });
    const current = refreshed ?? enrollment;

    return {
      stripeStatus: stripeSession.status,
      enrollment: {
        status: current.status,
        customerEmail: current.customerEmail,
        eventName: current.event.eventType.name,
        eventSlug: current.event.slug,
        ...(current.ticketNumber != null ?
          { ticketNumber: current.ticketNumber }
        : {}),
      },
    };
  }

  async reconcileFixedTicketFromStripeSession(
    sessionId: string,
    stripeSession?: { status: string | null; payment_status: string | null; metadata?: Record<string, string> | null; id?: string; payment_intent?: unknown; amount_total?: number | null },
  ) {
    const session =
      stripeSession ??
      (await this.stripeService.client.checkout.sessions.retrieve(sessionId));
    if (session.status !== 'complete' || session.payment_status !== 'paid') {
      throw new BadRequestException('Checkout session is not paid.');
    }
    const sessionLite = parseCheckoutSession(session);
    if (sessionLite.metadata?.flow !== 'fixed_event_ticket') {
      throw new BadRequestException('Not a fixed ticket checkout session.');
    }
    await this.markFixedEnrollmentPaid(sessionLite, `reconcile:${sessionId}`);
    return { reconciled: true };
  }

  async reconcileClassFromStripeSession(sessionId: string) {
    const trimmed = sessionId.trim();
    const pkg = await this.prisma.upcomingClassPackageEnrollment.findUnique({
      where: { stripeCheckoutSessionId: trimmed },
      select: { id: true },
    });
    if (pkg) {
      return this.reconcileClassPackageFromStripeSession(trimmed);
    }
    return this.reconcileClassSessionFromStripeSession(trimmed);
  }

  async reconcileClassPackageFromStripeSession(
    sessionId: string,
    stripeSession?: {
      status: string | null;
      payment_status: string | null;
      metadata?: Record<string, string> | null;
      id?: string;
      payment_intent?: unknown;
      amount_total?: number | null;
    },
  ) {
    const session =
      stripeSession ??
      (await this.stripeService.client.checkout.sessions.retrieve(sessionId));
    if (session.status !== 'complete' || session.payment_status !== 'paid') {
      throw new BadRequestException('Checkout session is not paid.');
    }
    const sessionLite = parseCheckoutSession(session);
    await this.markPackageEnrollmentPaid(sessionLite, `reconcile:${sessionId}`);
    return { reconciled: true };
  }

  async reconcileClassSessionFromStripeSession(
    sessionId: string,
    stripeSession?: {
      status: string | null;
      payment_status: string | null;
      metadata?: Record<string, string> | null;
      id?: string;
      payment_intent?: unknown;
      amount_total?: number | null;
    },
  ) {
    const session =
      stripeSession ??
      (await this.stripeService.client.checkout.sessions.retrieve(sessionId));
    if (session.status !== 'complete' || session.payment_status !== 'paid') {
      throw new BadRequestException('Checkout session is not paid.');
    }
    const sessionLite = parseCheckoutSession(session);
    await this.markEnrollmentPaid(sessionLite, `reconcile:${sessionId}`);
    return { reconciled: true };
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

  async getClassSessionStatus(sessionId: string) {
    const packageEnrollment =
      await this.prisma.upcomingClassPackageEnrollment.findUnique({
        where: { stripeCheckoutSessionId: sessionId },
        include: this.packageEnrollmentInclude(),
      });
    if (packageEnrollment) {
      let stripeStatus: 'complete' | 'open' | 'expired' = 'open';
      let checkoutFlow: string | undefined;
      try {
        const stripeSession =
          await this.stripeService.client.checkout.sessions.retrieve(sessionId);
        if (stripeSession.status === 'complete') stripeStatus = 'complete';
        else if (stripeSession.status === 'expired') stripeStatus = 'expired';
        checkoutFlow = stripeSession.metadata?.flow ?? undefined;
        if (
          stripeSession.status === 'complete' &&
          stripeSession.payment_status === 'paid' &&
          packageEnrollment.status === UpcomingClassEnrollmentStatus.PENDING_PAYMENT
        ) {
          try {
            await this.reconcileClassPackageFromStripeSession(
              sessionId,
              stripeSession,
            );
          } catch (err) {
            this.logger.warn(
              `class-package-reconcile-on-status-failed session=${sessionId} reason=${err instanceof Error ? err.message : String(err)}`,
            );
          }
        }
      } catch {
        throw new NotFoundException('Checkout session not found.');
      }

      const refreshed =
        (await this.prisma.upcomingClassPackageEnrollment.findUnique({
          where: { stripeCheckoutSessionId: sessionId },
          include: this.packageEnrollmentInclude(),
        })) ?? packageEnrollment;

      const purchaseKind =
        checkoutFlow === 'class_session_bundle' ? 'day_bundle' : 'package';

      return {
        stripeStatus,
        package: true,
        purchaseKind,
        enrollment: {
          status: refreshed.status,
          customerEmail: refreshed.customerEmail,
          eventName: refreshed.event.eventType.name,
          eventSlug: refreshed.event.slug,
          sessions: refreshed.items.map((item) => ({
            weekday: item.weekday,
            sessionLabel: this.sessionLabel(item.enrollment.session),
            confirmationReference: formatEnrollmentReference(item.enrollment.id),
          })),
        },
      };
    }

    const enrollment = await this.prisma.upcomingClassEnrollment.findUnique({
      where: { stripeCheckoutSessionId: sessionId },
      include: {
        session: {
          include: {
            section: true,
            event: { include: { eventType: true } },
          },
        },
      },
    });
    if (!enrollment) throw new NotFoundException('Enrollment not found.');

    let stripeStatus: 'complete' | 'open' | 'expired' = 'open';
    try {
      const stripeSession =
        await this.stripeService.client.checkout.sessions.retrieve(sessionId);
      if (stripeSession.status === 'complete') stripeStatus = 'complete';
      else if (stripeSession.status === 'expired') stripeStatus = 'expired';
      if (
        stripeSession.status === 'complete' &&
        stripeSession.payment_status === 'paid' &&
        enrollment.status === UpcomingClassEnrollmentStatus.PENDING_PAYMENT
      ) {
        try {
          await this.reconcileClassSessionFromStripeSession(
            sessionId,
            stripeSession,
          );
        } catch (err) {
          this.logger.warn(
            `class-reconcile-on-status-failed session=${sessionId} reason=${err instanceof Error ? err.message : String(err)}`,
          );
        }
      }
    } catch {
      throw new NotFoundException('Checkout session not found.');
    }

    const refreshed =
      (await this.prisma.upcomingClassEnrollment.findUnique({
        where: { stripeCheckoutSessionId: sessionId },
        include: {
          session: {
            include: {
              section: true,
              event: { include: { eventType: true } },
            },
          },
        },
      })) ?? enrollment;

    return {
      stripeStatus,
      enrollment: {
        id: refreshed.id,
        status: refreshed.status,
        customerEmail: refreshed.customerEmail,
        sessionLabel: this.sessionLabel(refreshed.session),
        confirmationReference: formatEnrollmentReference(refreshed.id),
        eventName: refreshed.session.event.eventType.name,
        eventSlug: refreshed.session.event.slug,
      },
    };
  }

  /** @deprecated Use unified POST /api/v1/stripe/webhook dispatch */
  async handleClassWebhook(rawBody: Buffer, signature: string | undefined) {
    if (!signature) {
      throw new BadRequestException('Missing stripe-signature header.');
    }
    const event = this.stripeService.client.webhooks.constructEvent(
      rawBody,
      signature,
      this.stripeService.webhookSecret,
    ) as StripeWebhookEventLite;
    return this.processClassStripeWebhookEvent(event);
  }

  async processClassStripeWebhookEvent(
    event: StripeWebhookEventLite,
  ): Promise<{ handled: boolean }> {
    const sessionObj =
      event.type === 'checkout.session.completed' ||
      event.type === 'checkout.session.expired'
        ? parseCheckoutSession(event.data.object)
        : null;
    if (sessionObj?.metadata?.flow !== 'class_session') {
      return { handled: false };
    }
    if (event.type === 'checkout.session.completed') {
      await this.markEnrollmentPaid(sessionObj, event.id);
    } else if (event.type === 'checkout.session.expired') {
      const sid = sessionObj.id?.trim();
      if (sid) await this.markEnrollmentExpired(sid);
    } else {
      return { handled: false };
    }
    return { handled: true };
  }

  async processClassPackageStripeWebhookEvent(
    event: StripeWebhookEventLite,
  ): Promise<{ handled: boolean }> {
    const sessionObj =
      event.type === 'checkout.session.completed' ||
      event.type === 'checkout.session.expired'
        ? parseCheckoutSession(event.data.object)
        : null;
    const flow = sessionObj?.metadata?.flow;
    if (
      !sessionObj ||
      (flow !== 'class_package' &&
        flow !== 'class_session_bundle' &&
        flow !== 'class_month_package')
    ) {
      return { handled: false };
    }
    if (event.type === 'checkout.session.completed') {
      await this.markPackageEnrollmentPaid(sessionObj, event.id);
    } else if (event.type === 'checkout.session.expired') {
      const sid = sessionObj.id?.trim();
      if (sid) await this.markPackageEnrollmentExpired(sid);
    } else {
      return { handled: false };
    }
    return { handled: true };
  }

  /** @deprecated Use unified POST /api/v1/stripe/webhook dispatch */
  async handleFixedEventTicketWebhook(
    rawBody: Buffer,
    signature: string | undefined,
  ) {
    if (!signature) {
      throw new BadRequestException('Missing stripe-signature header.');
    }
    const event = this.stripeService.client.webhooks.constructEvent(
      rawBody,
      signature,
      this.stripeService.webhookSecret,
    ) as StripeWebhookEventLite;
    return this.processFixedStripeWebhookEvent(event);
  }

  async processFixedStripeWebhookEvent(
    event: StripeWebhookEventLite,
  ): Promise<{ handled: boolean }> {
    const sessionObj =
      event.type === 'checkout.session.completed' ||
      event.type === 'checkout.session.expired'
        ? parseCheckoutSession(event.data.object)
        : null;
    if (sessionObj?.metadata?.flow !== 'fixed_event_ticket') {
      return { handled: false };
    }
    if (event.type === 'checkout.session.completed') {
      await this.markFixedEnrollmentPaid(sessionObj, event.id);
    } else if (event.type === 'checkout.session.expired') {
      const sid = sessionObj.id?.trim();
      if (sid) await this.markFixedEnrollmentExpired(sid);
    } else {
      return { handled: false };
    }
    return { handled: true };
  }

  async listAdminSessions(eventId: string) {
    await this.assertAdminUpcomingEvent(eventId);
    const rows = await this.prisma.upcomingClassSession.findMany({
      where: { eventId },
      orderBy: [{ startsAt: 'asc' }, { sortOrder: 'asc' }],
    });
    return rows.map((r) => this.mapSessionAdmin(r));
  }

  async createAdminSession(eventId: string, dto: UpsertClassSessionDto) {
    const event = await this.assertAdminUpcomingEvent(eventId);
    if (event.experienceType !== UpcomingExperienceType.CLASSES) {
      throw new BadRequestException('Event is not a classes experience.');
    }
    const startsAt = new Date(dto.startsAt);
    const endsAt = new Date(dto.endsAt);
    if (endsAt <= startsAt) {
      throw new BadRequestException('endsAt must be after startsAt.');
    }
    const created = await this.prisma.upcomingClassSession.create({
      data: {
        eventId,
        startsAt,
        endsAt,
        timezone: dto.timezone?.trim() || 'America/New_York',
        capacity: dto.capacity,
        price: dto.price,
        isActive: dto.isActive ?? true,
        sortOrder: dto.sortOrder ?? 0,
      },
    });
    return this.mapSessionAdmin(created);
  }

  async updateAdminSession(
    eventId: string,
    sessionId: string,
    dto: UpsertClassSessionDto,
  ) {
    await this.assertAdminUpcomingEvent(eventId);
    const existing = await this.prisma.upcomingClassSession.findFirst({
      where: { id: sessionId, eventId },
    });
    if (!existing) throw new NotFoundException('Session not found.');
    const startsAt = new Date(dto.startsAt);
    const endsAt = new Date(dto.endsAt);
    if (endsAt <= startsAt) {
      throw new BadRequestException('endsAt must be after startsAt.');
    }
    const updated = await this.prisma.upcomingClassSession.update({
      where: { id: sessionId },
      data: {
        startsAt,
        endsAt,
        timezone: dto.timezone?.trim() || existing.timezone,
        capacity: dto.capacity,
        price: dto.price,
        isActive: dto.isActive ?? existing.isActive,
        sortOrder: dto.sortOrder ?? existing.sortOrder,
      },
    });
    return this.mapSessionAdmin(updated);
  }

  async deleteAdminSession(eventId: string, sessionId: string) {
    await this.assertAdminUpcomingEvent(eventId);
    const existing = await this.prisma.upcomingClassSession.findFirst({
      where: { id: sessionId, eventId },
    });
    if (!existing) throw new NotFoundException('Session not found.');
    await this.prisma.upcomingClassSession.delete({ where: { id: sessionId } });
    return { message: 'Session deleted.' };
  }

  async getAdminVenueConfig(eventId: string) {
    await this.assertAdminUpcomingEvent(eventId);
    const config = await this.prisma.upcomingVenueConfig.findUnique({
      where: { eventId },
      include: {
        reservationEventTemplate: {
          include: {
            weekdays: { orderBy: { weekday: 'asc' } },
            classSections: { orderBy: [{ weekday: 'asc' }, { sortOrder: 'asc' }] },
          },
        },
      },
    });
    return config ? this.mapVenueConfig(config) : null;
  }

  async upsertAdminVenueConfig(eventId: string, dto: UpsertVenueConfigDto) {
    const event = await this.assertAdminUpcomingEvent(eventId);
    const existingConfig = await this.prisma.upcomingVenueConfig.findUnique({
      where: { eventId },
      include: { reservationEventTemplate: true },
    });
    const linkingTemplate = Boolean(dto.reservationEventTemplateId);
    const unlinking = dto.reservationEventTemplateId === null;
    const dtoFixedTicketCapacity = normalizeFixedTicketCapacity(dto.fixedTicketCapacity);

    let templateDerived: ReturnType<typeof deriveVenueConfigFromTemplate> | null =
      null;
    let linkedScheduleMode: ReservationEventScheduleMode | null = null;
    let reservationEventTemplateId: string | null | undefined =
      dto.reservationEventTemplateId;
    let resolvedClientEnabled: boolean | undefined = dto.clientEnabled;

    if (dto.reservationEventTemplateId) {
      const template = await this.reservationTemplates.findByIdOrThrow(
        dto.reservationEventTemplateId,
      );
      linkedScheduleMode = template.scheduleMode;
      templateDerived = deriveVenueConfigFromTemplate(template);

      if (template.scheduleMode === ReservationEventScheduleMode.FIXED_EVENT) {
        const enableSeating = dto.clientEnabled === true;
        resolvedClientEnabled = enableSeating;
        await this.prisma.event.update({
          where: { id: eventId },
          data: enableSeating
            ? {
                experienceType: UpcomingExperienceType.VENUE_SEATING,
                classVariant: null,
              }
            : { experienceType: null, classVariant: null },
        });
      } else {
        const { experienceType, classVariant } = experienceFromScheduleMode(
          template.scheduleMode,
        );
        await this.prisma.event.update({
          where: { id: eventId },
          data: { experienceType, classVariant },
        });
      }
    } else if (unlinking) {
      // Detaching the schedule turns this back into a normal event: clear the
      // experience type and make sure seat sales are switched off.
      linkedScheduleMode = null;
      reservationEventTemplateId = null;
      await this.prisma.event.update({
        where: { id: eventId },
        data: { experienceType: null, classVariant: null },
      });
    } else if (existingConfig?.reservationEventTemplate) {
      linkedScheduleMode = existingConfig.reservationEventTemplate.scheduleMode;
    }

    const existingFixedTicketMode =
      existingConfig?.reservationEventTemplate?.scheduleMode ===
        ReservationEventScheduleMode.FIXED_EVENT &&
      !(existingConfig?.clientEnabled ?? false);

    const patchingFixedTicketCapacity =
      dtoFixedTicketCapacity !== undefined ||
      (dto.fixedTicketCapacity === null && dto.clientEnabled === true);

    if (
      !linkingTemplate &&
      !unlinking &&
      !patchingFixedTicketCapacity &&
      linkedScheduleMode !== ReservationEventScheduleMode.FIXED_EVENT &&
      !existingFixedTicketMode &&
      event.experienceType !== UpcomingExperienceType.VENUE_SEATING &&
      dto.clientEnabled !== true
    ) {
      throw new BadRequestException('Event is not a venue seating experience.');
    }

    const seatingEnabled =
      (resolvedClientEnabled ?? existingConfig?.clientEnabled ?? false) === true;

    let resolvedFixedTicketCapacity: number | null | undefined;
    if (linkedScheduleMode === ReservationEventScheduleMode.FIXED_EVENT) {
      if (seatingEnabled) {
        resolvedFixedTicketCapacity = null;
      } else {
        const capacity =
          dtoFixedTicketCapacity !== undefined ?
            dtoFixedTicketCapacity
          : normalizeFixedTicketCapacity(existingConfig?.fixedTicketCapacity ?? undefined) ??
            null;
        if (capacity == null || capacity < 1) {
          throw new BadRequestException(
            'Ticket capacity is required for fixed events without table and seat sales.',
          );
        }
        const blocking = await countBlockingFixedEventEnrollments(
          this.prisma,
          eventId,
        );
        if (capacity < blocking) {
          throw new ConflictException(
            `Ticket capacity cannot be less than ${blocking} (already sold or reserved).`,
          );
        }
        resolvedFixedTicketCapacity = capacity;
      }
    } else if (unlinking || linkingTemplate || dto.reservationEventTemplateId !== undefined) {
      resolvedFixedTicketCapacity = null;
    }

    const effectiveScheduleMode =
      linkedScheduleMode ?? existingConfig?.reservationEventTemplate?.scheduleMode ?? null;
    const classPackageEnabled = dto.classPackageEnabled;
    const classPackagePrice = dto.classPackagePrice;
    const classPackageLabel = dto.classPackageLabel;
    if (
      classPackageEnabled &&
      effectiveScheduleMode === ReservationEventScheduleMode.RECURRING_WEEKLY
    ) {
      const price = classPackagePrice != null ? Number(classPackagePrice) : NaN;
      if (!Number.isFinite(price) || price < 0.5) {
        throw new BadRequestException(
          'Full month package price must be at least $0.50 when enabled.',
        );
      }
    }

    const data = {
      clientEnabled:
        resolvedClientEnabled ?? (unlinking ? false : undefined),
      promoTitle: dto.promoTitle,
      promoDescription: dto.promoDescription,
      reservationEventDate:
        templateDerived?.reservationEventDate ??
        (dto.reservationEventDate ? new Date(dto.reservationEventDate) : undefined),
      reservationOpensAt:
        templateDerived?.reservationOpensAt ??
        (dto.reservationOpensAt ? new Date(dto.reservationOpensAt) : undefined),
      reservationClosesAt:
        templateDerived?.reservationClosesAt ??
        (dto.reservationClosesAt ? new Date(dto.reservationClosesAt) : undefined),
      reservationEventLabel:
        templateDerived?.reservationEventLabel ?? dto.reservationEventLabel,
      reservationTimezone:
        templateDerived?.reservationTimezone ??
        (dto.reservationTimezone?.trim() || undefined),
      floorLayoutId: dto.floorLayoutId ?? undefined,
      reservationEventTemplateId,
      fixedTicketCapacity: resolvedFixedTicketCapacity,
      classPackageEnabled,
      classPackagePrice,
      classPackageLabel,
    };

    const createData = {
      eventId,
      clientEnabled: data.clientEnabled ?? false,
      promoTitle: data.promoTitle ?? null,
      promoDescription: data.promoDescription ?? null,
      reservationEventDate: data.reservationEventDate ?? null,
      reservationOpensAt: data.reservationOpensAt ?? null,
      reservationClosesAt: data.reservationClosesAt ?? null,
      reservationEventLabel: data.reservationEventLabel ?? null,
      reservationTimezone: data.reservationTimezone ?? 'America/New_York',
      floorLayoutId: data.floorLayoutId ?? null,
      reservationEventTemplateId: data.reservationEventTemplateId ?? null,
      fixedTicketCapacity:
        data.fixedTicketCapacity !== undefined ? data.fixedTicketCapacity : null,
      classPackageEnabled: data.classPackageEnabled ?? false,
      classPackagePrice: data.classPackagePrice ?? null,
      classPackageLabel: data.classPackageLabel ?? null,
    };

    const saved = await this.prisma.upcomingVenueConfig.upsert({
      where: { eventId },
      create: createData,
      update: {
        ...(data.clientEnabled !== undefined ?
          { clientEnabled: data.clientEnabled }
        : {}),
        ...(data.promoTitle !== undefined ? { promoTitle: data.promoTitle } : {}),
        ...(data.promoDescription !== undefined ?
          { promoDescription: data.promoDescription }
        : {}),
        ...(data.reservationEventDate !== undefined ?
          { reservationEventDate: data.reservationEventDate }
        : {}),
        ...(data.reservationOpensAt !== undefined ?
          { reservationOpensAt: data.reservationOpensAt }
        : {}),
        ...(data.reservationClosesAt !== undefined ?
          { reservationClosesAt: data.reservationClosesAt }
        : {}),
        ...(data.reservationEventLabel !== undefined ?
          { reservationEventLabel: data.reservationEventLabel }
        : {}),
        ...(data.reservationTimezone !== undefined ?
          { reservationTimezone: data.reservationTimezone }
        : {}),
        ...(data.floorLayoutId !== undefined ?
          { floorLayoutId: data.floorLayoutId }
        : {}),
        ...(data.reservationEventTemplateId !== undefined ?
          { reservationEventTemplateId: data.reservationEventTemplateId }
        : {}),
        ...(data.fixedTicketCapacity !== undefined ?
          { fixedTicketCapacity: data.fixedTicketCapacity }
        : {}),
        ...(data.classPackageEnabled !== undefined ?
          { classPackageEnabled: data.classPackageEnabled }
        : {}),
        ...(data.classPackagePrice !== undefined ?
          { classPackagePrice: data.classPackagePrice }
        : {}),
        ...(data.classPackageLabel !== undefined ?
          { classPackageLabel: data.classPackageLabel }
        : {}),
      },
      include: {
        reservationEventTemplate: {
          include: {
            weekdays: { orderBy: { weekday: 'asc' } },
            classSections: { orderBy: [{ weekday: 'asc' }, { sortOrder: 'asc' }] },
          },
        },
      },
    });

    // Session generation runs via POST .../sessions/regenerate after the client
    // saves the template and venue config, so this PATCH never fails after a
    // successful link when section rows are still settling.

    return this.mapVenueConfig(saved);
  }

  async resolveEventIdBySlug(slug: string): Promise<string> {
    const event = await this.findPublicUpcomingBySlug(slug);
    return event.id;
  }

  async getVenueConfigForEvent(eventId: string) {
    const config = await this.prisma.upcomingVenueConfig.findUnique({
      where: { eventId },
    });
    if (!config) return null;
    const window = resolveReservationWindow({
      reservationOpensAt: config.reservationOpensAt,
      reservationClosesAt: config.reservationClosesAt,
      reservationEventDate: config.reservationEventDate,
    });
    return {
      clientEnabled: config.clientEnabled,
      window,
      reservationEventLabel: config.reservationEventLabel,
      reservationTimezone: config.reservationTimezone,
      floorLayoutId: config.floorLayoutId,
      promoTitle: config.promoTitle,
      promoDescription: config.promoDescription,
      promoImageUrl: config.promoImageUrl,
    };
  }

  async getPublicVenueBundle(slug: string) {
    const event = await this.findPublicUpcomingBySlug(slug);
    if (event.experienceType !== UpcomingExperienceType.VENUE_SEATING) {
      throw new BadRequestException('This event does not offer seat reservations.');
    }
    const config = await this.getVenueConfigForEvent(event.id);
    if (!config?.clientEnabled) {
      throw new NotFoundException('Seat reservations are not published for this event.');
    }
    return {
      event: this.mapPublicSummary(event),
      config: {
        reservationEventLabel: config.reservationEventLabel,
        reservationTimezone: config.reservationTimezone,
        reservationOpensAt: config.window.opensAt?.toISOString() ?? null,
        reservationClosesAt: config.window.closesAt?.toISOString() ?? null,
        floorLayoutId: config.floorLayoutId,
      },
    };
  }

  private effectiveGalleryMediaType(
    imageUrl: string | null | undefined,
    mediaType?: GalleryMediaType | null,
  ): GalleryMediaType {
    const u = typeof imageUrl === 'string' ? imageUrl.trim() : '';
    if (u) {
      const lower = u.toLowerCase();
      if (
        lower.includes('/video/upload/') ||
        /\.(mp4|webm|mov|m4v|ogv)(\?|#|$)/i.test(lower)
      ) {
        return GalleryMediaType.VIDEO;
      }
    }
    return mediaType ?? GalleryMediaType.IMAGE;
  }

  private mapPublicHero(event: {
    galleryPhotos?: Array<{ imageUrl: string; mediaType: GalleryMediaType }>;
  }) {
    const first = event.galleryPhotos?.[0];
    if (!first) {
      return { heroImageUrl: null as string | null, heroMediaType: null as 'IMAGE' | 'VIDEO' | null };
    }
    const heroMediaType = this.effectiveGalleryMediaType(
      first.imageUrl,
      first.mediaType,
    );
    return {
      heroImageUrl: first.imageUrl,
      heroMediaType: heroMediaType === GalleryMediaType.VIDEO ? 'VIDEO' : 'IMAGE',
    };
  }

  private async assertFixedTicketCheckout(slug: string) {
    const event = await this.findPublicUpcomingBySlug(slug);
    const venueConfig = await this.prisma.upcomingVenueConfig.findUnique({
      where: { eventId: event.id },
      include: { reservationEventTemplate: true },
    });
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
        venueConfig.fixedTicketCapacity != null && venueConfig.fixedTicketCapacity >= 1
          ? await fixedTicketsRemaining(
              this.prisma,
              event.id,
              venueConfig.fixedTicketCapacity,
            )
          : undefined,
    });
    if (purchaseCtx.purchaseMode !== 'fixed_ticket' || !purchaseCtx.purchasable) {
      throw new BadRequestException('Ticket sales are not open for this event.');
    }
    return { event, venueConfig };
  }

  private async findPublicUpcomingBySlug(slug: string) {
    const normalized = slug.trim().toLowerCase();
    const event = await this.prisma.event.findFirst({
      where: {
        slug: normalized,
        publicSection: EventPublicSection.UPCOMING_EVENTS,
        isActive: true,
      },
      include: {
        eventType: true,
        galleryPhotos: {
          where: { isActive: true },
          orderBy: { createdAt: 'asc' },
          select: { imageUrl: true, mediaType: true },
        },
      },
    });
    if (!event?.slug) {
      throw new NotFoundException('Upcoming event not found.');
    }
    return event;
  }

  private async assertAdminUpcomingEvent(eventId: string) {
    const event = await this.prisma.event.findFirst({
      where: { id: eventId, publicSection: EventPublicSection.UPCOMING_EVENTS },
      include: { eventType: true },
    });
    if (!event) throw new NotFoundException('Upcoming event not found.');
    return event;
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
    section?: { label: string | null; startTime: string; endTime: string } | null;
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

  private mapPublicSummary(event: {
    id: string;
    slug: string | null;
    description: string;
    items: string[];
    price: unknown;
    experienceType: UpcomingExperienceType | null;
    classVariant: string | null;
    eventType: { name: string };
  }) {
    return {
      id: event.id,
      slug: event.slug,
      eventTypeName: event.eventType.name,
      description: event.description,
      items: event.items,
      price: event.price != null ? Number(event.price) : null,
      experienceType: event.experienceType,
      classVariant: event.classVariant,
    };
  }

  private mapSessionPublic(session: {
    id: string;
    startsAt: Date;
    endsAt: Date;
    timezone: string;
    capacity: number;
    price: unknown;
    currency: string;
    weekday?: number | null;
    sectionId?: string | null;
    section?: {
      label: string | null;
      startTime: string;
      endTime: string;
    } | null;
  }) {
    return {
      id: session.id,
      startsAt: session.startsAt.toISOString(),
      endsAt: session.endsAt.toISOString(),
      timezone: session.timezone,
      capacity: session.capacity,
      price: Number(session.price),
      currency: session.currency,
      weekday: session.weekday ?? null,
      sectionId: session.sectionId ?? null,
      sectionLabel: session.section?.label ?? null,
      sectionStartTime: session.section?.startTime ?? null,
      sectionEndTime: session.section?.endTime ?? null,
    };
  }

  private mapSessionAdmin(session: {
    id: string;
    eventId: string;
    startsAt: Date;
    endsAt: Date;
    timezone: string;
    capacity: number;
    price: unknown;
    currency: string;
    isActive: boolean;
    sortOrder: number;
  }) {
    return { ...this.mapSessionPublic(session), isActive: session.isActive, sortOrder: session.sortOrder };
  }

  private mapVenueConfig(config: {
    id: string;
    eventId: string;
    clientEnabled: boolean;
    promoTitle: string | null;
    promoDescription: string | null;
    promoImageUrl: string | null;
    reservationEventDate: Date | null;
    reservationOpensAt: Date | null;
    reservationClosesAt: Date | null;
    reservationEventLabel: string | null;
    reservationTimezone: string;
    floorLayoutId: string | null;
    fixedTicketCapacity?: number | null;
    classPackageEnabled?: boolean;
    classPackagePrice?: unknown;
    classPackageLabel?: string | null;
    reservationEventTemplateId?: string | null;
    reservationEventTemplate?: Prisma.ReservationEventTemplateGetPayload<{
      include: { weekdays: true; classSections: true };
    }> | null;
  }) {
    const template = config.reservationEventTemplate;
    return {
      id: config.id,
      eventId: config.eventId,
      clientEnabled: config.clientEnabled,
      promoTitle: config.promoTitle,
      promoDescription: config.promoDescription,
      promoImageUrl: config.promoImageUrl,
      reservationEventDate: config.reservationEventDate?.toISOString() ?? null,
      reservationOpensAt: config.reservationOpensAt?.toISOString() ?? null,
      reservationClosesAt: config.reservationClosesAt?.toISOString() ?? null,
      reservationEventLabel: config.reservationEventLabel,
      reservationTimezone: config.reservationTimezone,
      floorLayoutId: config.floorLayoutId,
      fixedTicketCapacity: config.fixedTicketCapacity ?? null,
      classPackageEnabled: config.classPackageEnabled ?? false,
      classPackagePrice:
        config.classPackagePrice != null ? Number(config.classPackagePrice) : null,
      classPackageLabel: config.classPackageLabel ?? null,
      reservationEventTemplateId: config.reservationEventTemplateId ?? null,
      reservationEventTemplate:
        template ?
          {
            id: template.id,
            name: template.name,
            timezone: template.timezone,
            scheduleMode: template.scheduleMode,
            salesStartDate: template.salesStartDate?.toISOString().slice(0, 10) ?? null,
            salesEndDate: template.salesEndDate?.toISOString().slice(0, 10) ?? null,
            eventDate: template.eventDate?.toISOString().slice(0, 10) ?? null,
            eventStartTime: template.eventStartTime,
            eventEndTime: template.eventEndTime,
            recurringEffectiveFrom:
              template.recurringEffectiveFrom?.toISOString().slice(0, 10) ?? null,
            recurringStartTime: template.recurringStartTime,
            recurringEndTime: template.recurringEndTime,
            weekdays: template.weekdays.map((w) => ({
              weekday: w.weekday,
              isActive: w.isActive,
            })),
            classSections: (template.classSections ?? []).map((s) => ({
              id: s.id,
              weekday: s.weekday,
              label: s.label,
              startTime: s.startTime,
              endTime: s.endTime,
              sortOrder: s.sortOrder,
              defaultCapacity: s.defaultCapacity,
              defaultPrice: s.defaultPrice != null ? Number(s.defaultPrice) : null,
              isActive: s.isActive,
            })),
            summary: buildTemplateSummary(template),
          }
        : null,
    };
  }

  private async markEnrollmentPaid(
    session: StripeCheckoutSessionLite,
    stripeEventId: string,
  ) {
    const sessionId = session.id?.trim();
    if (!sessionId) throw new BadRequestException('Invalid session id.');
    const enrollment = await this.prisma.upcomingClassEnrollment.findUnique({
      where: { stripeCheckoutSessionId: sessionId },
      include: {
        session: {
          include: {
            section: true,
            event: { include: { eventType: true } },
          },
        },
      },
    });
    if (!enrollment) {
      this.logger.warn(`class-webhook-missing enrollment session=${sessionId}`);
      return;
    }
    if (enrollment.status === UpcomingClassEnrollmentStatus.PAID) return;
    if (session.payment_status !== 'paid') {
      throw new BadRequestException('Checkout session is not paid.');
    }
    const expectedCents = Math.round(Number(enrollment.amount) * 100);
    if (session.amount_total !== expectedCents) {
      throw new BadRequestException('Amount mismatch.');
    }
    const paymentIntent = session.payment_intent;
    const paymentIntentId =
      typeof paymentIntent === 'string' ? paymentIntent : paymentIntent?.id ?? null;

    await this.prisma.upcomingClassEnrollment.update({
      where: { id: enrollment.id },
      data: {
        status: UpcomingClassEnrollmentStatus.PAID,
        paidAt: new Date(),
        stripePaymentIntentId: paymentIntentId,
        expiresAt: null,
      },
    });
    this.logger.log(
      `class-enrollment-paid id=${enrollment.id} stripeEvent=${stripeEventId}`,
    );
    await this.sendClassConfirmation(enrollment);
    await this.adminPaymentNotify.notifyPaymentOutcome({
      outcome: 'PAID',
      flow: 'CLASS_SESSION',
      customerName: enrollment.customerName,
      customerEmail: enrollment.customerEmail,
      amount: Number(enrollment.amount),
      currency: enrollment.currency,
      contextLabel: enrollment.session.event.eventType.name,
      reference: enrollment.id.slice(0, 8).toUpperCase(),
    });
  }

  private async markEnrollmentExpired(sessionId: string) {
    const enrollment = await this.prisma.upcomingClassEnrollment.findUnique({
      where: { stripeCheckoutSessionId: sessionId },
      include: {
        session: { include: { event: { include: { eventType: true } } } },
      },
    });
    if (!enrollment) return;
    if (enrollment.status !== UpcomingClassEnrollmentStatus.PENDING_PAYMENT) return;
    await this.prisma.upcomingClassEnrollment.update({
      where: { id: enrollment.id },
      data: { status: UpcomingClassEnrollmentStatus.EXPIRED },
    });
    await this.adminPaymentNotify.notifyPaymentOutcome({
      outcome: 'EXPIRED',
      flow: 'CLASS_SESSION',
      customerName: enrollment.customerName,
      customerEmail: enrollment.customerEmail,
      amount: Number(enrollment.amount),
      currency: enrollment.currency,
      contextLabel: enrollment.session.event.eventType.name,
      reference: enrollment.id.slice(0, 8).toUpperCase(),
    });
  }

  private async markFixedEnrollmentPaid(
    session: StripeCheckoutSessionLite,
    stripeEventId: string,
  ) {
    const sessionId = session.id?.trim();
    if (!sessionId) throw new BadRequestException('Invalid session id.');
    const enrollment = await this.prisma.upcomingFixedEventEnrollment.findUnique({
      where: { stripeCheckoutSessionId: sessionId },
      include: { event: { include: { eventType: true } } },
    });
    if (!enrollment) {
      throw new NotFoundException(
        `Fixed ticket enrollment not found for session ${sessionId}.`,
      );
    }
    if (enrollment.status === UpcomingClassEnrollmentStatus.PAID) {
      await this.sendFixedTicketPostPaymentNotifications(
        enrollment.id,
        stripeEventId,
      );
      return;
    }
    if (session.payment_status !== 'paid') {
      throw new BadRequestException('Checkout session is not paid.');
    }
    const expectedCents = Math.round(Number(enrollment.amount) * 100);
    if (session.amount_total !== expectedCents) {
      throw new BadRequestException('Amount mismatch.');
    }
    const paymentIntentId = paymentIntentIdFromSession(session);
    const paymentDetails = await fetchPaymentMethodDetails(
      this.stripeService.client,
      session,
    );

    const venueConfig = await this.prisma.upcomingVenueConfig.findUnique({
      where: { eventId: enrollment.eventId },
    });

    let paidEnrollment: (typeof enrollment & { ticketNumber: number | null }) | null =
      null;
    try {
      paidEnrollment = await this.prisma.$transaction(async (tx) => {
        const current = await tx.upcomingFixedEventEnrollment.findUnique({
          where: { id: enrollment.id },
        });
        if (!current) return null;
        if (current.status === UpcomingClassEnrollmentStatus.PAID) {
          return { ...enrollment, ticketNumber: current.ticketNumber };
        }
        if (current.status !== UpcomingClassEnrollmentStatus.PENDING_PAYMENT) {
          return null;
        }

        const updated = await tx.upcomingFixedEventEnrollment.updateMany({
          where: {
            id: enrollment.id,
            status: UpcomingClassEnrollmentStatus.PENDING_PAYMENT,
          },
          data: {
            status: UpcomingClassEnrollmentStatus.PAID,
            paidAt: new Date(),
            stripePaymentIntentId: paymentIntentId,
            expiresAt: null,
            paymentMethodType: paymentDetails.paymentMethodType,
            paymentMethodBrand: paymentDetails.paymentMethodBrand,
            paymentMethodLast4: paymentDetails.paymentMethodLast4,
          },
        });
        if (updated.count === 0) return null;

        let ticketNumber: number | null = current.ticketNumber;
        if (ticketNumber == null) {
          ticketNumber = await assignFixedEventTicketNumber(
            tx,
            enrollment.eventId,
            enrollment.id,
            venueConfig?.fixedTicketCapacity ?? null,
          );
        }
        return { ...enrollment, ticketNumber };
      });
    } catch (err) {
      if (err instanceof ConflictException) {
        await this.prisma.upcomingFixedEventEnrollment.updateMany({
          where: {
            id: enrollment.id,
            status: UpcomingClassEnrollmentStatus.PENDING_PAYMENT,
          },
          data: {
            status: UpcomingClassEnrollmentStatus.PAID,
            paidAt: new Date(),
            stripePaymentIntentId: paymentIntentId,
            expiresAt: null,
            paymentMethodType: paymentDetails.paymentMethodType,
            paymentMethodBrand: paymentDetails.paymentMethodBrand,
            paymentMethodLast4: paymentDetails.paymentMethodLast4,
          },
        });
        this.logger.error(
          `fixed-ticket-sold-out-after-payment enrollment=${enrollment.id} session=${sessionId} stripeEvent=${stripeEventId}`,
        );
        await this.adminPaymentNotify.notifyPaymentOutcome({
          outcome: 'PAID',
          flow: 'FIXED_TICKET',
          customerName: enrollment.customerName,
          customerEmail: enrollment.customerEmail,
          amount: Number(enrollment.amount),
          currency: enrollment.currency,
          contextLabel: `${enrollment.event.eventType.name} — PAID but ticket # not assigned (sold out)`,
          reference: enrollment.id.slice(0, 8).toUpperCase(),
        });
        throw new InternalServerErrorException(
          'Payment received but ticket assignment failed. Support will contact you.',
        );
      }
      throw err;
    }

    const afterPay = await this.prisma.upcomingFixedEventEnrollment.findUnique({
      where: { id: enrollment.id },
    });
    if (afterPay?.status !== UpcomingClassEnrollmentStatus.PAID) {
      throw new InternalServerErrorException(
        'Could not finalize fixed ticket enrollment after payment.',
      );
    }

    this.logger.log(
      `fixed-event-enrollment-paid id=${enrollment.id} ticket=${paidEnrollment?.ticketNumber ?? 'pending'} stripeEvent=${stripeEventId}`,
    );

    await this.sendFixedTicketPostPaymentNotifications(enrollment.id, stripeEventId);
  }

  private async sendFixedTicketPostPaymentNotifications(
    enrollmentId: string,
    stripeEventId: string,
  ) {
    const enrollment = await this.prisma.upcomingFixedEventEnrollment.findUnique({
      where: { id: enrollmentId },
      include: { event: { include: { eventType: true } } },
    });
    if (!enrollment || enrollment.status !== UpcomingClassEnrollmentStatus.PAID) {
      return;
    }

    const venueConfig = await this.prisma.upcomingVenueConfig.findUnique({
      where: { eventId: enrollment.eventId },
    });

    if (
      enrollment.ticketNumber != null &&
      !enrollment.customerEmailSentAt
    ) {
      const sent = await this.sendFixedTicketConfirmation(
        { ...enrollment, ticketNumber: enrollment.ticketNumber },
        venueConfig,
      );
      if (sent) {
        await this.prisma.upcomingFixedEventEnrollment.update({
          where: { id: enrollmentId },
          data: { customerEmailSentAt: new Date() },
        });
      }
    }

    if (!enrollment.adminNotifySentAt) {
      await this.adminPaymentNotify.notifyPaymentOutcome({
        outcome: 'PAID',
        flow: 'FIXED_TICKET',
        customerName: enrollment.customerName,
        customerEmail: enrollment.customerEmail,
        amount: Number(enrollment.amount),
        currency: enrollment.currency,
        contextLabel: `${enrollment.event.eventType.name}${enrollment.ticketNumber != null ? ` — Ticket #${enrollment.ticketNumber}` : ''}`,
        reference: enrollment.id.slice(0, 8).toUpperCase(),
      });
      await this.prisma.upcomingFixedEventEnrollment.update({
        where: { id: enrollmentId },
        data: { adminNotifySentAt: new Date() },
      });
    }

    this.logger.log(
      `fixed-ticket-notifications enrollment=${enrollmentId} stripeEvent=${stripeEventId}`,
    );
  }

  private async markFixedEnrollmentExpired(sessionId: string) {
    const enrollment = await this.prisma.upcomingFixedEventEnrollment.findUnique({
      where: { stripeCheckoutSessionId: sessionId },
      include: { event: { include: { eventType: true } } },
    });
    if (!enrollment) return;
    if (enrollment.status !== UpcomingClassEnrollmentStatus.PENDING_PAYMENT) return;
    await this.prisma.upcomingFixedEventEnrollment.update({
      where: { id: enrollment.id },
      data: { status: UpcomingClassEnrollmentStatus.EXPIRED },
    });
    await this.adminPaymentNotify.notifyPaymentOutcome({
      outcome: 'EXPIRED',
      flow: 'FIXED_TICKET',
      customerName: enrollment.customerName,
      customerEmail: enrollment.customerEmail,
      amount: Number(enrollment.amount),
      currency: enrollment.currency,
      contextLabel: enrollment.event.eventType.name,
      reference: enrollment.id.slice(0, 8).toUpperCase(),
    });
  }

  private async sendFixedTicketConfirmation(
    enrollment: {
      customerName: string;
      customerEmail: string;
      amount: Prisma.Decimal;
      currency: string;
      ticketNumber: number;
      event: { eventType: { name: string } };
    },
    venueConfig: {
      reservationEventDate: Date | null;
      reservationEventLabel: string | null;
    } | null,
  ): Promise<boolean> {
    const eventName = enrollment.event.eventType.name;
    const amount = `${Number(enrollment.amount).toFixed(2)} ${enrollment.currency.toUpperCase()}`;
    const eventDateLabel =
      venueConfig?.reservationEventLabel?.trim() ||
      (venueConfig?.reservationEventDate ?
        venueConfig.reservationEventDate.toISOString()
      : 'See event details');
    const branding = emailBrandingFromProcessEnv();
    const { ok, errorText } = await this.mail.sendTransactional({
      to: enrollment.customerEmail,
      toName: enrollment.customerName,
      subject: buildFixedTicketConfirmationSubject(eventName),
      text: buildFixedTicketConfirmationText({
        eventName,
        customerName: enrollment.customerName,
        ticketNumber: enrollment.ticketNumber,
        eventDateLabel,
        amount,
        siteBaseUrl: branding.siteBaseUrl,
      }),
      html: buildFixedTicketConfirmationHtml({
        eventName,
        customerName: enrollment.customerName,
        ticketNumber: enrollment.ticketNumber,
        eventDateLabel,
        amount,
        branding,
      }),
    });
    if (!ok) {
      this.logger.warn(
        `fixed-ticket-email-failed to=${enrollment.customerEmail} reason=${errorText ?? 'unknown'}`,
      );
      return false;
    }
    this.logger.log(`fixed-ticket-email-sent to=${enrollment.customerEmail}`);
    return true;
  }

  private async sendClassConfirmation(
    enrollment: {
      id: string;
      customerName: string;
      customerEmail: string;
      amount: Prisma.Decimal;
      currency: string;
      session: {
        startsAt: Date;
        endsAt: Date;
        timezone: string;
        section?: { label: string | null; startTime: string; endTime: string } | null;
        event: { eventType: { name: string } };
      };
    },
  ) {
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
      return;
    }
    this.logger.log(`class-confirmation-email-sent to=${enrollment.customerEmail}`);
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
            section?: { label: string | null; startTime: string; endTime: string } | null;
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
      ? this.sessionCalendarDateIso(firstSession.startsAt, firstSession.timezone)
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
      return;
    }
    this.logger.log(
      `class-bundle-email-sent flow=${checkoutFlow ?? 'package'} to=${pkg.customerEmail} sections=${pkg.items.length}`,
    );
  }

  private async markPackageEnrollmentPaid(
    session: StripeCheckoutSessionLite,
    stripeEventId: string,
  ) {
    const sessionId = session.id?.trim();
    if (!sessionId) throw new BadRequestException('Invalid session id.');
    const pkg = await this.prisma.upcomingClassPackageEnrollment.findUnique({
      where: { stripeCheckoutSessionId: sessionId },
      include: this.packageEnrollmentInclude(),
    });
    if (!pkg) {
      this.logger.warn(`class-package-webhook-missing package session=${sessionId}`);
      return;
    }
    if (pkg.status === UpcomingClassEnrollmentStatus.PAID) return;
    if (session.payment_status !== 'paid') {
      throw new BadRequestException('Checkout session is not paid.');
    }
    const expectedCents = Math.round(Number(pkg.amount) * 100);
    if (session.amount_total !== expectedCents) {
      throw new BadRequestException('Amount mismatch.');
    }

    const checkoutFlow = session.metadata?.flow;
    const isDayBundle = checkoutFlow === 'class_session_bundle';

    await this.prisma.upcomingClassPackageEnrollment.update({
      where: { id: pkg.id },
      data: {
        status: UpcomingClassEnrollmentStatus.PAID,
        paidAt: new Date(),
        expiresAt: null,
      },
    });

    for (const item of pkg.items) {
      await this.prisma.upcomingClassEnrollment.update({
        where: { id: item.enrollmentId },
        data: {
          status: UpcomingClassEnrollmentStatus.PAID,
          paidAt: new Date(),
          expiresAt: null,
        },
      });
    }

    const refreshed = await this.prisma.upcomingClassPackageEnrollment.findUnique({
      where: { id: pkg.id },
      include: this.packageEnrollmentInclude(),
    });
    const emailPkg = refreshed ?? pkg;

    if (emailPkg.items.length === 1) {
      await this.sendClassConfirmation(emailPkg.items[0]!.enrollment);
    } else {
      await this.sendClassBundleConfirmation(emailPkg, checkoutFlow);
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
        : `${emailPkg.event.eventType.name} — class package (${emailPkg.items.length} days)`;

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
      `class-package-paid id=${emailPkg.id} flow=${checkoutFlow ?? 'class_package'} stripeEvent=${stripeEventId}`,
    );
  }

  private async markPackageEnrollmentExpired(sessionId: string) {
    const pkg = await this.prisma.upcomingClassPackageEnrollment.findUnique({
      where: { stripeCheckoutSessionId: sessionId },
      include: { items: true, event: { include: { eventType: true } } },
    });
    if (!pkg) return;
    if (pkg.status !== UpcomingClassEnrollmentStatus.PENDING_PAYMENT) return;

    await this.prisma.upcomingClassPackageEnrollment.update({
      where: { id: pkg.id },
      data: { status: UpcomingClassEnrollmentStatus.EXPIRED },
    });
    for (const item of pkg.items) {
      await this.prisma.upcomingClassEnrollment.update({
        where: { id: item.enrollmentId },
        data: { status: UpcomingClassEnrollmentStatus.EXPIRED },
      });
    }
  }

}
