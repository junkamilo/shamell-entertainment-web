import { Injectable } from '@nestjs/common';
import {
  BookingPaymentStatus,
  Prisma,
  UpcomingClassEnrollmentStatus,
  VenueSeatReservationStatus,
} from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  ALL_PAYMENT_FLOWS,
  bookingPaymentInclude,
  classInclude,
  fixedInclude,
  packageInclude,
  venueInclude,
} from '../constants/admin-payments.constants';
import type { PaymentListKey } from '../types/admin-payments.types';
import type {
  AdminPaymentFlow,
  AdminPaymentStatus,
} from '../dto/admin-payments-query.dto';
import type {
  BookingPaymentRow,
  ClassRow,
  FixedRow,
  PackageRow,
  VenueRow,
} from '../utils/admin-payments-mapper.util';

@Injectable()
export class AdminPaymentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  buildUnionParts(
    flows: AdminPaymentFlow[],
    status: AdminPaymentStatus | undefined,
    q: string | undefined,
    from: Date | null,
    to: Date | null,
  ): Prisma.Sql[] {
    return this.paymentUnionParts(flows, status, q, from, to);
  }

  async countUnion(unionParts: Prisma.Sql[]): Promise<number> {
    if (unionParts.length === 0) return 0;
    const unionSql = Prisma.join(unionParts, ' UNION ALL ');
    const countRows = await this.prisma.$queryRaw<Array<{ total: bigint }>>(
      Prisma.sql`
        SELECT COUNT(*)::bigint AS total
        FROM (${unionSql}) merged
      `,
    );
    return Number(countRows[0]?.total ?? 0n);
  }

  async listKeys(
    unionParts: Prisma.Sql[],
    skip: number,
    limit: number,
  ): Promise<PaymentListKey[]> {
    if (unionParts.length === 0) return [];
    const unionSql = Prisma.join(unionParts, ' UNION ALL ');
    return this.prisma.$queryRaw<PaymentListKey[]>(
      Prisma.sql`
        SELECT flow, id, updated_at
        FROM (${unionSql}) merged
        ORDER BY updated_at DESC
        OFFSET ${skip}
        LIMIT ${limit}
      `,
    );
  }

  findBookingPaymentsByIds(ids: string[]): Promise<BookingPaymentRow[]> {
    if (ids.length === 0) return Promise.resolve([]);
    return this.prisma.bookingPayment.findMany({
      where: { id: { in: ids } },
      include: bookingPaymentInclude,
    });
  }

  findVenueReservationsByIds(ids: string[]): Promise<VenueRow[]> {
    if (ids.length === 0) return Promise.resolve([]);
    return this.prisma.venueSeatReservation.findMany({
      where: { id: { in: ids } },
      include: venueInclude,
    });
  }

  findClassEnrollmentsByIds(ids: string[]): Promise<ClassRow[]> {
    if (ids.length === 0) return Promise.resolve([]);
    return this.prisma.upcomingClassEnrollment.findMany({
      where: { id: { in: ids } },
      include: classInclude,
    });
  }

  findPackageEnrollmentsByIds(ids: string[]): Promise<PackageRow[]> {
    if (ids.length === 0) return Promise.resolve([]);
    return this.prisma.upcomingClassPackageEnrollment.findMany({
      where: { id: { in: ids } },
      include: packageInclude,
    });
  }

  findFixedEnrollmentsByIds(ids: string[]): Promise<FixedRow[]> {
    if (ids.length === 0) return Promise.resolve([]);
    return this.prisma.upcomingFixedEventEnrollment.findMany({
      where: { id: { in: ids } },
      include: fixedInclude,
    });
  }

  findBookingPaymentById(id: string): Promise<BookingPaymentRow | null> {
    return this.prisma.bookingPayment.findUnique({
      where: { id },
      include: bookingPaymentInclude,
    });
  }

  findVenueReservationById(id: string): Promise<VenueRow | null> {
    return this.prisma.venueSeatReservation.findUnique({
      where: { id },
      include: venueInclude,
    });
  }

  findClassEnrollmentById(id: string): Promise<ClassRow | null> {
    return this.prisma.upcomingClassEnrollment.findUnique({
      where: { id },
      include: classInclude,
    });
  }

  findFixedEnrollmentById(id: string): Promise<FixedRow | null> {
    return this.prisma.upcomingFixedEventEnrollment.findUnique({
      where: { id },
      include: fixedInclude,
    });
  }

  findFloorLayoutIdForEvent(eventId: string): Promise<string | null> {
    return this.prisma.upcomingVenueConfig
      .findUnique({
        where: { eventId },
        select: { floorLayoutId: true },
      })
      .then((config) => config?.floorLayoutId ?? null);
  }

  async countBadgeSince(since: Date): Promise<number> {
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

    return booking + venue + classEnroll + fixedEnroll;
  }

  defaultFlows(): AdminPaymentFlow[] {
    return [...ALL_PAYMENT_FLOWS];
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
}
