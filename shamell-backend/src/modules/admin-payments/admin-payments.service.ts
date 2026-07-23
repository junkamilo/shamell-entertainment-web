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
import { buildLimitPaginationMeta } from '../../common/pagination/pagination.util';
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

const packageInclude = {
  event: {
    select: {
      id: true,
      slug: true,
      eventType: { select: { name: true, id: true } },
    },
  },
  items: { select: { id: true } },
} satisfies Prisma.UpcomingClassPackageEnrollmentInclude;

const ALL_PAYMENT_FLOWS: AdminPaymentFlow[] = [
  'BOOKING_QUOTE',
  'VENUE_SEAT',
  'CLASS_SESSION',
  'CLASS_PACKAGE',
  'CLASS_DAY_BUNDLE',
  'FIXED_TICKET',
];

type PaymentListKey = {
  flow: AdminPaymentFlow;
  id: string;
  updated_at: Date;
};

type PackageRow = Prisma.UpcomingClassPackageEnrollmentGetPayload<{
  include: typeof packageInclude;
}>;

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
    const skip = (page - 1) * limit;
    const q = query.q?.trim();
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
      : ALL_PAYMENT_FLOWS;

    const unionParts = this.paymentUnionParts(flows, query.status, q, from, to);
    if (unionParts.length === 0) {
      return {
        items: [],
        meta: buildLimitPaginationMeta({ page, limit, totalItems: 0 }),
      };
    }

    const unionSql = Prisma.join(unionParts, ' UNION ALL ');
    const countRows = await this.prisma.$queryRaw<Array<{ total: bigint }>>(
      Prisma.sql`
        SELECT COUNT(*)::bigint AS total
        FROM (${unionSql}) merged
      `,
    );
    const totalItems = Number(countRows[0]?.total ?? 0n);
    if (totalItems === 0) {
      return {
        items: [],
        meta: buildLimitPaginationMeta({ page, limit, totalItems }),
      };
    }

    const pageRows = await this.prisma.$queryRaw<PaymentListKey[]>(
      Prisma.sql`
        SELECT flow, id, updated_at
        FROM (${unionSql}) merged
        ORDER BY updated_at DESC
        OFFSET ${skip}
        LIMIT ${limit}
      `,
    );

    const items = await this.hydratePaymentRows(pageRows);

    return {
      items,
      meta: buildLimitPaginationMeta({ page, limit, totalItems }),
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

  private paymentUnionParts(
    flows: AdminPaymentFlow[],
    status: AdminPaymentStatus | undefined,
    q: string | undefined,
    from: Date | null,
    to: Date | null,
  ): Prisma.Sql[] {
    const parts: Prisma.Sql[] = [];
    const updatedAtBooking = this.updatedAtSql('bp', from, to);
    const updatedAtVenue = this.updatedAtSql('vsr', from, to);
    const updatedAtClass = this.updatedAtSql('uce', from, to);
    const updatedAtPackage = this.updatedAtSql('ucp', from, to);
    const updatedAtFixed = this.updatedAtSql('ufe', from, to);
    const searchPattern = q ? `%${q}%` : null;

    if (flows.includes('BOOKING_QUOTE')) {
      const statusSql = this.bookingStatusSql(status);
      const searchSql = searchPattern
        ? Prisma.sql`(
            b."guestFullName" ILIKE ${searchPattern}
            OR b."guestEmail" ILIKE ${searchPattern}
            OR u."fullName" ILIKE ${searchPattern}
            OR u.email ILIKE ${searchPattern}
          )`
        : Prisma.sql`TRUE`;
      parts.push(Prisma.sql`
        SELECT 'BOOKING_QUOTE'::text AS flow, bp.id, bp."updatedAt" AS updated_at
        FROM "booking_payments" bp
        INNER JOIN "bookings" b ON b.id = bp."bookingId"
        LEFT JOIN "users" u ON u.id = b."userId"
        WHERE ${statusSql}
          AND ${updatedAtBooking}
          AND ${searchSql}
      `);
    }

    if (flows.includes('VENUE_SEAT')) {
      const statusSql = this.venueStatusSql(status);
      const searchSql = searchPattern
        ? Prisma.sql`(
            vsr."customerName" ILIKE ${searchPattern}
            OR vsr."customerEmail" ILIKE ${searchPattern}
          )`
        : Prisma.sql`TRUE`;
      parts.push(Prisma.sql`
        SELECT 'VENUE_SEAT'::text AS flow, vsr.id, vsr."updatedAt" AS updated_at
        FROM "venue_seat_reservations" vsr
        WHERE ${statusSql}
          AND ${updatedAtVenue}
          AND ${searchSql}
      `);
    }

    if (flows.includes('CLASS_SESSION')) {
      const statusSql = this.enrollmentStatusSql('uce', status);
      const searchSql = searchPattern
        ? Prisma.sql`(
            uce."customerName" ILIKE ${searchPattern}
            OR uce."customerEmail" ILIKE ${searchPattern}
          )`
        : Prisma.sql`TRUE`;
      parts.push(Prisma.sql`
        SELECT 'CLASS_SESSION'::text AS flow, uce.id, uce."updatedAt" AS updated_at
        FROM "upcoming_class_enrollments" uce
        WHERE NOT EXISTS (
          SELECT 1
          FROM "upcoming_class_package_enrollment_items" pei
          WHERE pei."enrollmentId" = uce.id
        )
          AND ${statusSql}
          AND ${updatedAtClass}
          AND ${searchSql}
      `);
    }

    if (flows.includes('CLASS_PACKAGE')) {
      const statusSql = this.enrollmentStatusSql('ucp', status);
      const searchSql = searchPattern
        ? Prisma.sql`(
            ucp."customerName" ILIKE ${searchPattern}
            OR ucp."customerEmail" ILIKE ${searchPattern}
          )`
        : Prisma.sql`TRUE`;
      parts.push(Prisma.sql`
        SELECT 'CLASS_PACKAGE'::text AS flow, ucp.id, ucp."updatedAt" AS updated_at
        FROM "upcoming_class_package_enrollments" ucp
        WHERE COALESCE(ucp.selections->>'kind', '') IN ('class_month_package', 'class_package')
          AND ${statusSql}
          AND ${updatedAtPackage}
          AND ${searchSql}
      `);
    }

    if (flows.includes('CLASS_DAY_BUNDLE')) {
      const statusSql = this.enrollmentStatusSql('ucp', status);
      const searchSql = searchPattern
        ? Prisma.sql`(
            ucp."customerName" ILIKE ${searchPattern}
            OR ucp."customerEmail" ILIKE ${searchPattern}
          )`
        : Prisma.sql`TRUE`;
      parts.push(Prisma.sql`
        SELECT 'CLASS_DAY_BUNDLE'::text AS flow, ucp.id, ucp."updatedAt" AS updated_at
        FROM "upcoming_class_package_enrollments" ucp
        WHERE ucp.selections->>'kind' = 'class_session_bundle'
          AND ${statusSql}
          AND ${updatedAtPackage}
          AND ${searchSql}
      `);
    }

    if (flows.includes('FIXED_TICKET')) {
      const statusSql = this.enrollmentStatusSql('ufe', status);
      const searchSql = searchPattern
        ? Prisma.sql`(
            ufe."customerName" ILIKE ${searchPattern}
            OR ufe."customerEmail" ILIKE ${searchPattern}
          )`
        : Prisma.sql`TRUE`;
      parts.push(Prisma.sql`
        SELECT 'FIXED_TICKET'::text AS flow, ufe.id, ufe."updatedAt" AS updated_at
        FROM "upcoming_fixed_event_enrollments" ufe
        WHERE ${statusSql}
          AND ${updatedAtFixed}
          AND ${searchSql}
      `);
    }

    return parts;
  }

  private updatedAtSql(
    alias: string,
    from: Date | null,
    to: Date | null,
  ): Prisma.Sql {
    const column = Prisma.raw(`${alias}."updatedAt"`);
    if (from && to) {
      return Prisma.sql`${column} >= ${from} AND ${column} <= ${to}`;
    }
    if (from) {
      return Prisma.sql`${column} >= ${from}`;
    }
    if (to) {
      return Prisma.sql`${column} <= ${to}`;
    }
    return Prisma.sql`TRUE`;
  }

  private bookingStatusSql(status: AdminPaymentStatus | undefined): Prisma.Sql {
    if (!status) return Prisma.sql`TRUE`;
    return Prisma.sql`bp.status = ${status}::"BookingPaymentStatus"`;
  }

  private venueStatusSql(status: AdminPaymentStatus | undefined): Prisma.Sql {
    if (!status) return Prisma.sql`TRUE`;
    const mapped =
      status === 'PENDING'
        ? VenueSeatReservationStatus.PENDING_PAYMENT
        : status;
    return Prisma.sql`vsr.status = ${mapped}::"VenueSeatReservationStatus"`;
  }

  private enrollmentStatusSql(
    alias: 'uce' | 'ucp' | 'ufe',
    status: AdminPaymentStatus | undefined,
  ): Prisma.Sql {
    if (!status) return Prisma.sql`TRUE`;
    const mapped =
      status === 'PENDING'
        ? UpcomingClassEnrollmentStatus.PENDING_PAYMENT
        : status;
    return Prisma.sql`${Prisma.raw(alias)}.status = ${mapped}::"UpcomingClassEnrollmentStatus"`;
  }

  private async hydratePaymentRows(
    keys: PaymentListKey[],
  ): Promise<AdminStripePaymentRow[]> {
    if (keys.length === 0) return [];

    const byFlow = new Map<AdminPaymentFlow, string[]>();
    for (const key of keys) {
      const ids = byFlow.get(key.flow) ?? [];
      ids.push(key.id);
      byFlow.set(key.flow, ids);
    }

    const rowByKey = new Map<string, AdminStripePaymentRow>();

    const bookingIds = byFlow.get('BOOKING_QUOTE') ?? [];
    if (bookingIds.length > 0) {
      const rows = await this.prisma.bookingPayment.findMany({
        where: { id: { in: bookingIds } },
        include: bookingPaymentInclude,
      });
      for (const row of rows) {
        rowByKey.set(`BOOKING_QUOTE:${row.id}`, this.mapBookingPayment(row));
      }
    }

    const venueIds = byFlow.get('VENUE_SEAT') ?? [];
    if (venueIds.length > 0) {
      const rows = await this.prisma.venueSeatReservation.findMany({
        where: { id: { in: venueIds } },
        include: venueInclude,
      });
      for (const row of rows) {
        rowByKey.set(
          `VENUE_SEAT:${row.id}`,
          await this.mapVenueReservation(row),
        );
      }
    }

    const classIds = byFlow.get('CLASS_SESSION') ?? [];
    if (classIds.length > 0) {
      const rows = await this.prisma.upcomingClassEnrollment.findMany({
        where: { id: { in: classIds } },
        include: classInclude,
      });
      for (const row of rows) {
        rowByKey.set(`CLASS_SESSION:${row.id}`, this.mapClassEnrollment(row));
      }
    }

    const packageIds = [
      ...(byFlow.get('CLASS_PACKAGE') ?? []),
      ...(byFlow.get('CLASS_DAY_BUNDLE') ?? []),
    ];
    if (packageIds.length > 0) {
      const rows = await this.prisma.upcomingClassPackageEnrollment.findMany({
        where: { id: { in: packageIds } },
        include: packageInclude,
      });
      for (const row of rows) {
        const flow = this.packagePaymentFlow(row);
        rowByKey.set(
          `${flow}:${row.id}`,
          this.mapClassPackageEnrollment(row, flow),
        );
      }
    }

    const fixedIds = byFlow.get('FIXED_TICKET') ?? [];
    if (fixedIds.length > 0) {
      const rows = await this.prisma.upcomingFixedEventEnrollment.findMany({
        where: { id: { in: fixedIds } },
        include: fixedInclude,
      });
      for (const row of rows) {
        rowByKey.set(`FIXED_TICKET:${row.id}`, this.mapFixedEnrollment(row));
      }
    }

    return keys
      .map((key) => rowByKey.get(`${key.flow}:${key.id}`))
      .filter((row): row is AdminStripePaymentRow => row != null);
  }

  private packagePaymentFlow(
    row: PackageRow,
  ): 'CLASS_PACKAGE' | 'CLASS_DAY_BUNDLE' {
    const kind =
      row.selections &&
      typeof row.selections === 'object' &&
      !Array.isArray(row.selections)
        ? (row.selections as { kind?: string }).kind
        : undefined;
    return kind === 'class_session_bundle'
      ? 'CLASS_DAY_BUNDLE'
      : 'CLASS_PACKAGE';
  }

  private mapClassPackageEnrollment(
    pkg: PackageRow,
    flow: 'CLASS_PACKAGE' | 'CLASS_DAY_BUNDLE',
  ): AdminStripePaymentRow {
    const event = pkg.event;
    const selections =
      pkg.selections &&
      typeof pkg.selections === 'object' &&
      !Array.isArray(pkg.selections)
        ? (pkg.selections as {
            kind?: string;
            monthIso?: string;
            dateIso?: string;
            sessionCount?: number;
          })
        : {};
    const sessionCount =
      pkg.items.length > 0 ? pkg.items.length : (selections.sessionCount ?? 0);
    const contextLabel =
      flow === 'CLASS_DAY_BUNDLE'
        ? `${event.eventType.name} — ${sessionCount} section(s) on ${selections.dateIso ?? 'selected day'}`
        : `${event.eventType.name} — class package (${sessionCount} sessions)`;

    return {
      id: pkg.id,
      flow,
      status: mapEnrollmentStatus(pkg.status),
      stage: null,
      amount: Number(pkg.amount),
      currency: pkg.currency,
      customerName: pkg.customerName,
      customerEmail: pkg.customerEmail,
      contextLabel,
      bookingId: null,
      eventSlug: event.slug ?? null,
      eventId: event.id,
      reservationId: null,
      stripeCheckoutSessionId: pkg.stripeCheckoutSessionId,
      paymentMethodLabel: paymentLabelFromRow(pkg),
      createdAt: pkg.createdAt.toISOString(),
      paidAt: iso(pkg.paidAt),
      expiresAt: iso(pkg.expiresAt),
      updatedAt: pkg.updatedAt.toISOString(),
    };
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
    const where: Prisma.UpcomingClassEnrollmentWhereInput = {
      packageItem: { is: null },
    };
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
