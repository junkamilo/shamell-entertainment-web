import { createHash, randomBytes } from 'crypto';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  EventPublicSection,
  Prisma,
  UpcomingExperienceType,
  VenueSeatKind,
  VenueSeatReservationStatus,
  VenueTableSize,
} from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { FloorLayoutService } from '../floor-layout/floor-layout.service';
import { emailBrandingFromConfig } from '../mail/email-html-branding';
import { MailService } from '../mail/mail.service';
import { AdminPaymentNotifyService } from '../mail/admin-payment-notify.service';
import { fetchPaymentMethodDetails } from '../stripe/stripe-payment-details.util';
import { STRIPE_EMBEDDED_CHECKOUT_BASE } from '../stripe/stripe-embedded-checkout.util';
import {
  assertCheckoutPaidAmounts,
  stripeAutomaticTaxParams,
  stripeTaxProductData,
} from '../stripe/stripe-tax.util';
import { StripeService } from '../stripe/stripe.service';
import { formatVenueTableSizeLabel } from '../venue-tables/venue-table-names.util';
import { maskCustomerName, maskEmail } from '../../common/util/mask-pii.util';
import { formatEventDateInZone } from '../../common/util/event-date-in-zone.util';
import {
  evaluateSalesWindow,
  resolveReservationWindow,
} from '../venue-layout-settings/reservation-sales-window.util';
import {
  assertCanonicalEventNightForCheckout,
  canonicalEventNightFromVenueConfig,
  resolveCanonicalReservationEventDate,
} from './resolve-canonical-reservation-event-date.util';
import { CreateCheckoutSessionDto } from './dto/create-checkout-session.dto';
import type { VenueReservationPaymentChannel } from './venue-reservation-payment-channel.const';
import {
  buildVenueReservationConfirmationHtml,
  buildVenueReservationConfirmationSubject,
  buildVenueReservationConfirmationText,
} from './venue-reservation-confirmation.mail';
import { buildVenueReservationConfirmationPdf } from './venue-reservation-confirmation-pdf.util';
import {
  signConfirmationShareToken,
  verifyConfirmationShareToken,
} from './venue-reservation-confirmation-share.util';
import {
  buildVenueReservationPaymentRequestHtml,
  buildVenueReservationPaymentRequestSubject,
  buildVenueReservationPaymentRequestText,
} from './venue-reservation-payment-request.mail';
import {
  resolveVenueSeatDisplayLabel,
  toShortSeatDisplayLabel,
} from './venue-seat-display-label.util';

const CHECKOUT_TTL_MINUTES = 30;

const venueSeatReservationTableInclude = {
  venueTableConfig: { select: { tableName: true, size: true } },
} as const;

type VenueSeatReservationWithTableConfig =
  Prisma.VenueSeatReservationGetPayload<{
    include: typeof venueSeatReservationTableInclude;
  }>;

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
  amount_subtotal?: number | null;
  currency?: string | null;
};

@Injectable()
export class VenueReservationsService {
  private readonly logger = new Logger(VenueReservationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly mail: MailService,
    private readonly adminPaymentNotify: AdminPaymentNotifyService,
    private readonly stripeService: StripeService,
    private readonly floorLayout: FloorLayoutService,
  ) {}

  async getAvailability(query?: {
    upcomingEventId?: string;
    upcomingEventSlug?: string;
  }) {
    const ctx = await this.resolveVenueContext(query);
    const settings = ctx.settings;
    const window = settings.window;
    const eventDate = await this.resolveCanonicalEventDateOptional(ctx);

    if (!settings.clientEnabled || !eventDate || !ctx.upcomingEventId) {
      return {
        upcomingEventId: ctx.upcomingEventId,
        upcomingEventSlug: ctx.slug,
        eventDate: null,
        reservationOpensAt: window.opensAt?.toISOString() ?? null,
        reservationClosesAt: window.closesAt?.toISOString() ?? null,
        reservationsOpen: false,
        salesClosedReason: 'not_configured' as const,
        reservedLayoutItemIds: [] as string[],
        reservedVenueTableConfigIds: [] as string[],
        reservedSeatShortLabels: [] as string[],
        paidSeatHolders: [] as { layoutItemId: string; customerName: string }[],
      };
    }

    const paid = await this.findPaidReservations(ctx.upcomingEventId);
    const reservedSeatShortLabels = await this.resolveReservedSeatShortLabels(
      paid,
      ctx.floorLayoutId,
    );
    const soldOut = await this.isInventorySoldOut(
      ctx.upcomingEventId,
      ctx.floorLayoutId,
    );
    const windowStatus = evaluateSalesWindow(window);
    const reservationsOpen = windowStatus.open && !soldOut;
    const salesClosedReason = soldOut
      ? ('sold_out' as const)
      : windowStatus.open
        ? null
        : windowStatus.reason;

    return {
      upcomingEventId: ctx.upcomingEventId,
      upcomingEventSlug: ctx.slug,
      eventDate: eventDate.toISOString(),
      reservationOpensAt: window.opensAt?.toISOString() ?? null,
      reservationClosesAt: window.closesAt?.toISOString() ?? null,
      reservationsOpen,
      salesClosedReason,
      reservedLayoutItemIds: [...new Set(paid.map((r) => r.layoutItemId))],
      reservedVenueTableConfigIds: [
        ...new Set(
          paid
            .map((r) => r.venueTableConfigId)
            .filter((id): id is string => Boolean(id)),
        ),
      ],
      reservedSeatShortLabels,
      paidSeatHolders: paid.map((r) => ({
        layoutItemId: r.layoutItemId,
        customerName: r.customerName.trim() || 'Guest',
      })),
    };
  }

  async createCheckoutSession(dto: CreateCheckoutSessionDto) {
    const ctx = await this.resolveVenueContext({
      upcomingEventId: dto.upcomingEventId,
      upcomingEventSlug: dto.upcomingEventSlug,
    });
    const settings = ctx.settings;
    if (!settings.clientEnabled || !ctx.upcomingEventId) {
      throw new BadRequestException('On Coming Events is not published.');
    }

    const window = settings.window;
    const eventDate = await this.resolveCanonicalEventDateFromContext(ctx);

    const windowStatus = evaluateSalesWindow(window);
    if (!windowStatus.open) {
      const message =
        windowStatus.reason === 'not_started'
          ? 'Reservations are not open yet.'
          : windowStatus.reason === 'ended'
            ? 'Reservations have closed.'
            : 'Reservations are not open.';
      throw new BadRequestException(message);
    }

    if (await this.isInventorySoldOut(ctx.upcomingEventId, ctx.floorLayoutId)) {
      throw new BadRequestException('All seats are sold.');
    }

    const seat = await this.resolveSeatSelection(dto, ctx.floorLayoutId);
    await this.assertSeatAvailable({
      kind: seat.kind,
      layoutItemId: seat.layoutItemId,
      venueTableConfigId: seat.venueTableConfigId,
      eventDate,
      upcomingEventId: ctx.upcomingEventId,
    });

    const eventLabel = this.buildReservationEventLabel(
      eventDate,
      settings.reservationTimezone,
      settings.reservationEventLabel,
    );
    let eventSlug = ctx.slug;
    if (!eventSlug && ctx.upcomingEventId) {
      const eventRow = await this.prisma.event.findUnique({
        where: { id: ctx.upcomingEventId },
        select: { slug: true },
      });
      eventSlug = eventRow?.slug ?? null;
    }
    const returnUrl = this.buildPublicVenueReturnUrl(eventSlug);
    const { session, expiresAt } = await this.createStripeCheckoutSession({
      amount: seat.amount,
      productName: seat.productName,
      eventLabel,
      customerEmail: dto.customerEmail,
      returnUrl,
      metadata: { flow: 'venue_seat' },
    });

    const reservation = await this.createPendingStripeReservation({
      upcomingEventId: ctx.upcomingEventId,
      seat,
      eventDate,
      dto,
      sessionId: session.id,
      expiresAt,
      paymentChannel: 'STRIPE',
      createdByAdminId: null,
      payTokenHash: null,
    });

    await this.stripeService.client.checkout.sessions.update(session.id, {
      metadata: {
        flow: 'venue_seat',
        reservationId: reservation.id,
        upcomingEventId: ctx.upcomingEventId,
      },
    });

    this.logger.log(
      `checkout-session reservationId=${reservation.id} session=${session.id}`,
    );

    return {
      clientSecret: session.client_secret,
      reservationId: reservation.id,
    };
  }

