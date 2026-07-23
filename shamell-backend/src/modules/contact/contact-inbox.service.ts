import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { buildPaginationMeta } from '../../common/pagination/pagination.util';
import { PrismaService } from '../../prisma/prisma.service';
import { AdminPeticionesQueryDto } from './dto/admin-peticiones-query.dto';
import { hydratePeticionesPage } from './peticiones/peticiones-hydrate.util';
import { peticionesSqlFragments } from './peticiones/peticiones-sql.util';

type PeticionesLane = 'bookings' | 'guidance' | 'private_classes';

function resolvePeticionesLane(raw?: string): PeticionesLane {
  if (raw === 'guidance') return 'guidance';
  if (raw === 'private_classes') return 'private_classes';
  return 'bookings';
}

@Injectable()
export class ContactInboxService {
  constructor(private readonly prisma: PrismaService) {}

  async countPeticionesBadge(query: {
    since?: number;
    lane?: string;
  }): Promise<{ count: number }> {
    const lane = resolvePeticionesLane(query.lane);
    const since =
      query.since != null && Number.isFinite(query.since) && query.since > 0
        ? new Date(query.since)
        : null;
    const {
      isOrphanContact,
      isShadowedBookingInquiryContact,
      isConciergeContact,
      isPrivateClassBooking,
    } = peticionesSqlFragments();
    const sinceFilter = since
      ? Prisma.sql`WHERE unified.created_at > ${since}`
      : Prisma.empty;

    if (lane === 'guidance') {
      const rows = await this.prisma.$queryRaw<
        Array<{ total: bigint }>
      >(Prisma.sql`
        SELECT COUNT(*)::bigint AS total
        FROM (
          SELECT cr."createdAt" AS created_at
          FROM "contact_requests" cr
          WHERE ${isOrphanContact}
            AND ${isConciergeContact}
        ) unified
        ${sinceFilter}
      `);
      return { count: Number(rows[0]?.total ?? 0n) };
    }

    if (lane === 'private_classes') {
      const rows = await this.prisma.$queryRaw<
        Array<{ total: bigint }>
      >(Prisma.sql`
        SELECT COUNT(*)::bigint AS total
        FROM (
          SELECT b."createdAt" AS created_at
          FROM "bookings" b
          WHERE ${isPrivateClassBooking}
        ) unified
        ${sinceFilter}
      `);
      return { count: Number(rows[0]?.total ?? 0n) };
    }

    const rows = await this.prisma.$queryRaw<
      Array<{ total: bigint }>
    >(Prisma.sql`
      SELECT COUNT(*)::bigint AS total
      FROM (
        SELECT cr."createdAt" AS created_at
        FROM "contact_requests" cr
        WHERE ${isOrphanContact}
          AND ${isShadowedBookingInquiryContact}
          AND NOT ${isConciergeContact}
        UNION ALL
        SELECT b."createdAt" AS created_at
        FROM "bookings" b
        WHERE NOT ${isPrivateClassBooking}
      ) unified
      ${sinceFilter}
    `);
    return { count: Number(rows[0]?.total ?? 0n) };
  }

