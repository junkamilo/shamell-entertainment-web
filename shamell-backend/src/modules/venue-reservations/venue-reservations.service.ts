import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  Prisma,
  VenueSeatKind,
  VenueSeatReservationStatus,
} from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { FloorLayoutService } from '../floor-layout/floor-layout.service';
import { MailService } from '../mail/mail.service';
import { StripeService } from '../stripe/stripe.service';
import { formatVenueTableSizeLabel } from '../venue-tables/venue-table-names.util';
import {
  evaluateSalesWindow,
  eventDateForReservations,
  resolveReservationWindow,
} from '../venue-layout-settings/reservation-sales-window.util';
import { CreateCheckoutSessionDto } from './dto/create-checkout-session.dto';
import {
  buildVenueReservationConfirmationHtml,
  buildVenueReservationConfirmationSubject,
  buildVenueReservationConfirmationText,
} from './venue-reservation-confirmation.mail';

const CHECKOUT_TTL_MINUTES = 30;
type StripeWebhookEventLite = {
  id: string;
  type: string;
  livemode: boolean;
  data: { object: unknown };
};

type StripeCheckoutSessionLite = {
  id?: string;
  payment_intent?: string | { id?: string } | null;
  payment_status?: string | null;
  amount_total?: number | null;
  currency?: string | null;
};

@Injectable()
export class VenueReservationsService {
  private readonly logger = new Logger(VenueReservationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly mail: MailService,
    private readonly stripeService: StripeService,
    private readonly floorLayout: FloorLayoutService,
  ) {}

  async getAvailability() {
    const settings = await this.getReservationSettings();
    const window = settings.window;
    const eventDate = eventDateForReservations(window);

    if (!settings.clientEnabled || !eventDate) {
      return {
        eventDate: null,
        reservationOpensAt: window.opensAt?.toISOString() ?? null,
        reservationClosesAt: window.closesAt?.toISOString() ?? null,
        reservationsOpen: false,
        salesClosedReason: 'not_configured' as const,
        reservedLayoutItemIds: [] as string[],
        reservedVenueTableConfigIds: [] as string[],
      };
    }

    const blocking = await this.findBlockingReservations(eventDate);
    const soldOut = await this.isInventorySoldOut(eventDate);
    const windowStatus = evaluateSalesWindow(window);
    const reservationsOpen = windowStatus.open && !soldOut;
    const salesClosedReason = soldOut
      ? ('sold_out' as const)
      : windowStatus.open
        ? null
        : windowStatus.reason;

    return {
      eventDate: eventDate.toISOString(),
      reservationOpensAt: window.opensAt?.toISOString() ?? null,
      reservationClosesAt: window.closesAt?.toISOString() ?? null,
      reservationsOpen,
      salesClosedReason,
      reservedLayoutItemIds: [...new Set(blocking.map((r) => r.layoutItemId))],
      reservedVenueTableConfigIds: [
        ...new Set(
          blocking
            .map((r) => r.venueTableConfigId)
            .filter((id): id is string => Boolean(id)),
        ),
      ],
    };
  }

  async createCheckoutSession(dto: CreateCheckoutSessionDto) {
    const settings = await this.getReservationSettings();
    if (!settings.clientEnabled) {
      throw new BadRequestException('On Coming Events is not published.');
    }

    const window = settings.window;
    const eventDate = eventDateForReservations(window);
    if (!eventDate) {
      throw new BadRequestException('Reservations are not configured.');
    }

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

    if (await this.isInventorySoldOut(eventDate)) {
      throw new BadRequestException('All seats are sold.');
    }
    const layout = await this.floorLayout.getPublicFloorLayoutForClient();
    const layoutItem = layout.items.find((i) => i.id === dto.layoutItemId);
    if (!layoutItem) {
      throw new BadRequestException('Seat is not on the published floor plan.');
    }

    const kind = this.mapKind(dto.kind);
    let venueTableConfigId: string | null = null;
    let amount: Prisma.Decimal;
    let productName: string;

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
      productName = `Table ${formatVenueTableSizeLabel(table.size)}`;
    } else {
      if (layoutItem.kind !== 'standalone_chair') {
        throw new BadRequestException('Invalid chair selection.');
      }
      const chairConfig =
        await this.prisma.venueStandaloneChairConfig.findFirst({
          where: { isActive: true },
          orderBy: { updatedAt: 'desc' },
        });
      if (!chairConfig) {
        throw new BadRequestException('Standalone chairs are not configured.');
      }
      amount = chairConfig.unitPrice;
      productName = 'Standalone chair';
    }