  async getAdminAvailability(query?: {
    upcomingEventId?: string;
    upcomingEventSlug?: string;
  }) {
    const ctx = await this.resolveVenueContext(query);
    const eventDate = await this.assertAdminEventDate(ctx);
    const upcomingEventId = ctx.upcomingEventId!;

    const paid = await this.findPaidReservations(upcomingEventId);
    const blocking = await this.findBlockingReservations(upcomingEventId);
    const pending = blocking.filter(
      (r) => !paid.some((p) => p.layoutItemId === r.layoutItemId),
    );
    const reservedSeatShortLabels = await this.resolveReservedSeatShortLabels(
      paid,
      ctx.floorLayoutId,
    );

    return {
      upcomingEventId,
      upcomingEventSlug: ctx.slug,
      eventDate: eventDate.toISOString(),
      reservedLayoutItemIds: [...new Set(paid.map((r) => r.layoutItemId))],
      reservedVenueTableConfigIds: [
        ...new Set(
          paid
            .map((r) => r.venueTableConfigId)
            .filter((id): id is string => Boolean(id)),
        ),
      ],
      reservedSeatShortLabels,
      pendingLayoutItemIds: [...new Set(pending.map((r) => r.layoutItemId))],
      paidSeatHolders: paid.map((r) => ({
        layoutItemId: r.layoutItemId,
        customerName: r.customerName.trim() || 'Guest',
      })),
    };
  }

  async createAdminCheckoutSession(
    adminUserId: string,
    dto: CreateCheckoutSessionDto,
  ) {
    const ctx = await this.resolveVenueContext({
      upcomingEventId: dto.upcomingEventId,
      upcomingEventSlug: dto.upcomingEventSlug,
    });
    const eventDate = await this.assertAdminEventDate(ctx);
    const upcomingEventId = ctx.upcomingEventId!;

    const seat = await this.resolveSeatSelection(dto, ctx.floorLayoutId);
    await this.assertSeatAvailable({
      kind: seat.kind,
      layoutItemId: seat.layoutItemId,
      venueTableConfigId: seat.venueTableConfigId,
      eventDate,
      upcomingEventId,
    });

    const settings = ctx.settings;
    const eventLabel = this.buildReservationEventLabel(
      eventDate,
      settings.reservationTimezone,
      settings.reservationEventLabel,
    );
    const returnUrl = `${this.stripeService.frontendUrl().replace(/\/$/, '')}/pay/venue-seat/return?session_id={CHECKOUT_SESSION_ID}`;
    const rawToken = randomBytes(32).toString('hex');
    const payTokenHash = this.hashPayToken(rawToken);

    const { session, expiresAt } = await this.createStripeCheckoutSession({
      amount: seat.amount,
      productName: seat.productName,
      eventLabel,
      customerEmail: dto.customerEmail,
      returnUrl,
      metadata: {
        flow: 'venue_seat',
        adminUserId,
        paymentChannel: 'STRIPE',
      },
    });

    const reservation = await this.createPendingStripeReservation({
      upcomingEventId,
      seat,
      eventDate,
      dto,
      sessionId: session.id,
      expiresAt,
      paymentChannel: 'STRIPE',
      createdByAdminId: adminUserId,
      payTokenHash,
    });

    await this.stripeService.client.checkout.sessions.update(session.id, {
      metadata: {
        flow: 'venue_seat',
        reservationId: reservation.id,
        upcomingEventId,
        adminUserId,
        paymentChannel: 'STRIPE',
      },
    });

    const payUrl = this.buildVenueSeatPayUrl(rawToken);
    await this.sendReservationPaymentRequestEmail({
      reservation,
      seatLabel: seat.productName,
      eventLabel,
      payUrl,
    });

    this.logger.log(
      `admin-checkout-session reservationId=${reservation.id} session=${session.id} admin=${adminUserId}`,
    );

    return {
      reservationId: reservation.id,
      message: 'Payment link sent to customer.',
      payUrl,
    };
  }

  async createAdminCashReservation(
    adminUserId: string,
    dto: CreateCheckoutSessionDto,
  ) {
    const ctx = await this.resolveVenueContext({
      upcomingEventId: dto.upcomingEventId,
      upcomingEventSlug: dto.upcomingEventSlug,
    });
    const eventDate = await this.assertAdminEventDate(ctx);
    const upcomingEventId = ctx.upcomingEventId!;

    const seat = await this.resolveSeatSelection(dto, ctx.floorLayoutId);
    await this.assertSeatAvailable({
      kind: seat.kind,
      layoutItemId: seat.layoutItemId,
      venueTableConfigId: seat.venueTableConfigId,
      eventDate,
      upcomingEventId,
    });

    const now = new Date();
    const saved = await this.createPaidCashReservation({
      upcomingEventId,
      kind: seat.kind,
      venueTableConfigId: seat.venueTableConfigId,
      layoutItemId: seat.layoutItemId,
      eventDate,
      amount: seat.amount,
      currency: 'usd',
      status: VenueSeatReservationStatus.PAID,
      paymentChannel: 'CASH',
      stripeCheckoutSessionId: null,
      paymentMethodType: 'cash',
      customerName: dto.customerName.trim(),
      customerEmail: dto.customerEmail.trim().toLowerCase(),
      customerPhone: dto.customerPhone?.trim() || null,
      paidAt: now,
      createdByAdminId: adminUserId,
    });

    this.logger.log(
      `admin-cash-reservation id=${saved.id} admin=${adminUserId}`,
    );

    const sent = await this.sendReservationPaidConfirmationEmail(saved);
    if (sent) {
      await this.prisma.venueSeatReservation.update({
        where: { id: saved.id },
        data: { customerEmailSentAt: now },
      });
    }

    await this.adminPaymentNotify.notifyPaymentOutcome({
      outcome: 'PAID',
      flow: 'VENUE_SEAT',
      customerName: saved.customerName,
      customerEmail: saved.customerEmail,
      amount: Number(saved.amount),
      currency: saved.currency,
      contextLabel: await this.venueReservationContextLabel(saved),
      reference: saved.id.slice(0, 8).toUpperCase(),
    });

    return {
      message: 'Cash reservation confirmed.',
      reservation: this.mapReservationAdmin(saved),
    };
  }

  async resolvePayCheckoutClientSecret(token: string): Promise<string> {
    const reservation = await this.findActiveReservationByPayToken(token);
    if (!reservation.stripeCheckoutSessionId) {
      throw new BadRequestException(
        'Checkout is not available for this reservation.',
      );
    }

    const session = await this.stripeService.client.checkout.sessions.retrieve(
      reservation.stripeCheckoutSessionId,
    );

    if (session.status === 'complete' && session.payment_status === 'paid') {
      throw new BadRequestException('This payment has already been completed.');
    }
    if (session.status === 'expired') {
      await this.markExpiredFromSession(reservation.stripeCheckoutSessionId);
      throw new BadRequestException('Payment link has expired.');
    }
    if (!session.client_secret) {
      throw new BadRequestException('Could not start checkout.');
    }
    return session.client_secret;
  }

