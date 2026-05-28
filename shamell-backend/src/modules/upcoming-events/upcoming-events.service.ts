import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  EventPublicSection,
  GalleryMediaType,
  Prisma,
  UpcomingClassEnrollmentStatus,
  UpcomingExperienceType,
} from '@prisma/client';
import { buildPublicScheduleDisplay } from './upcoming-event-public-schedule.util';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { StripeService } from '../stripe/stripe.service';
import {
  evaluateSalesWindow,
  eventDateForReservations,
  resolveReservationWindow,
} from '../venue-layout-settings/reservation-sales-window.util';
import { CreateClassCheckoutDto } from './dto/create-class-checkout.dto';
import { UpsertClassSessionDto } from './dto/upsert-class-session.dto';
import { ReservationEventTemplatesService } from '../reservation-event-templates/reservation-event-templates.service';
import {
  buildTemplateSummary,
  deriveVenueConfigFromTemplate,
  experienceFromScheduleMode,
} from '../reservation-event-templates/reservation-event-template.util';
import { UpsertVenueConfigDto } from './dto/upsert-venue-config.dto';
import {
  buildClassEnrollmentConfirmationHtml,
  buildClassEnrollmentConfirmationSubject,
  buildClassEnrollmentConfirmationText,
} from './class-enrollment-confirmation.mail';

const CHECKOUT_TTL_MINUTES = 30;

type StripeWebhookEventLite = {
  id: string;
  type: string;
  livemode: boolean;
  data: { object: unknown };
};

type StripeCheckoutSessionLite = {
  id?: string;
  metadata?: Record<string, string> | null;
  payment_intent?: string | { id?: string } | null;
  payment_status?: string | null;
  amount_total?: number | null;
  currency?: string | null;
};