  async findAllPeticiones(query: AdminPeticionesQueryDto) {
    const page = Math.max(1, Number(query.page ?? 1));
    const perPage = Number(query.perPage ?? 10);
    const skip = (page - 1) * perPage;
    const lane = resolvePeticionesLane(query.lane);

    const {
      isOrphanContact,
      isShadowedBookingInquiryContact,
      isConciergeContact,
      isPrivateClassBooking,
    } = peticionesSqlFragments();

    if (lane === 'guidance') {
      const guidanceCountRows = await this.prisma.$queryRaw<
        Array<{ total: bigint }>
      >(Prisma.sql`
          SELECT COUNT(*)::bigint AS total
          FROM "contact_requests" cr
          WHERE ${isOrphanContact}
            AND ${isConciergeContact}
        `);
      const totalItems = Number(guidanceCountRows[0]?.total ?? 0n);
      if (totalItems === 0) {
        return {
          items: [],
          meta: buildPaginationMeta({ page, perPage, totalItems }),
        };
      }

      const feedRows = await this.prisma.$queryRaw<
        Array<{
          origin: 'CONTACT' | 'BOOKING_ADMIN';
          id: string;
          created_at: Date;
        }>
      >(Prisma.sql`
        SELECT 'CONTACT'::text AS origin, cr.id AS id, cr."createdAt" AS created_at
        FROM "contact_requests" cr
        WHERE ${isOrphanContact}
          AND ${isConciergeContact}
        ORDER BY cr."createdAt" DESC
        OFFSET ${skip}
        LIMIT ${perPage}
      `);

      return hydratePeticionesPage(
        this.prisma,
        feedRows,
        page,
        perPage,
        totalItems,
      );
    }

    if (lane === 'private_classes') {
      const countRows = await this.prisma.$queryRaw<
        Array<{ total: bigint }>
      >(Prisma.sql`
        SELECT COUNT(*)::bigint AS total
        FROM "bookings" b
        WHERE ${isPrivateClassBooking}
      `);
      const totalItems = Number(countRows[0]?.total ?? 0n);
      if (totalItems === 0) {
        return {
          items: [],
          meta: buildPaginationMeta({ page, perPage, totalItems }),
        };
      }

      const feedRows = await this.prisma.$queryRaw<
        Array<{
          origin: 'CONTACT' | 'BOOKING_ADMIN';
          id: string;
          created_at: Date;
        }>
      >(Prisma.sql`
        SELECT 'BOOKING_ADMIN'::text AS origin, b.id AS id, b."createdAt" AS created_at
        FROM "bookings" b
        WHERE ${isPrivateClassBooking}
        ORDER BY b."createdAt" DESC
        OFFSET ${skip}
        LIMIT ${perPage}
      `);

      return hydratePeticionesPage(
        this.prisma,
        feedRows,
        page,
        perPage,
        totalItems,
      );
    }

    const [nonConciergeOrphanRows, bookingCountRows] = await Promise.all([
      this.prisma.$queryRaw<Array<{ total: bigint }>>(Prisma.sql`
        SELECT COUNT(*)::bigint AS total
        FROM "contact_requests" cr
        WHERE ${isOrphanContact}
          AND ${isShadowedBookingInquiryContact}
          AND NOT ${isConciergeContact}
      `),
      this.prisma.$queryRaw<Array<{ total: bigint }>>(Prisma.sql`
        SELECT COUNT(*)::bigint AS total
        FROM "bookings" b
        WHERE NOT ${isPrivateClassBooking}
      `),
    ]);
    const nonConciergeOrphanTotal = Number(
      nonConciergeOrphanRows[0]?.total ?? 0n,
    );
    const bookingTotal = Number(bookingCountRows[0]?.total ?? 0n);
    const totalItems = bookingTotal + nonConciergeOrphanTotal;
    if (totalItems === 0) {
      return {
        items: [],
        meta: buildPaginationMeta({ page, perPage, totalItems }),
      };
    }

    const feedRows = await this.prisma.$queryRaw<
      Array<{
        origin: 'CONTACT' | 'BOOKING_ADMIN';
        id: string;
        created_at: Date;
      }>
    >(Prisma.sql`
      SELECT *
      FROM (
        SELECT 'CONTACT'::text AS origin, cr.id AS id, cr."createdAt" AS created_at
        FROM "contact_requests" cr
        WHERE ${isOrphanContact}
          AND ${isShadowedBookingInquiryContact}
          AND NOT ${isConciergeContact}
        UNION ALL
        SELECT 'BOOKING_ADMIN'::text AS origin, b.id AS id, b."createdAt" AS created_at
        FROM "bookings" b
        WHERE NOT ${isPrivateClassBooking}
      ) unified
      ORDER BY created_at DESC
      OFFSET ${skip}
      LIMIT ${perPage}
    `);

    return hydratePeticionesPage(
      this.prisma,
      feedRows,
      page,
      perPage,
      totalItems,
    );
  }
}