  async getSessionStatus(sessionId: string) {
    const reservation = await this.prisma.venueSeatReservation.findUnique({
      where: { stripeCheckoutSessionId: sessionId },
      include: {
        venueTableConfig: { select: { tableName: true, size: true } },
      },
    });

    if (!reservation) {
      throw new NotFoundException('Reservation not found.');
    }

    let stripeStatus: 'complete' | 'open' | 'expired' = 'open';
    let stripeSession: {
      status: string | null;
      payment_status: string | null;
    };
    try {
      stripeSession =
        await this.stripeService.client.checkout.sessions.retrieve(sessionId);
      if (stripeSession.status === 'complete') stripeStatus = 'complete';
      else if (stripeSession.status === 'expired') stripeStatus = 'expired';
    } catch {
      throw new NotFoundException('Checkout session not found.');
    }

    if (
      stripeSession.status === 'complete' &&
      stripeSession.payment_status === 'paid' &&
      reservation.status === VenueSeatReservationStatus.PENDING_PAYMENT
    ) {
      try {
        await this.markPaidFromSession(
          this.parseCheckoutSession(stripeSession),
          'return-page-reconcile',
        );
      } catch (err) {
        this.logger.warn(
          `venue-reconcile-on-status-failed session=${sessionId} reason=${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }

    const refreshed = await this.prisma.venueSeatReservation.findUnique({
      where: { stripeCheckoutSessionId: sessionId },
      include: {
        venueTableConfig: { select: { tableName: true, size: true } },
      },
    });
    const current = refreshed ?? reservation;

    return {
      stripeStatus,
      reservation: await this.mapReservationPublicEnriched(current),
    };
  }

  /** @deprecated Use unified POST /api/v1/stripe/webhook dispatch */
  async handleWebhookEvent(
    rawBody: Buffer,
    signature: string | string[] | undefined,
  ) {
    if (!signature || Array.isArray(signature)) {
      throw new BadRequestException('Missing stripe-signature header.');
    }
    const event = this.stripeService.client.webhooks.constructEvent(
      rawBody,
      signature,
      this.stripeService.webhookSecret,
    ) as StripeWebhookEventLite;
    return this.processStripeWebhookEvent(event);
  }

  async processStripeWebhookEvent(
    event: StripeWebhookEventLite,
  ): Promise<{ received: true; handled?: boolean }> {
    if (event.type === 'checkout.session.completed') {
      const session = this.parseCheckoutSession(event.data.object);
      const flow = session.metadata?.flow?.trim();
      if (
        flow === 'class_session' ||
        flow === 'fixed_event_ticket' ||
        flow === 'booking_quote'
      ) {
        return { received: true, handled: false };
      }
      const paid = await this.markPaidFromSession(session, event.id);
      return { received: true, handled: paid };
    }
    if (event.type === 'checkout.session.expired') {
      const session = this.parseCheckoutSession(event.data.object);
      const flow = session.metadata?.flow?.trim();
      if (
        flow === 'class_session' ||
        flow === 'fixed_event_ticket' ||
        flow === 'booking_quote'
      ) {
        return { received: true, handled: false };
      }
      const sessionId = session.id?.trim();
      if (!sessionId) {
        throw new BadRequestException(
          'Invalid checkout.session.expired payload.',
        );
      }
      await this.markExpiredFromSession(sessionId);
      return { received: true, handled: true };
    }
    return { received: true, handled: false };
  }

  async listAdminReservations(query: {
    page?: number;
    perPage?: number;
    status?: VenueSeatReservationStatus;
    eventDate?: string;
    layoutItemId?: string;
    paymentChannel?: VenueReservationPaymentChannel;
  }) {
    const page = Math.max(1, Number(query.page ?? 1));
    const perPage = Number(query.perPage ?? 10);
    const where: Prisma.VenueSeatReservationWhereInput = {};
    if (query.status) where.status = query.status;
    if (query.eventDate) {
      const parsed = new Date(query.eventDate);
      if (Number.isNaN(parsed.getTime())) {
        throw new BadRequestException('Invalid eventDate filter.');
      }
      where.eventDate = parsed;
    }
    if (query.layoutItemId?.trim()) {
      where.layoutItemId = query.layoutItemId.trim();
    }
    if (query.paymentChannel) {
      (
        where as Prisma.VenueSeatReservationWhereInput & {
          paymentChannel?: VenueReservationPaymentChannel;
        }
      ).paymentChannel = query.paymentChannel;
    }
    const upcomingEventId = (query as { upcomingEventId?: string })
      .upcomingEventId;
    if (upcomingEventId?.trim()) {
      where.upcomingEventId = upcomingEventId.trim();
    }

    const [totalItems, rows] = await Promise.all([
      this.prisma.venueSeatReservation.count({ where }),
      this.prisma.venueSeatReservation.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }],
        skip: (page - 1) * perPage,
        take: perPage,
        include: {
          venueTableConfig: { select: { tableName: true, size: true } },
        },
      }),
    ]);

    const totalPages = totalItems === 0 ? 1 : Math.ceil(totalItems / perPage);

    return {
      reservations: rows.map((r) => this.mapReservationAdmin(r)),
      meta: {
        page,
        perPage,
        totalItems,
        totalPages,
        hasPrev: page > 1,
        hasNext: page < totalPages,
      },
    };
  }

  async cancelAdminReservation(id: string) {
    const row = await this.prisma.venueSeatReservation.findUnique({
      where: { id },
    });
    if (!row) throw new NotFoundException('Reservation not found.');
    if (row.status === VenueSeatReservationStatus.CANCELLED) {
      const existing = await this.prisma.venueSeatReservation.findUnique({
        where: { id },
        include: {
          venueTableConfig: { select: { tableName: true, size: true } },
        },
      });
      return {
        message: 'Reservation already cancelled.',
        reservation: this.mapReservationAdmin(existing ?? row),
      };
    }

    const saved = await this.prisma.venueSeatReservation.update({
      where: { id },
      data: { status: VenueSeatReservationStatus.CANCELLED },
      include: {
        venueTableConfig: { select: { tableName: true, size: true } },
      },
    });

    this.logger.log(`reservation-cancelled id=${id}`);

    await this.adminPaymentNotify.notifyPaymentOutcome({
      outcome: 'CANCELLED',
      flow: 'VENUE_SEAT',
      customerName: saved.customerName,
      customerEmail: saved.customerEmail,
      amount: Number(saved.amount),
      currency: saved.currency,
      contextLabel: await this.venueReservationContextLabel(saved),
      reference: saved.id.slice(0, 8).toUpperCase(),
    });

    return {
      message: 'Reservation cancelled.',
      reservation: this.mapReservationAdmin(saved),
    };
  }

  async resendAdminPaidConfirmationEmail(reservationId: string) {
    const row = await this.prisma.venueSeatReservation.findUnique({
      where: { id: reservationId },
      include: venueSeatReservationTableInclude,
    });
    if (!row) {
      throw new NotFoundException('Reservation not found.');
    }
    if (row.status !== VenueSeatReservationStatus.PAID) {
      throw new BadRequestException(
        'Only paid reservations can receive a confirmation resend.',
      );
    }

    const sent = await this.sendReservationPaidConfirmationEmail(row);
    if (!sent) {
      throw new BadRequestException('Could not send confirmation email.');
    }

    await this.prisma.venueSeatReservation.update({
      where: { id: row.id },
      data: { customerEmailSentAt: new Date() },
    });

    this.logger.log(
      `reservation-confirmation-resent id=${row.id} to=${row.customerEmail}`,
    );

    return {
      message: 'Confirmation email sent.',
      reservationId: row.id,
      customerName: row.customerName,
      customerEmail: maskEmail(row.customerEmail) ?? undefined,
    };
  }

  async resendAdminPaidConfirmationForCustomers(customerNames: string[]) {
    const names = [
      ...new Set(customerNames.map((name) => name.trim()).filter(Boolean)),
    ];
    if (names.length === 0) {
      throw new BadRequestException('At least one customer name is required.');
    }

    const results: Array<{
      customerName: string;
      sent: boolean;
      reservationId?: string;
      customerEmail?: string;
      error?: string;
    }> = [];

    for (const name of names) {
      const row = await this.findPaidReservationForCustomerName(name);

      if (!row) {
        results.push({
          customerName: name,
          sent: false,
          error: 'Paid reservation not found.',
        });
        continue;
      }

      const sent = await this.sendReservationPaidConfirmationEmail(row);
      if (!sent) {
        results.push({
          customerName: name,
          sent: false,
          reservationId: row.id,
          customerEmail: maskEmail(row.customerEmail) ?? undefined,
          error: 'Mail provider failed.',
        });
        continue;
      }

      await this.prisma.venueSeatReservation.update({
        where: { id: row.id },
        data: { customerEmailSentAt: new Date() },
      });

      this.logger.log(
        `reservation-confirmation-resent id=${row.id} to=${row.customerEmail}`,
      );

      results.push({
        customerName: row.customerName,
        sent: true,
        reservationId: row.id,
        customerEmail: maskEmail(row.customerEmail) ?? undefined,
      });
    }

    return {
      message: 'Confirmation resend finished.',
      results,
    };
  }

  async getConfirmationPdfDownload(token: string): Promise<{
    buffer: Buffer;
    filename: string;
  }> {
    const parsed = verifyConfirmationShareToken(
      token.trim(),
      this.confirmationShareSecret(),
    );
    if (!parsed) {
      throw new BadRequestException('Invalid confirmation download link.');
    }

    const row = await this.prisma.venueSeatReservation.findUnique({
      where: { id: parsed.reservationId },
      include: venueSeatReservationTableInclude,
    });
    if (!row || row.status !== VenueSeatReservationStatus.PAID) {
      throw new NotFoundException('Reservation confirmation not found.');
    }
    if (!row.paidAt || row.paidAt.toISOString() !== parsed.paidAtIso) {
      throw new BadRequestException('Invalid confirmation download link.');
    }

    const reservationKindLabel =
      row.kind === VenueSeatKind.CATALOG_TABLE ? 'Table' : 'Chair';
    const layoutItemLabel =
      await this.resolveSeatDisplayLabelForReservation(row);
    const appPublicName =
      this.config.get<string>('APP_PUBLIC_NAME')?.trim() ??
      'Shamell Entertainment';

    let reservationTimezone = 'America/New_York';
    if (row.upcomingEventId) {
      const config = await this.prisma.upcomingVenueConfig.findUnique({
        where: { eventId: row.upcomingEventId },
        select: { reservationTimezone: true },
      });
      reservationTimezone =
        config?.reservationTimezone ??
        (await this.getLegacyReservationSettings()).reservationTimezone;
    } else {
      reservationTimezone = (await this.getLegacyReservationSettings())
        .reservationTimezone;
    }

    const canonicalEventDate = await resolveCanonicalReservationEventDate(
      this.prisma,
      {
        upcomingEventId: row.upcomingEventId,
        storedEventDate: row.eventDate,
      },
    );

    const buffer = await buildVenueReservationConfirmationPdf({
      appPublicName,
      recipientName: row.customerName.trim() || 'Guest',
      reservationKindLabel,
      layoutItemLabel,
      eventDate: canonicalEventDate ?? row.eventDate,
      reservationTimezone,
    });

    return {
      buffer,
      filename: 'shamell-reservation-confirmation.pdf',
    };
  }

  private confirmationShareSecret(): string {
    return this.config.get<string>('JWT_SECRET') ?? 'change-me-in-production';
  }

  private backendPublicUrl(): string {
    const configured =
      this.config.get<string>('BACKEND_PUBLIC_URL')?.trim() ||
      this.config.get<string>('NEXT_PUBLIC_BACKEND_URL')?.trim();
    if (configured) {
      return configured.replace(/\/$/, '');
    }
    const port = this.config.get<string>('PORT') ?? '3001';
    return `http://localhost:${port}`;
  }

  private buildConfirmationPdfDownloadUrl(row: {
    id: string;
    paidAt: Date | null;
    kind: VenueSeatKind;
  }): string | undefined {
    if (row.kind !== VenueSeatKind.CATALOG_TABLE || !row.paidAt) {
      return undefined;
    }
    const token = signConfirmationShareToken(
      row.id,
      row.paidAt.toISOString(),
      this.confirmationShareSecret(),
    );
    return `${this.backendPublicUrl()}/api/v1/venue-reservations/public/confirmation.pdf?token=${encodeURIComponent(token)}`;
  }

  private async findPaidReservationForCustomerName(name: string) {
    const baseWhere = {
      status: VenueSeatReservationStatus.PAID,
    } as const;

    const exact = await this.prisma.venueSeatReservation.findFirst({
      where: {
        ...baseWhere,
        customerName: { equals: name, mode: 'insensitive' },
      },
      orderBy: { paidAt: 'desc' },
      include: venueSeatReservationTableInclude,
    });
    if (exact) {
      return exact;
    }

    return this.prisma.venueSeatReservation.findFirst({
      where: {
        ...baseWhere,
        customerName: { startsWith: name, mode: 'insensitive' },
      },
      orderBy: { paidAt: 'desc' },
      include: venueSeatReservationTableInclude,
    });
  }

  private async markPaidFromSession(
    session: StripeCheckoutSessionLite,
    stripeEventId: string,
  ): Promise<boolean> {
    const sessionId = session.id?.trim();
    if (!sessionId) {
      throw new BadRequestException('Invalid checkout session id.');
    }
    const reservation = await this.prisma.venueSeatReservation.findUnique({
      where: { stripeCheckoutSessionId: sessionId },
    });
    if (!reservation) {
      this.logger.warn(
        `webhook-paid-missing-reservation session=${sessionId} eventId=${stripeEventId}`,
      );
      return false;
    }
    if (reservation.status === VenueSeatReservationStatus.PAID) {
      this.logger.log(
        `webhook-paid-already-processed reservationId=${reservation.id} session=${sessionId} eventId=${stripeEventId}`,
      );
      return true;
    }

    if (session.payment_status !== 'paid') {
      throw new BadRequestException(
        `checkout.session.completed is not paid for session=${sessionId}.`,
      );
    }

    assertCheckoutPaidAmounts(session, {
      expectedSubtotalCents: Math.round(Number(reservation.amount) * 100),
      expectedCurrency: reservation.currency,
      sessionLabel: sessionId,
    });

    const paymentIntent = session.payment_intent;
    const paymentIntentId =
      typeof paymentIntent === 'string'
        ? paymentIntent
        : (paymentIntent?.id ?? null);
    const paymentDetails = await fetchPaymentMethodDetails(
      this.stripeService.client,
      session,
    );

    const saved = await this.prisma.venueSeatReservation.update({
      where: { id: reservation.id },
      data: {
        status: VenueSeatReservationStatus.PAID,
        paidAt: new Date(),
        stripePaymentIntentId: paymentIntentId,
        expiresAt: null,
        paymentMethodType: paymentDetails.paymentMethodType,
        paymentMethodBrand: paymentDetails.paymentMethodBrand,
        paymentMethodLast4: paymentDetails.paymentMethodLast4,
      },
      include: {
        venueTableConfig: { select: { tableName: true, size: true } },
      },
    });

    this.logger.log(
      `reservation-paid reservationId=${reservation.id} session=${sessionId} eventId=${stripeEventId} paymentIntent=${paymentIntentId ?? 'null'}`,
    );

    if (!reservation.customerEmailSentAt) {
      const sent = await this.sendReservationPaidConfirmationEmail(saved);
      if (sent) {
        await this.prisma.venueSeatReservation.update({
          where: { id: saved.id },
          data: { customerEmailSentAt: new Date() },
        });
      }
    }

    await this.adminPaymentNotify.notifyPaymentOutcome({
      outcome: 'PAID',
      flow: 'VENUE_SEAT',
      customerName: saved.customerName,
      customerEmail: saved.customerEmail,
      amount: Number(saved.amount),
      currency: saved.currency,
      contextLabel: await this.venueReservationContextLabel(saved),
      reference: saved.id.slice(0, 8).toUpperCase(),
    });
    return true;
  }

  private async venueReservationContextLabel(row: {
    kind: VenueSeatKind;
    layoutItemId: string;
    venueTableConfigId: string | null;
    upcomingEventId: string | null;
    venueTableConfig?: { tableName: string; size: string } | null;
  }): Promise<string> {
    let eventName = 'Venue event';
    if (row.upcomingEventId) {
      const event = await this.prisma.event.findUnique({
        where: { id: row.upcomingEventId },
        include: { eventType: { select: { name: true } } },
      });
      if (event?.eventType?.name) eventName = event.eventType.name;
    }
    const kindLabel =
      row.kind === VenueSeatKind.STANDALONE_CHAIR ? 'Chair' : 'Table';
    const seatLabel = await this.resolveSeatDisplayLabelForReservation({
      kind: row.kind,
      layoutItemId: row.layoutItemId,
      venueTableConfigId: row.venueTableConfigId,
      upcomingEventId: row.upcomingEventId,
      venueTableConfig: row.venueTableConfig ?? null,
    });
    const seatSuffix = seatLabel
      ? ` — ${toShortSeatDisplayLabel(seatLabel)}`
      : '';
    return `${eventName} (${kindLabel}${seatSuffix})`;
  }

  private async markExpiredFromSession(sessionId: string) {
    const reservation = await this.prisma.venueSeatReservation.findUnique({
      where: { stripeCheckoutSessionId: sessionId },
    });
    if (!reservation) return;
    if (reservation.status !== VenueSeatReservationStatus.PENDING_PAYMENT) {
      return;
    }

    await this.prisma.venueSeatReservation.update({
      where: { id: reservation.id },
      data: { status: VenueSeatReservationStatus.EXPIRED },
    });

    this.logger.log(
      `reservation-expired id=${reservation.id} session=${sessionId}`,
    );

    await this.adminPaymentNotify.notifyPaymentOutcome({
      outcome: 'EXPIRED',
      flow: 'VENUE_SEAT',
      customerName: reservation.customerName,
      customerEmail: reservation.customerEmail,
      amount: Number(reservation.amount),
      currency: reservation.currency,
      contextLabel: await this.venueReservationContextLabel(reservation),
      reference: reservation.id.slice(0, 8).toUpperCase(),
    });
  }

  private async resolveVenueContext(query?: {
    upcomingEventId?: string;
    upcomingEventSlug?: string;
  }) {
    if (query?.upcomingEventId || query?.upcomingEventSlug) {
      const event = await this.prisma.event.findFirst({
        where: {
          publicSection: EventPublicSection.UPCOMING_EVENTS,
          experienceType: UpcomingExperienceType.VENUE_SEATING,
          isActive: true,
          ...(query.upcomingEventId
            ? { id: query.upcomingEventId }
            : { slug: query.upcomingEventSlug!.toLowerCase() }),
        },
        include: { venueConfig: true },
      });
      if (!event) {
        throw new NotFoundException('Venue upcoming event not found.');
      }
      const config = event.venueConfig;
      const window = resolveReservationWindow({
        reservationOpensAt: config?.reservationOpensAt ?? null,
        reservationClosesAt: config?.reservationClosesAt ?? null,
        reservationEventDate: config?.reservationEventDate ?? null,
      });
      return this.finalizeVenueContext({
        upcomingEventId: event.id,
        slug: event.slug,
        floorLayoutId: config?.floorLayoutId ?? null,
        settings: {
          clientEnabled: config?.clientEnabled ?? false,
          window,
          reservationEventLabel: config?.reservationEventLabel ?? null,
          reservationTimezone:
            config?.reservationTimezone ?? 'America/New_York',
        },
      });
    }

    const legacyEvent = await this.prisma.event.findFirst({
      where: {
        publicSection: EventPublicSection.UPCOMING_EVENTS,
        experienceType: UpcomingExperienceType.VENUE_SEATING,
      },
      orderBy: { createdAt: 'asc' },
      include: { venueConfig: true },
    });
    if (legacyEvent?.venueConfig) {
      const config = legacyEvent.venueConfig;
      const window = resolveReservationWindow({
        reservationOpensAt: config.reservationOpensAt,
        reservationClosesAt: config.reservationClosesAt,
        reservationEventDate: config.reservationEventDate,
      });
      return this.finalizeVenueContext({
        upcomingEventId: legacyEvent.id,
        slug: legacyEvent.slug,
        floorLayoutId: config.floorLayoutId,
        settings: {
          clientEnabled: config.clientEnabled,
          window,
          reservationEventLabel: config.reservationEventLabel,
          reservationTimezone: config.reservationTimezone,
        },
      });
    }

    const settings = await this.getLegacyReservationSettings();
    return this.finalizeVenueContext({
      upcomingEventId: legacyEvent?.id ?? null,
      slug: legacyEvent?.slug ?? null,
      floorLayoutId: null,
      settings,
    });
  }

  private async finalizeVenueContext(ctx: {
    upcomingEventId: string | null;
    slug: string | null;
    floorLayoutId: string | null;
    settings: {
      clientEnabled: boolean;
      window: ReturnType<typeof resolveReservationWindow>;
      reservationEventLabel: string | null;
      reservationTimezone: string;
    };
  }) {
    const floorLayoutId =
      ctx.floorLayoutId ?? (await this.floorLayout.getActiveFloorLayoutId());
    return { ...ctx, floorLayoutId };
  }

  private async getLegacyReservationSettings() {
    const row = await this.prisma.venueLayoutClientSettings.findFirst({
      orderBy: { updatedAt: 'desc' },
    });
    const window = resolveReservationWindow({
      reservationOpensAt: row?.reservationOpensAt ?? null,
      reservationClosesAt: row?.reservationClosesAt ?? null,
      reservationEventDate: row?.reservationEventDate ?? null,
    });
    return {
      clientEnabled: row?.clientEnabled ?? false,
      window,
      reservationEventLabel: row?.reservationEventLabel ?? null,
      reservationTimezone: row?.reservationTimezone ?? 'America/New_York',
    };
  }

  private async isInventorySoldOut(
    upcomingEventId: string,
    floorLayoutId: string | null,
  ): Promise<boolean> {
    const layout =
      await this.floorLayout.getPublicFloorLayoutForClient(floorLayoutId);
    const reservableIds = layout.items
      .filter(
        (item) =>
          item.kind === 'catalog_table' || item.kind === 'standalone_chair',
      )
      .map((item) => item.id);
    if (reservableIds.length === 0) {
      return true;
    }

    const paid = await this.findPaidReservations(upcomingEventId);
    const reserved = new Set(paid.map((r) => r.layoutItemId));
    return reservableIds.every((id) => reserved.has(id));
  }

  private async assertAdminEventDate(
    ctx: Awaited<ReturnType<typeof this.resolveVenueContext>>,
  ) {
    if (!ctx.upcomingEventId) {
      throw new BadRequestException('No upcoming venue event configured.');
    }
    if (!ctx.floorLayoutId) {
      throw new BadRequestException(
        'Floor layout is not configured. Save the seating layout in the 3D editor first.',
      );
    }
    try {
      return await this.resolveCanonicalEventDateFromContext(ctx);
    } catch (err) {
      if (err instanceof BadRequestException) {
        throw new BadRequestException(
          'Set the reservation event date in On Coming Events before reserving seats.',
        );
      }
      throw err;
    }
  }

  private async resolveCanonicalEventDateOptional(
    ctx: Awaited<ReturnType<typeof this.resolveVenueContext>>,
  ): Promise<Date | null> {
    try {
      return await this.resolveCanonicalEventDateFromContext(ctx);
    } catch {
      return null;
    }
  }

  private async resolveCanonicalEventDateFromContext(
    ctx: Awaited<ReturnType<typeof this.resolveVenueContext>>,
  ): Promise<Date> {
    if (ctx.upcomingEventId) {
      const config = await this.prisma.upcomingVenueConfig.findUnique({
        where: { eventId: ctx.upcomingEventId },
        include: {
          reservationEventTemplate: {
            select: {
              name: true,
              timezone: true,
              scheduleMode: true,
              salesStartDate: true,
              salesEndDate: true,
              eventDate: true,
              eventStartTime: true,
              eventEndTime: true,
              recurringEffectiveFrom: true,
              recurringStartTime: true,
              recurringEndTime: true,
            },
          },
        },
      });
      if (config) {
        return assertCanonicalEventNightForCheckout(config);
      }
    }

    const legacyRow = await this.prisma.venueLayoutClientSettings.findFirst({
      orderBy: { updatedAt: 'desc' },
      select: {
        reservationOpensAt: true,
        reservationClosesAt: true,
        reservationEventDate: true,
      },
    });
    if (legacyRow) {
      const eventDate = canonicalEventNightFromVenueConfig(legacyRow);
      if (eventDate) {
        return eventDate;
      }
    }

    throw new BadRequestException('Reservations are not configured.');
  }

  private buildReservationEventLabel(
    eventDate: Date,
    timezone: string,
    reservationEventLabel: string | null,
  ): string {
    return (
      formatEventDateInZone(eventDate, timezone) ||
      reservationEventLabel?.trim() ||
      eventDate.toISOString().slice(0, 10)
    );
  }

  private async resolveSeatSelection(
    dto: CreateCheckoutSessionDto,
    floorLayoutId: string | null,
  ) {
    const layout =
      await this.floorLayout.getPublicFloorLayoutForClient(floorLayoutId);
    const layoutItem = layout.items.find((i) => i.id === dto.layoutItemId);
    if (!layoutItem) {
      throw new BadRequestException('Seat is not on the published floor plan.');
    }

    const kind = this.mapKind(dto.kind);
    let venueTableConfigId: string | null = null;
    let amount: Prisma.Decimal;
    let venueStandaloneChairId: string | null = null;
    let tableForLabel: {
      id: string;
      tableName: string;
      size: VenueTableSize;
      sortOrder: number;
    } | null = null;

    if (kind === VenueSeatKind.CATALOG_TABLE) {
      if (layoutItem.kind !== 'catalog_table') {
        throw new BadRequestException('Invalid table selection.');
      }
      if (!dto.venueTableConfigId) {
        throw new BadRequestException(
          'venueTableConfigId is required for tables.',
        );
      }
      if (layoutItem.venueTableConfigId !== dto.venueTableConfigId) {
        throw new BadRequestException('Table does not match floor plan item.');
      }

      const table = await this.prisma.venueTableConfig.findFirst({
        where: { id: dto.venueTableConfigId, isActive: true },
      });
      if (!table) {
        throw new NotFoundException('Table not found.');
      }
      venueTableConfigId = table.id;
      amount = table.bundlePrice;
      tableForLabel = {
        id: table.id,
        tableName: table.tableName,
        size: table.size,
        sortOrder: table.sortOrder,
      };
    } else {
      if (layoutItem.kind !== 'standalone_chair') {
        throw new BadRequestException('Invalid chair selection.');
      }
      const chairId = layoutItem.venueStandaloneChairId;
      const chair = await this.prisma.venueStandaloneChair.findFirst({
        where: { id: chairId, isActive: true },
      });
      if (!chair) {
        throw new NotFoundException('Standalone chair not found.');
      }
      venueStandaloneChairId = chair.id;
      amount = chair.unitPrice;
    }

    const productName = await resolveVenueSeatDisplayLabel(
      this.prisma,
      this.floorLayout,
      {
        kind,
        layoutItemId: dto.layoutItemId,
        venueTableConfigId,
        floorLayoutId,
        venueTableConfig: tableForLabel,
        venueStandaloneChairId,
      },
    );

    return {
      kind,
      venueTableConfigId,
      amount,
      productName,
      layoutItemId: dto.layoutItemId,
    };
  }

  private async createStripeCheckoutSession(args: {
    amount: Prisma.Decimal;
    productName: string;
    eventLabel: string;
    customerEmail: string;
    returnUrl: string;
    metadata: Record<string, string>;
  }) {
    const amountCents = Math.round(Number(args.amount) * 100);
    if (amountCents < 50) {
      throw new BadRequestException('Invalid seat price.');
    }

    const expiresAt = new Date(Date.now() + CHECKOUT_TTL_MINUTES * 60 * 1000);
    const sessionParams = {
      ...STRIPE_EMBEDDED_CHECKOUT_BASE,
      mode: 'payment',
      customer_email: args.customerEmail,
      ...stripeAutomaticTaxParams(),
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'usd',
            unit_amount: amountCents,
            product_data: stripeTaxProductData({
              name: args.productName,
              description: `Event: ${args.eventLabel}`,
            }),
          },
        },
      ],
      metadata: args.metadata,
      return_url: args.returnUrl,
      expires_at: Math.floor(expiresAt.getTime() / 1000),
    };

    const session = (await this.stripeService.client.checkout.sessions.create(
      sessionParams as Parameters<
        typeof this.stripeService.client.checkout.sessions.create
      >[0],
    )) as { id: string; client_secret: string | null };

    if (!session.client_secret) {
      throw new BadRequestException('Could not start checkout.');
    }

    return { session, expiresAt };
  }