    await this.assertSeatAvailable({
      kind,
      layoutItemId: dto.layoutItemId,
      venueTableConfigId,
      eventDate,
    });

    const eventLabel =
      settings.reservationEventLabel?.trim() ||
      eventDate.toISOString().slice(0, 10);
    const amountCents = Math.round(Number(amount) * 100);
    if (amountCents < 50) {
      throw new BadRequestException('Invalid seat price.');
    }

    const expiresAt = new Date(Date.now() + CHECKOUT_TTL_MINUTES * 60 * 1000);
    const frontendUrl = this.stripeService.frontendUrl();
    const returnUrl = `${frontendUrl}/on-coming-events/return?session_id={CHECKOUT_SESSION_ID}`;

    const sessionParams = {
      ui_mode: 'embedded_page',
      mode: 'payment',
      customer_email: dto.customerEmail,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'usd',
            unit_amount: amountCents,
            product_data: {
              name: productName,
              description: `Event: ${eventLabel}`,
            },
          },
        },
      ],
      metadata: {},
      return_url: returnUrl,
      expires_at: Math.floor(expiresAt.getTime() / 1000),
    };

    const session = await this.stripeService.client.checkout.sessions.create(
      sessionParams as Parameters<
        typeof this.stripeService.client.checkout.sessions.create
      >[0],
    );

    if (!session.client_secret) {
      throw new BadRequestException('Could not start checkout.');
    }

    const reservation = await this.prisma.venueSeatReservation.create({
      data: {
        kind,
        venueTableConfigId,
        layoutItemId: dto.layoutItemId,
        eventDate,
        amount,
        currency: 'usd',
        status: VenueSeatReservationStatus.PENDING_PAYMENT,
        stripeCheckoutSessionId: session.id,
        customerName: dto.customerName.trim(),
        customerEmail: dto.customerEmail.trim().toLowerCase(),
        customerPhone: dto.customerPhone?.trim() || null,
        expiresAt,
      },
    });

    await this.stripeService.client.checkout.sessions.update(session.id, {
      metadata: { reservationId: reservation.id },
    });

    this.logger.log(
      `checkout-session reservationId=${reservation.id} session=${session.id}`,
    );

    return {
      clientSecret: session.client_secret,
      reservationId: reservation.id,
    };
  }

  async getSessionStatus(sessionId: string) {
    const reservation = await this.prisma.venueSeatReservation.findUnique({
      where: { stripeCheckoutSessionId: sessionId },
      include: {
        venueTableConfig: { select: { tableName: true, size: true } },
      },
    });

    let stripeStatus: 'complete' | 'open' | 'expired' = 'open';
    try {
      const session =
        await this.stripeService.client.checkout.sessions.retrieve(sessionId);
      if (session.status === 'complete') stripeStatus = 'complete';
      else if (session.status === 'expired') stripeStatus = 'expired';
    } catch {
      throw new NotFoundException('Checkout session not found.');
    }

    if (!reservation) {
      throw new NotFoundException('Reservation not found.');
    }

    return {
      stripeStatus,
      reservation: this.mapReservationPublic(reservation),
    };
  }

  async handleWebhookEvent(
    rawBody: Buffer,
    signature: string | string[] | undefined,
  ) {
    if (!signature || Array.isArray(signature)) {
      throw new BadRequestException('Missing stripe-signature header.');
    }

    let event: StripeWebhookEventLite;
    try {
      event = this.stripeService.client.webhooks.constructEvent(
        rawBody,
        signature,
        this.stripeService.webhookSecret,
      );
    } catch (err) {
      this.logger.warn(
        `stripe-webhook-invalid-signature reason=${err instanceof Error ? err.message : String(err)}`,
      );
      throw new BadRequestException('Invalid stripe-signature header.');
    }

    const alreadyProcessed = await this.isStripeEventProcessed(event.id);
    if (alreadyProcessed) {
      this.logger.log(
        `stripe-webhook-duplicate eventId=${event.id} type=${event.type}`,
      );
      return { received: true, deduplicated: true };
    }

    await this.trackStripeWebhookAttempt(event);

    try {
      if (event.type === 'checkout.session.completed') {
        const session = this.parseCheckoutSession(event.data.object);
        await this.markPaidFromSession(session, event.id);
      } else if (event.type === 'checkout.session.expired') {
        const session = this.parseCheckoutSession(event.data.object);
        const sessionId = session.id?.trim();
        if (!sessionId) {
          throw new BadRequestException(
            'Invalid checkout.session.expired payload.',
          );
        }
        await this.markExpiredFromSession(sessionId);
      }

      await this.markStripeEventProcessed(event.id);
      return { received: true };
    } catch (err) {
      await this.markStripeEventFailed(event.id, err);
      throw err;
    }
  }

  async listAdminReservations(query: {
    page?: number;
    perPage?: number;
    status?: VenueSeatReservationStatus;
    eventDate?: string;
    layoutItemId?: string;
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

    return {
      message: 'Reservation cancelled.',
      reservation: this.mapReservationAdmin(saved),
    };
  }

  private async markPaidFromSession(
    session: StripeCheckoutSessionLite,
    stripeEventId: string,
  ) {
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
      return;
    }
    if (reservation.status === VenueSeatReservationStatus.PAID) {
      this.logger.log(
        `webhook-paid-already-processed reservationId=${reservation.id} session=${sessionId} eventId=${stripeEventId}`,
      );
      return;
    }

    if (session.payment_status !== 'paid') {
      throw new BadRequestException(
        `checkout.session.completed is not paid for session=${sessionId}.`,
      );
    }

    const sessionAmountTotal = session.amount_total;
    const expectedAmountCents = Math.round(Number(reservation.amount) * 100);
    if (typeof sessionAmountTotal !== 'number') {
      throw new BadRequestException(
        `Missing amount_total in checkout.session.completed for session=${sessionId}.`,
      );
    }
    if (sessionAmountTotal !== expectedAmountCents) {
      throw new BadRequestException(
        `Amount mismatch for session=${sessionId}. expected=${expectedAmountCents} got=${sessionAmountTotal}.`,
      );
    }

    const sessionCurrency = session.currency?.toLowerCase();
    const expectedCurrency = reservation.currency.toLowerCase();
    if (!sessionCurrency || sessionCurrency !== expectedCurrency) {
      throw new BadRequestException(
        `Currency mismatch for session=${sessionId}. expected=${expectedCurrency} got=${sessionCurrency ?? 'null'}.`,
      );
    }

    const paymentIntent = session.payment_intent;
    const paymentIntentId =
      typeof paymentIntent === 'string'
        ? paymentIntent
        : (paymentIntent?.id ?? null);

    const saved = await this.prisma.venueSeatReservation.update({
      where: { id: reservation.id },
      data: {
        status: VenueSeatReservationStatus.PAID,
        paidAt: new Date(),
        stripePaymentIntentId: paymentIntentId,
        expiresAt: null,
      },
      include: {
        venueTableConfig: { select: { tableName: true, size: true } },
      },
    });

    this.logger.log(
      `reservation-paid reservationId=${reservation.id} session=${sessionId} eventId=${stripeEventId} paymentIntent=${paymentIntentId ?? 'null'}`,
    );

    await this.sendReservationPaidConfirmationEmail(saved);
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
  }

  private async getReservationSettings() {
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

  private async isInventorySoldOut(eventDate: Date): Promise<boolean> {
    const layout = await this.floorLayout.getPublicFloorLayoutForClient();
    const reservableIds = layout.items
      .filter(
        (item) =>
          item.kind === 'catalog_table' || item.kind === 'standalone_chair',
      )
      .map((item) => item.id);
    if (reservableIds.length === 0) {
      return true;
    }

    const blocking = await this.findBlockingReservations(eventDate);
    const reserved = new Set(blocking.map((r) => r.layoutItemId));
    return reservableIds.every((id) => reserved.has(id));
  }

  private mapKind(kind: CreateCheckoutSessionDto['kind']): VenueSeatKind {
    return kind === 'catalog_table'
      ? VenueSeatKind.CATALOG_TABLE
      : VenueSeatKind.STANDALONE_CHAIR;
  }

  private async findBlockingReservations(eventDate: Date) {
    const now = new Date();
    return this.prisma.venueSeatReservation.findMany({
      where: {
        eventDate,
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
  }) {
    const blocking = await this.findBlockingReservations(args.eventDate);

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
        ? formatVenueTableSizeLabel(row.venueTableConfig.size)
        : null,
      tableSize: row.venueTableConfig?.size ?? null,
      eventDate: row.eventDate.toISOString(),
      amount: Number(row.amount),
      currency: row.currency,
      status: row.status,
      customerName: row.customerName,
      customerEmail: row.customerEmail,
      customerPhone: row.customerPhone,
      paidAt: row.paidAt?.toISOString() ?? null,
    };
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
    stripeCheckoutSessionId: string;
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
      stripeCheckoutSessionId: row.stripeCheckoutSessionId,
      stripePaymentIntentId: row.stripePaymentIntentId,
      expiresAt: row.expiresAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  private async sendReservationPaidConfirmationEmail(row: {
    id: string;
    kind: VenueSeatKind;
    layoutItemId: string;
    eventDate: Date;
    customerName: string;
    customerEmail: string;
    venueTableConfig: { tableName: string; size: string } | null;
  }): Promise<void> {
    try {
      const toEmail = row.customerEmail.trim().toLowerCase();
      if (!toEmail) {
        this.logger.warn(
          `reservation-paid-email-skipped id=${row.id} reason=empty-recipient`,
        );
        return;
      }

      const reservationKindLabel =
        row.kind === VenueSeatKind.CATALOG_TABLE ? 'Table' : 'Chair';
      const layoutItemLabel = await this.resolveLayoutItemLabel({
        kind: row.kind,
        layoutItemId: row.layoutItemId,
        venueTableConfig: row.venueTableConfig,
      });

      const appPublicName =
        this.config.get<string>('APP_PUBLIC_NAME')?.trim() ??
        'Shamell Entertainment';
      const frontendRaw = this.config.get<string>('FRONTEND_URL')?.trim();
      const frontendBaseUrl = frontendRaw?.split(',')[0]?.trim();
      const reservationTimezone = (await this.getReservationSettings())
        .reservationTimezone;
      const recipientName = row.customerName.trim() || 'Guest';

      const subject = buildVenueReservationConfirmationSubject(appPublicName);
      const html = buildVenueReservationConfirmationHtml({
        recipientName,
        appPublicName,
        frontendBaseUrl,
        eventDate: row.eventDate,
        reservationTimezone,
        reservationKindLabel,
        layoutItemLabel,
      });
      const text = buildVenueReservationConfirmationText({
        recipientName,
        appPublicName,
        frontendBaseUrl,
        eventDate: row.eventDate,
        reservationTimezone,
        reservationKindLabel,
        layoutItemLabel,
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
        return;
      }
      this.logger.warn(
        `reservation-paid-email-failed id=${row.id} reason=${errorText ?? 'provider_error'}`,
      );
    } catch (err) {
      this.logger.error(
        `reservation-paid-email-failed id=${row.id} reason=${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  private async resolveLayoutItemLabel(args: {
    kind: VenueSeatKind;
    layoutItemId: string;
    venueTableConfig: { tableName: string; size: string } | null;
  }): Promise<string> {
    if (args.kind === VenueSeatKind.CATALOG_TABLE) {
      const tableName = args.venueTableConfig?.tableName?.trim();
      if (tableName) return tableName;
      const tableSize = args.venueTableConfig?.size?.trim();
      if (tableSize) return `Table ${formatVenueTableSizeLabel(tableSize)}`;
      return 'Reserved table';
    }

    try {
      const layout = await this.floorLayout.getPublicFloorLayoutForClient();
      const layoutItem = layout.items.find(
        (item) => item.id === args.layoutItemId,
      );
      if (layoutItem?.kind === 'standalone_chair') {
        const chairName = layoutItem.chairName?.trim();
        if (chairName) return chairName;
      }
    } catch {
      // Falls back gracefully when floor layout is unavailable.
    }
    return 'Reserved chair';
  }

  private async isStripeEventProcessed(eventId: string): Promise<boolean> {
    const rows = await this.prisma.$queryRaw<
      Array<{ processedAt: Date | null }>
    >(
      Prisma.sql`SELECT "processedAt" FROM "stripe_webhook_events" WHERE "eventId" = ${eventId} LIMIT 1`,
    );
    return Boolean(rows[0]?.processedAt);
  }

  private async trackStripeWebhookAttempt(
    event: StripeWebhookEventLite,
  ): Promise<void> {
    try {
      await this.prisma.$executeRaw(
        Prisma.sql`
          INSERT INTO "stripe_webhook_events" ("id", "eventId", "eventType", "livemode", "attempts", "createdAt", "updatedAt")
          VALUES (${event.id}, ${event.id}, ${event.type}, ${event.livemode}, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          ON CONFLICT ("eventId")
          DO UPDATE SET
            "attempts" = "stripe_webhook_events"."attempts" + 1,
            "eventType" = EXCLUDED."eventType",
            "livemode" = EXCLUDED."livemode",
            "lastError" = NULL,
            "updatedAt" = CURRENT_TIMESTAMP
        `,
      );
    } catch (err) {
      this.logger.warn(
        `stripe-webhook-track-attempt-failed eventId=${event.id} reason=${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  private async markStripeEventProcessed(eventId: string): Promise<void> {
    await this.prisma.$executeRaw(
      Prisma.sql`
        UPDATE "stripe_webhook_events"
        SET "processedAt" = CURRENT_TIMESTAMP,
            "lastError" = NULL,
            "updatedAt" = CURRENT_TIMESTAMP
        WHERE "eventId" = ${eventId}
      `,
    );
  }

  private async markStripeEventFailed(
    eventId: string,
    error: unknown,
  ): Promise<void> {
    const reason = error instanceof Error ? error.message : String(error);
    try {
      await this.prisma.$executeRaw(
        Prisma.sql`
          UPDATE "stripe_webhook_events"
          SET "lastError" = ${reason.slice(0, 1000)},
              "updatedAt" = CURRENT_TIMESTAMP
          WHERE "eventId" = ${eventId}
        `,
      );
    } catch {
      // Keep webhook error flow intact even when audit logging fails.
    }
  }

  private parseCheckoutSession(raw: unknown): StripeCheckoutSessionLite {
    if (!raw || typeof raw !== 'object') {
      throw new BadRequestException('Invalid checkout session payload.');
    }
    return raw;
  }
}
