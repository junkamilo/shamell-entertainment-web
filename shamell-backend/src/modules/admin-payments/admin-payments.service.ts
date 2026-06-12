import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  BookingPayment,
  BookingPaymentStatus,
  Prisma,
  UpcomingClassEnrollment,
  UpcomingClassEnrollmentStatus,
  UpcomingFixedEventEnrollment,
  VenueSeatKind,
  VenueSeatReservation,
  VenueSeatReservationStatus,
} from '@prisma/client';
import { formatPaymentMethodLabel } from '../stripe/stripe-payment-details.util';
import { PrismaService } from '../../prisma/prisma.service';
import { FloorLayoutService } from '../floor-layout/floor-layout.service';
import { resolveVenueSeatDisplayLabel } from '../venue-reservations/venue-seat-display-label.util';
import { fixedEventStartsAtIso } from '../upcoming-events/upcoming-fixed-ticket.util';
import type {
  AdminPaymentDetailFlow,
  AdminStripePaymentDetail,
  BookingPurchaseDetails,
  ClassPurchaseDetails,
  FixedPurchaseDetails,
  VenuePurchaseDetails,
} from './admin-payments-detail.types';
import type { AdminStripePaymentRow } from './admin-payments.types';
import type {
  AdminPaymentFlow,
  AdminPaymentStatus,
  AdminPaymentsQueryDto,
} from './dto/admin-payments-query.dto';

const TERMINAL_STATUSES: AdminPaymentStatus[] = [
  'PAID',
  'EXPIRED',
  'CANCELLED',
];

const bookingPaymentInclude = {
  booking: {
    include: {
      event: { include: { eventType: { select: { name: true } } } },
      eventType: { select: { name: true } },
      occasionType: { select: { name: true } },
      service: { include: { serviceType: { select: { name: true } } } },
      user: { select: { fullName: true, email: true } },
    },
  },
} satisfies Prisma.BookingPaymentInclude;

const venueInclude = {
  upcomingEvent: { include: { eventType: { select: { name: true } } } },
  venueTableConfig: { select: { tableName: true, size: true } },
} satisfies Prisma.VenueSeatReservationInclude;

const classInclude = {
  session: {
    include: {
      event: { include: { eventType: { select: { name: true, id: true } } } },
    },
  },
} satisfies Prisma.UpcomingClassEnrollmentInclude;

const fixedInclude = {
  event: {
    include: {
      eventType: { select: { name: true, id: true } },
      venueConfig: {
        select: { reservationEventDate: true, reservationTimezone: true },
      },
    },
  },
} satisfies Prisma.UpcomingFixedEventEnrollmentInclude;

type BookingPaymentRow = BookingPayment &
  Prisma.BookingPaymentGetPayload<{ include: typeof bookingPaymentInclude }>;

type VenueRow = VenueSeatReservation &
  Prisma.VenueSeatReservationGetPayload<{ include: typeof venueInclude }>;

type ClassRow = UpcomingClassEnrollment &
  Prisma.UpcomingClassEnrollmentGetPayload<{ include: typeof classInclude }>;

type FixedRow = UpcomingFixedEventEnrollment &
  Prisma.UpcomingFixedEventEnrollmentGetPayload<{
    include: typeof fixedInclude;
  }>;

function mapVenueStatus(
  status: VenueSeatReservationStatus,
): AdminPaymentStatus {
  if (status === VenueSeatReservationStatus.PENDING_PAYMENT) return 'PENDING';
  if (status === VenueSeatReservationStatus.PAID) return 'PAID';
  if (status === VenueSeatReservationStatus.EXPIRED) return 'EXPIRED';
  return 'CANCELLED';
}

function mapEnrollmentStatus(
  status: UpcomingClassEnrollmentStatus,
): AdminPaymentStatus {
  if (status === UpcomingClassEnrollmentStatus.PENDING_PAYMENT) {
    return 'PENDING';
  }
  if (status === UpcomingClassEnrollmentStatus.PAID) return 'PAID';
  if (status === UpcomingClassEnrollmentStatus.EXPIRED) return 'EXPIRED';
  return 'CANCELLED';
}