  private async createPaidCashReservation(
    data: Prisma.VenueSeatReservationUncheckedCreateInput,
  ): Promise<VenueSeatReservationWithTableConfig> {
    try {
      return await this.prisma.venueSeatReservation.create({
        data,
        include: venueSeatReservationTableInclude,
      });
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        throw new ConflictException('This seat is already reserved.');
      }
      throw err;
    }
  }

  private async createPendingStripeReservation(args: {
    upcomingEventId: string;
    seat: {
      kind: VenueSeatKind;
      venueTableConfigId: string | null;
      amount: Prisma.Decimal;
      layoutItemId: string;
    };
    eventDate: Date;
    dto: CreateCheckoutSessionDto;
    sessionId: string;
    expiresAt: Date;
    paymentChannel: VenueReservationPaymentChannel;
    createdByAdminId: string | null;
    payTokenHash: string | null;
  }) {
    try {
      return await this.prisma.venueSeatReservation.create({
        data: {
          upcomingEventId: args.upcomingEventId,
          kind: args.seat.kind,
          venueTableConfigId: args.seat.venueTableConfigId,
          layoutItemId: args.seat.layoutItemId,
          eventDate: args.eventDate,
          amount: args.seat.amount,
          currency: 'usd',
          status: VenueSeatReservationStatus.PENDING_PAYMENT,
          paymentChannel: args.paymentChannel,
          stripeCheckoutSessionId: args.sessionId,
          payTokenHash: args.payTokenHash,
          createdByAdminId: args.createdByAdminId,
          customerName: args.dto.customerName.trim(),
          customerEmail: args.dto.customerEmail.trim().toLowerCase(),
          customerPhone: args.dto.customerPhone?.trim() || null,
          expiresAt: args.expiresAt,
        },
      });
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        throw new ConflictException('This seat is already reserved.');
      }
      throw err;
    }
  }

  private buildPublicVenueReturnUrl(eventSlug: string | null): string {
    const frontendUrl = this.stripeService.frontendUrl();
    const eventSlugQuery = eventSlug
      ? `&event_slug=${encodeURIComponent(eventSlug)}`
      : '';
    return `${frontendUrl}/on-coming-events/return?session_id={CHECKOUT_SESSION_ID}${eventSlugQuery}`;
  }

  private hashPayToken(rawToken: string): string {
    return createHash('sha256').update(rawToken).digest('hex');
  }

  private buildVenueSeatPayUrl(token: string): string {
    const frontendBase = this.stripeService.frontendUrl().replace(/\/$/, '');
    return `${frontendBase}/pay/venue-seat?token=${encodeURIComponent(token)}`;
  }

  private async findActiveReservationByPayToken(rawToken: string) {
    const payTokenHash = this.hashPayToken(rawToken);
    const reservation = await this.prisma.venueSeatReservation.findFirst({
      where: {
        payTokenHash,
        status: VenueSeatReservationStatus.PENDING_PAYMENT,
      },
      orderBy: { createdAt: 'desc' },
    });
    if (!reservation) {
      throw new NotFoundException('Payment link not found.');
    }
    if (reservation.expiresAt && reservation.expiresAt.getTime() < Date.now()) {
      if (reservation.stripeCheckoutSessionId) {
        await this.markExpiredFromSession(reservation.stripeCheckoutSessionId);
      }
      throw new BadRequestException('Payment link has expired.');
    }
    return reservation;
  }

  private async sendReservationPaymentRequestEmail(args: {
    reservation: {
      id: string;
      customerName: string;
      customerEmail: string;
      amount: Prisma.Decimal;
    };
    seatLabel: string;
    eventLabel: string;
    payUrl: string;
  }): Promise<void> {
    const toEmail = args.reservation.customerEmail.trim().toLowerCase();
    if (!toEmail) return;

    const appPublicName =
      this.config.get<string>('APP_PUBLIC_NAME')?.trim() ??
      'Shamell Entertainment';
    const branding = emailBrandingFromConfig(this.config);
    const frontendBaseUrl = branding.siteBaseUrl;
    const recipientName = args.reservation.customerName.trim() || 'Guest';
    const amountUsd = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(Number(args.reservation.amount));

    const subject = buildVenueReservationPaymentRequestSubject(appPublicName);
    const html = buildVenueReservationPaymentRequestHtml({
      recipientName,
      appPublicName,
      frontendBaseUrl,
      branding,
      reservationReference: args.reservation.id.slice(0, 8).toUpperCase(),
      eventLabel: args.eventLabel,
      seatLabel: args.seatLabel,
      amountUsd,
      payUrl: args.payUrl,
    });
    const text = buildVenueReservationPaymentRequestText({
      recipientName,
      appPublicName,
      frontendBaseUrl,
      reservationReference: args.reservation.id.slice(0, 8).toUpperCase(),
      eventLabel: args.eventLabel,
      seatLabel: args.seatLabel,
      amountUsd,
      payUrl: args.payUrl,
    });

    const { ok: sent, errorText } = await this.mail.sendTransactional({
      to: toEmail,
      toName: recipientName,
      subject,
      html,
      text,
    });
    if (!sent) {
      this.logger.warn(
        `reservation-payment-request-email-failed id=${args.reservation.id} reason=${errorText ?? 'provider_error'}`,
      );
    }
  }

  private mapKind(kind: CreateCheckoutSessionDto['kind']): VenueSeatKind {
    return kind === 'catalog_table'
      ? VenueSeatKind.CATALOG_TABLE
      : VenueSeatKind.STANDALONE_CHAIR;
  }

  private async resolveReservedSeatShortLabels(
    paid: Array<{
      kind: VenueSeatKind;
      layoutItemId: string;
      venueTableConfigId: string | null;
    }>,
    floorLayoutId: string | null,
  ): Promise<string[]> {
    const labels: string[] = [];
    for (const row of paid) {
      const full = await resolveVenueSeatDisplayLabel(
        this.prisma,
        this.floorLayout,
        {
          kind: row.kind,
          layoutItemId: row.layoutItemId,
          venueTableConfigId: row.venueTableConfigId,
          floorLayoutId,
        },
      );
      labels.push(toShortSeatDisplayLabel(full));
    }
    return [...new Set(labels)];
  }

  private async findPaidReservations(upcomingEventId: string) {
    return this.prisma.venueSeatReservation.findMany({
      where: {
        upcomingEventId,
        status: VenueSeatReservationStatus.PAID,
      },
      select: {
        kind: true,
        layoutItemId: true,
        venueTableConfigId: true,
        customerName: true,
      },
    });
  }

  private async findBlockingReservations(upcomingEventId: string) {
    const now = new Date();
    return this.prisma.venueSeatReservation.findMany({
      where: {
        upcomingEventId,
        OR: [
          { status: VenueSeatReservationStatus.PAID },
          {
            status: VenueSeatReservationStatus.PENDING_PAYMENT,
            OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
          },
        ],
      },
      select: {
        layoutItemId: true,
        venueTableConfigId: true,
      },
    });
  }

  private async assertSeatAvailable(args: {
    kind: VenueSeatKind;
    layoutItemId: string;
    venueTableConfigId: string | null;
    eventDate: Date;
    upcomingEventId: string;
  }) {
    const blocking = await this.findBlockingReservations(args.upcomingEventId);

    if (
      blocking.some((r) => r.layoutItemId === args.layoutItemId) ||
      (args.venueTableConfigId &&
        blocking.some((r) => r.venueTableConfigId === args.venueTableConfigId))
    ) {
      throw new ConflictException('This seat is already reserved.');
    }
  }

  private mapReservationPublic(row: {
    id: string;
    kind: VenueSeatKind;
    layoutItemId: string;
    venueTableConfigId: string | null;
    eventDate: Date;
    amount: Prisma.Decimal;
    currency: string;
    status: VenueSeatReservationStatus;
    customerName: string;
    customerEmail: string;
    customerPhone: string | null;
    paidAt: Date | null;
    venueTableConfig: { tableName: string; size: string } | null;
    seatDisplayLabel?: string;
  }) {
    return {
      id: row.id,
      kind:
        row.kind === VenueSeatKind.CATALOG_TABLE
          ? 'catalog_table'
          : 'standalone_chair',
      layoutItemId: row.layoutItemId,
      venueTableConfigId: row.venueTableConfigId,
      tableName: row.venueTableConfig
        ? formatVenueTableSizeLabel(row.venueTableConfig.size as VenueTableSize)
        : null,
      tableSize: row.venueTableConfig?.size ?? null,
      seatDisplayLabel: row.seatDisplayLabel ?? null,
      eventDate: row.eventDate.toISOString(),
      amount: Number(row.amount),
      currency: row.currency,
      status: row.status,
      customerName: maskCustomerName(row.customerName),
      customerEmail: maskEmail(row.customerEmail),
      paidAt: row.paidAt?.toISOString() ?? null,
    };
  }

  private async mapReservationPublicEnriched(row: {
    id: string;
    kind: VenueSeatKind;
    layoutItemId: string;
    venueTableConfigId: string | null;
    upcomingEventId: string | null;
    eventDate: Date;
    amount: Prisma.Decimal;
    currency: string;
    status: VenueSeatReservationStatus;
    customerName: string;
    customerEmail: string;
    customerPhone: string | null;
    paidAt: Date | null;
    venueTableConfig: { tableName: string; size: string } | null;
  }) {
    const seatDisplayLabel =
      await this.resolveSeatDisplayLabelForReservation(row);
    return this.mapReservationPublic({ ...row, seatDisplayLabel });
  }

  private async resolveSeatDisplayLabelForReservation(row: {
    kind: VenueSeatKind;
    layoutItemId: string;
    venueTableConfigId: string | null;
    upcomingEventId: string | null;
    venueTableConfig: { tableName: string; size: string } | null;
  }): Promise<string> {
    let floorLayoutId: string | null = null;
    if (row.upcomingEventId) {
      const config = await this.prisma.upcomingVenueConfig.findUnique({
        where: { eventId: row.upcomingEventId },
        select: { floorLayoutId: true },
      });
      floorLayoutId =
        config?.floorLayoutId ??
        (await this.floorLayout.getActiveFloorLayoutId());
    } else {
      floorLayoutId = await this.floorLayout.getActiveFloorLayoutId();
    }

    return resolveVenueSeatDisplayLabel(this.prisma, this.floorLayout, {
      kind: row.kind,
      layoutItemId: row.layoutItemId,
      venueTableConfigId: row.venueTableConfigId,
      floorLayoutId,
      venueTableConfig:
        row.venueTableConfig && row.venueTableConfigId
          ? {
              id: row.venueTableConfigId,
              tableName: row.venueTableConfig.tableName,
              size: row.venueTableConfig.size as VenueTableSize,
            }
          : null,
    });
  }

  private mapReservationAdmin(row: {
    id: string;
    kind: VenueSeatKind;
    layoutItemId: string;
    venueTableConfigId: string | null;
    eventDate: Date;
    amount: Prisma.Decimal;
    currency: string;
    status: VenueSeatReservationStatus;
    paymentChannel?: VenueReservationPaymentChannel;
    stripeCheckoutSessionId: string | null;
    stripePaymentIntentId: string | null;
    customerName: string;
    customerEmail: string;
    customerPhone: string | null;
    paidAt: Date | null;
    expiresAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    venueTableConfig?: { tableName: string; size: string } | null;
  }) {
    return {
      ...this.mapReservationPublic({
        ...row,
        venueTableConfig: row.venueTableConfig ?? null,
      }),
      paymentChannel: row.paymentChannel ?? 'STRIPE',
      stripeCheckoutSessionId: row.stripeCheckoutSessionId,
      stripePaymentIntentId: row.stripePaymentIntentId,
      expiresAt: row.expiresAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  private async sendReservationPaidConfirmationEmail(row: {
    id: string;
    upcomingEventId: string | null;
    kind: VenueSeatKind;
    layoutItemId: string;
    venueTableConfigId: string | null;
    eventDate: Date;
    paidAt: Date | null;
    customerName: string;
    customerEmail: string;
    venueTableConfig: { tableName: string; size: string } | null;
  }): Promise<boolean> {
    try {
      const toEmail = row.customerEmail.trim().toLowerCase();
      if (!toEmail) {
        this.logger.warn(
          `reservation-paid-email-skipped id=${row.id} reason=empty-recipient`,
        );
        return false;
      }

      const reservationKindLabel =
        row.kind === VenueSeatKind.CATALOG_TABLE ? 'Table' : 'Chair';
      const layoutItemLabel =
        await this.resolveSeatDisplayLabelForReservation(row);

      const appPublicName =
        this.config.get<string>('APP_PUBLIC_NAME')?.trim() ??
        'Shamell Entertainment';
      const branding = emailBrandingFromConfig(this.config);
      const frontendBaseUrl = branding.siteBaseUrl;
      let reservationTimezone = 'America/New_York';
      if (row.upcomingEventId) {
        const config = await this.prisma.upcomingVenueConfig.findUnique({
          where: { eventId: row.upcomingEventId },
          select: { reservationTimezone: true },
        });
        reservationTimezone =
          config?.reservationTimezone ??
          (await this.getLegacyReservationSettings()).reservationTimezone;
      } else {
        reservationTimezone = (await this.getLegacyReservationSettings())
          .reservationTimezone;
      }
      const recipientName = row.customerName.trim() || 'Guest';

      const canonicalEventDate = await resolveCanonicalReservationEventDate(
        this.prisma,
        {
          upcomingEventId: row.upcomingEventId,
          storedEventDate: row.eventDate,
        },
      );
      const eventDateForEmail = canonicalEventDate ?? row.eventDate;
      if (
        canonicalEventDate &&
        canonicalEventDate.getTime() !== row.eventDate.getTime()
      ) {
        await this.prisma.venueSeatReservation.update({
          where: { id: row.id },
          data: { eventDate: canonicalEventDate },
        });
      }

      const pdfDownloadUrl = this.buildConfirmationPdfDownloadUrl(row);

      const subject = buildVenueReservationConfirmationSubject(appPublicName);
      const html = buildVenueReservationConfirmationHtml({
        recipientName,
        appPublicName,
        frontendBaseUrl,
        branding,
        eventDate: eventDateForEmail,
        reservationTimezone,
        reservationKindLabel,
        layoutItemLabel,
        pdfDownloadUrl,
      });
      const text = buildVenueReservationConfirmationText({
        recipientName,
        appPublicName,
        frontendBaseUrl,
        eventDate: eventDateForEmail,
        reservationTimezone,
        reservationKindLabel,
        layoutItemLabel,
        pdfDownloadUrl,
      });

      const { ok: sent, errorText } = await this.mail.sendTransactional({
        to: toEmail,
        toName: recipientName,
        subject,
        html,
        text,
      });
      if (sent) {
        this.logger.log(
          `reservation-paid-email-sent id=${row.id} to=${toEmail}`,
        );
        return true;
      }
      this.logger.warn(
        `reservation-paid-email-failed id=${row.id} reason=${errorText ?? 'provider_error'}`,
      );
      return false;
    } catch (err) {
      this.logger.error(
        `reservation-paid-email-failed id=${row.id} reason=${err instanceof Error ? err.message : String(err)}`,
      );
      return false;
    }
  }

  private parseCheckoutSession(raw: unknown): StripeCheckoutSessionLite {
    if (!raw || typeof raw !== 'object') {
      throw new BadRequestException('Invalid checkout session payload.');
    }
    return raw;
  }
}