@Injectable()
export class UpcomingEventsService {
  private readonly logger = new Logger(UpcomingEventsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly stripeService: StripeService,
    private readonly mail: MailService,
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
          include: { weekdays: { orderBy: { weekday: 'asc' } } },
        },
      },
    });

    const schedule =
      venueConfigRow?.reservationEventTemplate ?
        buildPublicScheduleDisplay(venueConfigRow.reservationEventTemplate)
      : null;

    let hasActiveSessions = false;
    let salesOpen = false;
    let sessions: ReturnType<typeof this.mapSessionPublic>[] = [];

    if (event.experienceType === UpcomingExperienceType.CLASSES) {
      const rows = await this.prisma.upcomingClassSession.findMany({
        where: {
          eventId: event.id,
          isActive: true,
          endsAt: { gt: now },
        },
        orderBy: [{ startsAt: 'asc' }, { sortOrder: 'asc' }],
      });
      sessions = await Promise.all(
        rows.map(async (s) => ({
          ...this.mapSessionPublic(s),
          seatsRemaining: await this.seatsRemaining(s.id, s.capacity),
        })),
      );
      hasActiveSessions = sessions.length > 0;
    } else if (event.experienceType === UpcomingExperienceType.VENUE_SEATING) {
      if (venueConfigRow?.clientEnabled) {
        const window = resolveReservationWindow({
          reservationOpensAt: venueConfigRow.reservationOpensAt,
          reservationClosesAt: venueConfigRow.reservationClosesAt,
          reservationEventDate: venueConfigRow.reservationEventDate,
        });
        salesOpen = evaluateSalesWindow(window).open;
      }
    }

    const purchasable =
      event.experienceType === UpcomingExperienceType.CLASSES ?
        hasActiveSessions
      : salesOpen;

    return {
      ...base,
      ...hero,
      schedule,
      hasActiveSessions,
      salesOpen,
      purchasable,
      sessions,
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

  async getClassSessionStatus(sessionId: string) {
    const enrollment = await this.prisma.upcomingClassEnrollment.findUnique({
      where: { stripeCheckoutSessionId: sessionId },
      include: {
        session: {
          include: { event: { include: { eventType: true } } },
        },
      },
    });
    if (!enrollment) throw new NotFoundException('Enrollment not found.');

    let stripeStatus: 'complete' | 'open' | 'expired' = 'open';
    try {
      const session =
        await this.stripeService.client.checkout.sessions.retrieve(sessionId);
      if (session.status === 'complete') stripeStatus = 'complete';
      else if (session.status === 'expired') stripeStatus = 'expired';
    } catch {
      throw new NotFoundException('Checkout session not found.');
    }

    return {
      stripeStatus,
      enrollment: {
        id: enrollment.id,
        status: enrollment.status,
        customerEmail: enrollment.customerEmail,
        sessionLabel: this.sessionLabel(enrollment.session),
        eventName: enrollment.session.event.eventType.name,
        eventSlug: enrollment.session.event.slug,
      },
    };
  }

  async handleClassWebhook(rawBody: Buffer, signature: string | undefined) {
    if (!signature) {
      throw new BadRequestException('Missing stripe-signature header.');
    }
    let event: StripeWebhookEventLite;
    try {
      event = this.stripeService.client.webhooks.constructEvent(
        rawBody,
        signature,
        this.stripeService.webhookSecret,
      ) as StripeWebhookEventLite;
    } catch {
      throw new BadRequestException('Invalid stripe-signature header.');
    }

    const sessionObj =
      event.type === 'checkout.session.completed' ||
      event.type === 'checkout.session.expired'
        ? this.parseCheckoutSession(event.data.object)
        : null;
    const flow = sessionObj?.metadata?.flow;
    if (flow !== 'class_session') {
      return { handled: false };
    }

    const already = await this.isStripeEventProcessed(event.id);
    if (already) return { handled: true, deduplicated: true };

    await this.trackStripeWebhookAttempt(event);
    try {
      if (event.type === 'checkout.session.completed') {
        await this.markEnrollmentPaid(sessionObj!, event.id);
      } else if (event.type === 'checkout.session.expired') {
        const sid = sessionObj?.id?.trim();
        if (sid) await this.markEnrollmentExpired(sid);
      }
      await this.markStripeEventProcessed(event.id);
      return { handled: true };
    } catch (err) {
      await this.markStripeEventFailed(event.id, err);
      throw err;
    }
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
    const event = await this.assertAdminUpcomingEvent(eventId);
    if (event.experienceType !== UpcomingExperienceType.VENUE_SEATING) {
      throw new BadRequestException('Event is not a venue seating experience.');
    }
    const config = await this.prisma.upcomingVenueConfig.findUnique({
      where: { eventId },
      include: {
        reservationEventTemplate: {
          include: { weekdays: { orderBy: { weekday: 'asc' } } },
        },
      },
    });
    return config ? this.mapVenueConfig(config) : null;
  }

  async upsertAdminVenueConfig(eventId: string, dto: UpsertVenueConfigDto) {
    const event = await this.assertAdminUpcomingEvent(eventId);
    const linkingTemplate = Boolean(dto.reservationEventTemplateId);

    if (
      !linkingTemplate &&
      event.experienceType !== UpcomingExperienceType.VENUE_SEATING
    ) {
      throw new BadRequestException('Event is not a venue seating experience.');
    }

    let templateDerived: ReturnType<typeof deriveVenueConfigFromTemplate> | null =
      null;
    let reservationEventTemplateId: string | null | undefined =
      dto.reservationEventTemplateId;

    if (dto.reservationEventTemplateId) {
      const template = await this.reservationTemplates.findByIdOrThrow(
        dto.reservationEventTemplateId,
      );
      templateDerived = deriveVenueConfigFromTemplate(template);
      const { experienceType, classVariant } = experienceFromScheduleMode(
        template.scheduleMode,
      );
      await this.prisma.event.update({
        where: { id: eventId },
        data: { experienceType, classVariant },
      });
    } else if (dto.reservationEventTemplateId === null) {
      reservationEventTemplateId = null;
    }

    const data = {
      clientEnabled: dto.clientEnabled,
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
      },
      include: {
        reservationEventTemplate: {
          include: { weekdays: { orderBy: { weekday: 'asc' } } },
        },
      },
    });
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

  private sessionLabel(session: { startsAt: Date; endsAt: Date; timezone: string }) {
    return `${session.startsAt.toISOString()} – ${session.endsAt.toISOString()} (${session.timezone})`;
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
  }) {
    return {
      id: session.id,
      startsAt: session.startsAt.toISOString(),
      endsAt: session.endsAt.toISOString(),
      timezone: session.timezone,
      capacity: session.capacity,
      price: Number(session.price),
      currency: session.currency,
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
    reservationEventTemplateId?: string | null;
    reservationEventTemplate?: Prisma.ReservationEventTemplateGetPayload<{
      include: { weekdays: true };
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
            summary: buildTemplateSummary(template),
          }
        : null,
    };
  }

  private parseCheckoutSession(raw: unknown): StripeCheckoutSessionLite {
    if (!raw || typeof raw !== 'object') {
      throw new BadRequestException('Invalid checkout session payload.');
    }
    return raw as StripeCheckoutSessionLite;
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
        session: { include: { event: { include: { eventType: true } } } },
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
  }

  private async markEnrollmentExpired(sessionId: string) {
    const enrollment = await this.prisma.upcomingClassEnrollment.findUnique({
      where: { stripeCheckoutSessionId: sessionId },
    });
    if (!enrollment) return;
    if (enrollment.status !== UpcomingClassEnrollmentStatus.PENDING_PAYMENT) return;
    await this.prisma.upcomingClassEnrollment.update({
      where: { id: enrollment.id },
      data: { status: UpcomingClassEnrollmentStatus.EXPIRED },
    });
  }

  private async sendClassConfirmation(
    enrollment: {
      customerName: string;
      customerEmail: string;
      amount: Prisma.Decimal;
      currency: string;
      session: {
        startsAt: Date;
        endsAt: Date;
        timezone: string;
        event: { eventType: { name: string } };
      };
    },
  ) {
    const eventName = enrollment.session.event.eventType.name;
    const amount = `${Number(enrollment.amount).toFixed(2)} ${enrollment.currency.toUpperCase()}`;
    const sessionLabel = this.sessionLabel(enrollment.session);
    await this.mail.sendTransactional({
      to: enrollment.customerEmail,
      toName: enrollment.customerName,
      subject: buildClassEnrollmentConfirmationSubject(eventName),
      text: buildClassEnrollmentConfirmationText({
        eventName,
        customerName: enrollment.customerName,
        sessionLabel,
        amount,
      }),
      html: buildClassEnrollmentConfirmationHtml({
        eventName,
        customerName: enrollment.customerName,
        sessionLabel,
        amount,
      }),
    });
  }

  private async isStripeEventProcessed(eventId: string) {
    const row = await this.prisma.stripeWebhookEvent.findUnique({
      where: { eventId },
      select: { processedAt: true },
    });
    return Boolean(row?.processedAt);
  }

  private async trackStripeWebhookAttempt(event: StripeWebhookEventLite) {
    await this.prisma.stripeWebhookEvent.upsert({
      where: { eventId: event.id },
      create: {
        eventId: event.id,
        eventType: event.type,
        livemode: event.livemode,
        attempts: 1,
      },
      update: { attempts: { increment: 1 }, eventType: event.type },
    });
  }

  private async markStripeEventProcessed(eventId: string) {
    await this.prisma.stripeWebhookEvent.update({
      where: { eventId },
      data: { processedAt: new Date(), lastError: null },
    });
  }

  private async markStripeEventFailed(eventId: string, err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    await this.prisma.stripeWebhookEvent.update({
      where: { eventId },
      data: { lastError: message.slice(0, 500) },
    });
  }
}