function mapBookingPaymentStatus(
  status: BookingPaymentStatus,
): AdminPaymentStatus {
  return status;
}

function iso(d: Date | null | undefined): string | null {
  return d ? d.toISOString() : null;
}

function paymentLabelFromRow(row: {
  paymentMethodType: string | null;
  paymentMethodBrand: string | null;
  paymentMethodLast4: string | null;
}): string | null {
  return formatPaymentMethodLabel({
    paymentMethodType: row.paymentMethodType,
    paymentMethodBrand: row.paymentMethodBrand,
    paymentMethodLast4: row.paymentMethodLast4,
  });
}

@Injectable()
export class AdminPaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly floorLayout: FloorLayoutService,
  ) {}

  async listPayments(query: AdminPaymentsQueryDto) {
    const page = Math.max(1, Number(query.page ?? 1));
    const limit = Math.min(100, Math.max(1, Number(query.limit ?? 20)));
    const q = query.q?.trim().toLowerCase();
    const from = query.from ? new Date(query.from) : null;
    const to = query.to ? new Date(query.to) : null;
    if (from && Number.isNaN(from.getTime())) {
      throw new BadRequestException('Invalid from date.');
    }
    if (to && Number.isNaN(to.getTime())) {
      throw new BadRequestException('Invalid to date.');
    }

    const flows: AdminPaymentFlow[] = query.flow
      ? [query.flow]
      : ['BOOKING_QUOTE', 'VENUE_SEAT', 'CLASS_SESSION', 'FIXED_TICKET'];

    const rows: AdminStripePaymentRow[] = [];

    if (flows.includes('BOOKING_QUOTE')) {
      const bookingRows = await this.prisma.bookingPayment.findMany({
        where: this.bookingPaymentWhere(query.status, q, from, to),
        include: bookingPaymentInclude,
        orderBy: { updatedAt: 'desc' },
      });
      for (const p of bookingRows) {
        rows.push(this.mapBookingPayment(p));
      }
    }

    if (flows.includes('VENUE_SEAT')) {
      const venueRows = await this.prisma.venueSeatReservation.findMany({
        where: this.venueWhere(query.status, q, from, to),
        include: venueInclude,
        orderBy: { updatedAt: 'desc' },
      });
      for (const r of venueRows) {
        rows.push(await this.mapVenueReservation(r));
      }
    }

    if (flows.includes('CLASS_SESSION')) {
      const classRows = await this.prisma.upcomingClassEnrollment.findMany({
        where: this.classWhere(query.status, q, from, to),
        include: classInclude,
        orderBy: { updatedAt: 'desc' },
      });
      for (const e of classRows) {
        rows.push(this.mapClassEnrollment(e));
      }
    }

    if (flows.includes('FIXED_TICKET')) {
      const fixedRows = await this.prisma.upcomingFixedEventEnrollment.findMany(
        {
          where: this.fixedWhere(query.status, q, from, to),
          include: fixedInclude,
          orderBy: { updatedAt: 'desc' },
        },
      );
      for (const e of fixedRows) {
        rows.push(this.mapFixedEnrollment(e));
      }
    }

    rows.sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );

    const totalItems = rows.length;
    const totalPages = totalItems === 0 ? 1 : Math.ceil(totalItems / limit);
    const start = (page - 1) * limit;
    const items = rows.slice(start, start + limit);

    return {
      items,
      meta: {
        page,
        limit,
        totalItems,
        totalPages,
        hasPrev: page > 1,
        hasNext: page < totalPages,
      },
    };
  }

  async getPaymentDetail(
    flow: AdminPaymentDetailFlow,
    id: string,
  ): Promise<AdminStripePaymentDetail> {
    switch (flow) {
      case 'BOOKING_QUOTE': {
        const payment = await this.prisma.bookingPayment.findUnique({
          where: { id },
          include: bookingPaymentInclude,
        });
        if (!payment) {
          throw new NotFoundException('Payment not found.');
        }
        return this.mapBookingPaymentDetail(payment);
      }
      case 'VENUE_SEAT': {
        const reservation = await this.prisma.venueSeatReservation.findUnique({
          where: { id },
          include: venueInclude,
        });
        if (!reservation) {
          throw new NotFoundException('Payment not found.');
        }
        return await this.mapVenueReservationDetail(reservation);
      }
      case 'CLASS_SESSION': {
        const enrollment = await this.prisma.upcomingClassEnrollment.findUnique(
          {
            where: { id },
            include: classInclude,
          },
        );
        if (!enrollment) {
          throw new NotFoundException('Payment not found.');
        }
        return this.mapClassEnrollmentDetail(enrollment);
      }
      case 'FIXED_TICKET': {
        const enrollment =
          await this.prisma.upcomingFixedEventEnrollment.findUnique({
            where: { id },
            include: fixedInclude,
          });
        if (!enrollment) {
          throw new NotFoundException('Payment not found.');
        }
        return this.mapFixedEnrollmentDetail(enrollment);
      }
      default:
        throw new BadRequestException('Invalid payment flow.');
    }
  }

  async countBadgeSince(sinceMs?: number): Promise<{ count: number }> {
    const since =
      sinceMs != null && Number.isFinite(sinceMs) && sinceMs > 0
        ? new Date(sinceMs)
        : null;
    if (!since) return { count: 0 };

    const terminalBooking = [
      BookingPaymentStatus.PAID,
      BookingPaymentStatus.EXPIRED,
      BookingPaymentStatus.CANCELLED,
    ];
    const terminalVenue = [
      VenueSeatReservationStatus.PAID,
      VenueSeatReservationStatus.EXPIRED,
      VenueSeatReservationStatus.CANCELLED,
    ];
    const terminalEnrollment = [
      UpcomingClassEnrollmentStatus.PAID,
      UpcomingClassEnrollmentStatus.EXPIRED,
      UpcomingClassEnrollmentStatus.CANCELLED,
    ];

    const [booking, venue, classEnroll, fixedEnroll] = await Promise.all([
      this.prisma.bookingPayment.count({
        where: {
          status: { in: terminalBooking },
          updatedAt: { gt: since },
        },
      }),
      this.prisma.venueSeatReservation.count({
        where: {
          status: { in: terminalVenue },
          updatedAt: { gt: since },
        },
      }),
      this.prisma.upcomingClassEnrollment.count({
        where: {
          status: { in: terminalEnrollment },
          updatedAt: { gt: since },
        },
      }),
      this.prisma.upcomingFixedEventEnrollment.count({
        where: {
          status: { in: terminalEnrollment },
          updatedAt: { gt: since },
        },
      }),
    ]);

    return { count: booking + venue + classEnroll + fixedEnroll };
  }

  private bookingPaymentWhere(
    status: AdminPaymentStatus | undefined,
    q: string | undefined,
    from: Date | null,
    to: Date | null,
  ): Prisma.BookingPaymentWhereInput {
    const where: Prisma.BookingPaymentWhereInput = {};
    if (status) where.status = status;
    if (from || to) {
      where.updatedAt = {};
      if (from) where.updatedAt.gte = from;
      if (to) where.updatedAt.lte = to;
    }
    if (q) {
      where.OR = [
        { booking: { guestFullName: { contains: q, mode: 'insensitive' } } },
        { booking: { guestEmail: { contains: q, mode: 'insensitive' } } },
        {
          booking: {
            user: { is: { fullName: { contains: q, mode: 'insensitive' } } },
          },
        },
        {
          booking: {
            user: { is: { email: { contains: q, mode: 'insensitive' } } },
          },
        },
      ];
    }
    return where;
  }

  private venueWhere(
    status: AdminPaymentStatus | undefined,
    q: string | undefined,
    from: Date | null,
    to: Date | null,
  ): Prisma.VenueSeatReservationWhereInput {
    const where: Prisma.VenueSeatReservationWhereInput = {};
    if (status) {
      where.status =
        status === 'PENDING'
          ? VenueSeatReservationStatus.PENDING_PAYMENT
          : status;
    }
    if (from || to) {
      where.updatedAt = {};
      if (from) where.updatedAt.gte = from;
      if (to) where.updatedAt.lte = to;
    }
    if (q) {
      where.OR = [
        { customerName: { contains: q, mode: 'insensitive' } },
        { customerEmail: { contains: q, mode: 'insensitive' } },
      ];
    }
    return where;
  }

  private classWhere(
    status: AdminPaymentStatus | undefined,
    q: string | undefined,
    from: Date | null,
    to: Date | null,
  ): Prisma.UpcomingClassEnrollmentWhereInput {
    const where: Prisma.UpcomingClassEnrollmentWhereInput = {};
    if (status) {
      where.status =
        status === 'PENDING'
          ? UpcomingClassEnrollmentStatus.PENDING_PAYMENT
          : status;
    }
    if (from || to) {
      where.updatedAt = {};
      if (from) where.updatedAt.gte = from;
      if (to) where.updatedAt.lte = to;
    }
    if (q) {
      where.OR = [
        { customerName: { contains: q, mode: 'insensitive' } },
        { customerEmail: { contains: q, mode: 'insensitive' } },
      ];
    }
    return where;
  }

  private fixedWhere(
    status: AdminPaymentStatus | undefined,
    q: string | undefined,
    from: Date | null,
    to: Date | null,
  ): Prisma.UpcomingFixedEventEnrollmentWhereInput {
    const where: Prisma.UpcomingFixedEventEnrollmentWhereInput = {};
    if (status) {
      where.status =
        status === 'PENDING'
          ? UpcomingClassEnrollmentStatus.PENDING_PAYMENT
          : status;
    }
    if (from || to) {
      where.updatedAt = {};
      if (from) where.updatedAt.gte = from;
      if (to) where.updatedAt.lte = to;
    }
    if (q) {
      where.OR = [
        { customerName: { contains: q, mode: 'insensitive' } },
        { customerEmail: { contains: q, mode: 'insensitive' } },
      ];
    }
    return where;
  }

  private mapBookingPayment(p: BookingPaymentRow): AdminStripePaymentRow {
    const b = p.booking;
    const customerName =
      b.user?.fullName?.trim() || b.guestFullName?.trim() || 'Client';
    const customerEmail =
      b.user?.email?.trim().toLowerCase() ||
      b.guestEmail?.trim().toLowerCase() ||
      '';
    const contextLabel =
      b.eventType?.name ||
      b.event?.eventType?.name ||
      b.service?.serviceType?.name ||
      `Booking ${b.id.slice(0, 8).toUpperCase()}`;

    return {
      id: p.id,
      flow: 'BOOKING_QUOTE',
      status: mapBookingPaymentStatus(p.status),
      stage: p.stage,
      amount: Number(p.expectedAmount),
      currency: p.currency,
      customerName,
      customerEmail,
      contextLabel,
      bookingId: b.id,
      eventSlug: b.event?.slug ?? null,
      eventId: b.eventId,
      reservationId: null,
      stripeCheckoutSessionId: p.stripeCheckoutSessionId,
      paymentMethodLabel: null,
      createdAt: p.createdAt.toISOString(),
      paidAt: iso(p.paidAt),
      expiresAt: iso(p.expiresAt),
      updatedAt: p.updatedAt.toISOString(),
    };
  }

  private async resolveVenueSeatLabelForRow(r: VenueRow): Promise<string> {
    let floorLayoutId: string | null = null;
    if (r.upcomingEventId) {
      const config = await this.prisma.upcomingVenueConfig.findUnique({
        where: { eventId: r.upcomingEventId },
        select: { floorLayoutId: true },
      });
      floorLayoutId =
        config?.floorLayoutId ??
        (await this.floorLayout.getActiveFloorLayoutId());
    } else {
      floorLayoutId = await this.floorLayout.getActiveFloorLayoutId();
    }

    return resolveVenueSeatDisplayLabel(this.prisma, this.floorLayout, {
      kind: r.kind,
      layoutItemId: r.layoutItemId,
      venueTableConfigId: r.venueTableConfigId,
      floorLayoutId,
      venueTableConfig:
        r.venueTableConfig && r.venueTableConfigId
          ? {
              id: r.venueTableConfigId,
              tableName: r.venueTableConfig.tableName,
              size: r.venueTableConfig.size,
            }
          : null,
    });
  }

  private buildVenuePaymentRow(
    r: VenueRow,
    seatLabel: string,
  ): AdminStripePaymentRow {
    const kindLabel =
      r.kind === VenueSeatKind.STANDALONE_CHAIR ? 'Chair' : 'Table';
    const seatSuffix = seatLabel ? ` — ${seatLabel}` : '';
    const eventName = r.upcomingEvent?.eventType?.name ?? 'Venue event';

    return {
      id: r.id,
      flow: 'VENUE_SEAT',
      status: mapVenueStatus(r.status),
      stage: null,
      amount: Number(r.amount),
      currency: r.currency,
      customerName: r.customerName,
      customerEmail: r.customerEmail,
      contextLabel: `${eventName} (${kindLabel}${seatSuffix})`,
      bookingId: null,
      eventSlug: r.upcomingEvent?.slug ?? null,
      eventId: r.upcomingEventId,
      reservationId: r.id,
      stripeCheckoutSessionId: r.stripeCheckoutSessionId,
      paymentMethodLabel: paymentLabelFromRow(r),
      createdAt: r.createdAt.toISOString(),
      paidAt: iso(r.paidAt),
      expiresAt: iso(r.expiresAt),
      updatedAt: r.updatedAt.toISOString(),
    };
  }

  private async mapVenueReservation(
    r: VenueRow,
  ): Promise<AdminStripePaymentRow> {
    const seatLabel = await this.resolveVenueSeatLabelForRow(r);
    return this.buildVenuePaymentRow(r, seatLabel);
  }

  private mapClassEnrollment(e: ClassRow): AdminStripePaymentRow {
    const event = e.session.event;
    return {
      id: e.id,
      flow: 'CLASS_SESSION',
      status: mapEnrollmentStatus(e.status),
      stage: null,
      amount: Number(e.amount),
      currency: e.currency,
      customerName: e.customerName,
      customerEmail: e.customerEmail,
      contextLabel: event.eventType.name,
      bookingId: null,
      eventSlug: event.slug ?? null,
      eventId: event.id,
      reservationId: null,
      stripeCheckoutSessionId: e.stripeCheckoutSessionId ?? '',
      paymentMethodLabel: paymentLabelFromRow(e),
      createdAt: e.createdAt.toISOString(),
      paidAt: iso(e.paidAt),
      expiresAt: iso(e.expiresAt),
      updatedAt: e.updatedAt.toISOString(),
    };
  }

  private bookingServicesLine(
    booking: BookingPaymentRow['booking'],
  ): string | null {
    const raw = booking.bookingDetails;
    if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
      const labels = (raw as { serviceLabels?: unknown }).serviceLabels;
      if (Array.isArray(labels)) {
        const parts = labels.filter(
          (x): x is string => typeof x === 'string' && x.trim().length > 0,
        );
        if (parts.length > 0) return parts.join(' · ');
      }
    }
    return booking.service?.serviceType?.name ?? null;
  }

  private mapBookingPaymentDetail(
    p: BookingPaymentRow,
  ): AdminStripePaymentDetail {
    const base = this.mapBookingPayment(p);
    const b = p.booking;
    const purchaseDetails: BookingPurchaseDetails = {
      flow: 'BOOKING_QUOTE',
      eventType:
        b.eventType?.name ?? b.event?.eventType?.name ?? base.contextLabel,
      occasion: b.occasionType?.name ?? null,
      services: this.bookingServicesLine(b),
      eventDate: b.eventDate.toISOString(),
      location: b.location?.trim() || null,
      guestCount: b.guestCount ?? null,
      quoteTotalAmount:
        b.quoteTotalAmount != null ? Number(b.quoteTotalAmount) : null,
      quoteDepositAmount:
        b.quoteDepositAmount != null ? Number(b.quoteDepositAmount) : null,
      quoteModel: b.quoteModel ?? null,
    };
    return {
      ...base,
      customerPhone: b.guestPhone?.trim() || null,
      purchaseDetails,
    };
  }

  private async mapVenueReservationDetail(
    r: VenueRow,
  ): Promise<AdminStripePaymentDetail> {
    const seatLabel = await this.resolveVenueSeatLabelForRow(r);
    const base = this.buildVenuePaymentRow(r, seatLabel);
    const eventName = r.upcomingEvent?.eventType?.name ?? 'Venue event';
    const purchaseDetails: VenuePurchaseDetails = {
      flow: 'VENUE_SEAT',
      eventName,
      eventDate: r.eventDate.toISOString(),
      seatKind: r.kind === VenueSeatKind.STANDALONE_CHAIR ? 'CHAIR' : 'TABLE',
      tableName: r.kind === VenueSeatKind.CATALOG_TABLE ? seatLabel : null,
      layoutItemId: r.layoutItemId,
    };
    return {
      ...base,
      customerPhone: r.customerPhone?.trim() || null,
      purchaseDetails,
    };
  }

  private mapClassEnrollmentDetail(e: ClassRow): AdminStripePaymentDetail {
    const base = this.mapClassEnrollment(e);
    const session = e.session;
    const purchaseDetails: ClassPurchaseDetails = {
      flow: 'CLASS_SESSION',
      eventName: session.event.eventType.name,
      sessionStartsAt: session.startsAt.toISOString(),
      sessionEndsAt: session.endsAt.toISOString(),
      sessionTimezone: session.timezone,
    };
    return {
      ...base,
      customerPhone: e.customerPhone?.trim() || null,
      purchaseDetails,
    };
  }

  private mapFixedEnrollmentDetail(e: FixedRow): AdminStripePaymentDetail {
    const base = this.mapFixedEnrollment(e);
    const event = e.event;
    const purchaseDetails: FixedPurchaseDetails = {
      flow: 'FIXED_TICKET',
      eventName: event.eventType.name,
      eventDate: fixedEventStartsAtIso(event.venueConfig?.reservationEventDate),
      ticketNumber: e.ticketNumber ?? null,
    };
    return {
      ...base,
      customerPhone: e.customerPhone?.trim() || null,
      purchaseDetails,
    };
  }

  private mapFixedEnrollment(e: FixedRow): AdminStripePaymentRow {
    const event = e.event;
    const ticket = e.ticketNumber != null ? ` — Ticket #${e.ticketNumber}` : '';
    return {
      id: e.id,
      flow: 'FIXED_TICKET',
      status: mapEnrollmentStatus(e.status),
      stage: null,
      amount: Number(e.amount),
      currency: e.currency,
      customerName: e.customerName,
      customerEmail: e.customerEmail,
      contextLabel: `${event.eventType.name}${ticket}`,
      bookingId: null,
      eventSlug: event.slug ?? null,
      eventId: event.id,
      reservationId: null,
      stripeCheckoutSessionId: e.stripeCheckoutSessionId,
      paymentMethodLabel: paymentLabelFromRow(e),
      createdAt: e.createdAt.toISOString(),
      paidAt: iso(e.paidAt),
      expiresAt: iso(e.expiresAt),
      updatedAt: e.updatedAt.toISOString(),
    };
  }
}

export { TERMINAL_STATUSES };
