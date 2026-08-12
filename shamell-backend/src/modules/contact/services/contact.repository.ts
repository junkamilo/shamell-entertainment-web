import { Injectable } from '@nestjs/common';
import {
  BookingStatus,
  ContactRequest,
  ContactRequestStatus,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import type { PeticionesFeedRow } from '../types/contact.types';
import { peticionesSqlFragments } from '../utils/peticiones-sql.util';

export type ContactRequestCreateData = {
  fullName: string;
  email: string;
  phone?: string;
  location?: string;
  serviceType?: string;
  preferences?: string;
  message: string;
  subject: string;
  status: ContactRequestStatus;
  eventDate?: Date;
  inquiryDetails?: Prisma.InputJsonValue;
  conciergeVisionSnapshot?: Prisma.InputJsonValue;
};

@Injectable()
export class ContactRepository {
  constructor(private readonly prisma: PrismaService) {}

  asPrisma(): PrismaService {
    return this.prisma;
  }

  runTransaction<T>(
    fn: (tx: Prisma.TransactionClient) => Promise<T>,
    options?: { maxWait?: number; timeout?: number },
  ): Promise<T> {
    return this.prisma.$transaction(fn, options);
  }

  create(data: ContactRequestCreateData): Promise<ContactRequest> {
    return this.prisma.contactRequest.create({ data });
  }

  findById(id: string): Promise<ContactRequest | null> {
    return this.prisma.contactRequest.findUnique({ where: { id } });
  }

  count(where: Prisma.ContactRequestWhereInput): Promise<number> {
    return this.prisma.contactRequest.count({ where });
  }

  findMany(args: {
    where: Prisma.ContactRequestWhereInput;
    skip: number;
    take: number;
  }): Promise<ContactRequest[]> {
    return this.prisma.contactRequest.findMany({
      where: args.where,
      orderBy: { createdAt: 'desc' },
      skip: args.skip,
      take: args.take,
    });
  }

  update(
    id: string,
    data: Prisma.ContactRequestUpdateInput,
  ): Promise<ContactRequest> {
    return this.prisma.contactRequest.update({ where: { id }, data });
  }

  delete(id: string): Promise<ContactRequest> {
    return this.prisma.contactRequest.delete({ where: { id } });
  }

  findOccasionTypeNamesByIds(
    ids: string[],
  ): Promise<Array<{ id: string; name: string }>> {
    if (ids.length === 0) return Promise.resolve([]);
    return this.prisma.occasionType.findMany({
      where: { id: { in: ids } },
      select: { id: true, name: true },
    });
  }

  findEventTypeNameById(id: string): Promise<{ name: string } | null> {
    return this.prisma.eventType.findUnique({
      where: { id },
      select: { name: true },
    });
  }

  findActiveBookingContactRequestId(args: {
    guestEmail: string;
    dayStart: Date;
    dayEnd: Date;
  }): Promise<{ contactRequestId: string | null } | null> {
    return this.prisma.booking.findFirst({
      where: {
        guestEmail: args.guestEmail,
        status: { not: BookingStatus.CANCELLED },
        eventDate: { gte: args.dayStart, lte: args.dayEnd },
      },
      orderBy: { createdAt: 'desc' },
      select: { contactRequestId: true },
    });
  }

  findRecentContactByEmailAndEventDate(args: {
    email: string;
    eventDate: Date;
    since: Date;
  }): Promise<ContactRequest | null> {
    return this.prisma.contactRequest.findFirst({
      where: {
        email: args.email,
        eventDate: args.eventDate,
        createdAt: { gte: args.since },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  findActiveBookingIdByContactRequestId(
    contactRequestId: string,
  ): Promise<{ id: string } | null> {
    return this.prisma.booking.findFirst({
      where: {
        contactRequestId,
        status: { not: BookingStatus.CANCELLED },
      },
      select: { id: true },
    });
  }

  private sinceFilter(since: Date | null) {
    return since
      ? Prisma.sql`WHERE unified.created_at > ${since}`
      : Prisma.empty;
  }

  async countPeticionesBadgeGuidance(since: Date | null): Promise<number> {
    const { isOrphanContact, isConciergeContact } = peticionesSqlFragments();
    const rows = await this.prisma.$queryRaw<Array<{ total: bigint }>>(
      Prisma.sql`
        SELECT COUNT(*)::bigint AS total
        FROM (
          SELECT cr."createdAt" AS created_at
          FROM "contact_requests" cr
          WHERE ${isOrphanContact}
            AND ${isConciergeContact}
        ) unified
        ${this.sinceFilter(since)}
      `,
    );
    return Number(rows[0]?.total ?? 0n);
  }

  async countPeticionesBadgePrivateClasses(
    since: Date | null,
  ): Promise<number> {
    const { isPrivateClassBooking } = peticionesSqlFragments();
    const rows = await this.prisma.$queryRaw<Array<{ total: bigint }>>(
      Prisma.sql`
        SELECT COUNT(*)::bigint AS total
        FROM (
          SELECT b."createdAt" AS created_at
          FROM "bookings" b
          WHERE ${isPrivateClassBooking}
        ) unified
        ${this.sinceFilter(since)}
      `,
    );
    return Number(rows[0]?.total ?? 0n);
  }

  async countPeticionesBadgeBookings(since: Date | null): Promise<number> {
    const {
      isOrphanContact,
      isShadowedBookingInquiryContact,
      isConciergeContact,
      isNonPrivateClassBooking,
    } = peticionesSqlFragments();
    const rows = await this.prisma.$queryRaw<Array<{ total: bigint }>>(
      Prisma.sql`
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
          WHERE ${isNonPrivateClassBooking}
        ) unified
        ${this.sinceFilter(since)}
      `,
    );
    return Number(rows[0]?.total ?? 0n);
  }

  async countGuidanceFeed(): Promise<number> {
    const { isOrphanContact, isConciergeContact } = peticionesSqlFragments();
    const rows = await this.prisma.$queryRaw<Array<{ total: bigint }>>(
      Prisma.sql`
        SELECT COUNT(*)::bigint AS total
        FROM "contact_requests" cr
        WHERE ${isOrphanContact}
          AND ${isConciergeContact}
      `,
    );
    return Number(rows[0]?.total ?? 0n);
  }

  listGuidanceFeed(skip: number, take: number): Promise<PeticionesFeedRow[]> {
    const { isOrphanContact, isConciergeContact } = peticionesSqlFragments();
    return this.prisma.$queryRaw<PeticionesFeedRow[]>(Prisma.sql`
      SELECT 'CONTACT'::text AS origin, cr.id AS id, cr."createdAt" AS created_at
      FROM "contact_requests" cr
      WHERE ${isOrphanContact}
        AND ${isConciergeContact}
      ORDER BY cr."createdAt" DESC
      OFFSET ${skip}
      LIMIT ${take}
    `);
  }

  async countPrivateClassesFeed(): Promise<number> {
    const { isPrivateClassBooking } = peticionesSqlFragments();
    const rows = await this.prisma.$queryRaw<Array<{ total: bigint }>>(
      Prisma.sql`
        SELECT COUNT(*)::bigint AS total
        FROM "bookings" b
        WHERE ${isPrivateClassBooking}
      `,
    );
    return Number(rows[0]?.total ?? 0n);
  }

  listPrivateClassesFeed(
    skip: number,
    take: number,
  ): Promise<PeticionesFeedRow[]> {
    const { isPrivateClassBooking } = peticionesSqlFragments();
    return this.prisma.$queryRaw<PeticionesFeedRow[]>(Prisma.sql`
      SELECT 'BOOKING_ADMIN'::text AS origin, b.id AS id, b."createdAt" AS created_at
      FROM "bookings" b
      WHERE ${isPrivateClassBooking}
      ORDER BY b."createdAt" DESC
      OFFSET ${skip}
      LIMIT ${take}
    `);
  }

  async countBookingsLaneOrphans(): Promise<number> {
    const {
      isOrphanContact,
      isShadowedBookingInquiryContact,
      isConciergeContact,
    } = peticionesSqlFragments();
    const rows = await this.prisma.$queryRaw<Array<{ total: bigint }>>(
      Prisma.sql`
        SELECT COUNT(*)::bigint AS total
        FROM "contact_requests" cr
        WHERE ${isOrphanContact}
          AND ${isShadowedBookingInquiryContact}
          AND NOT ${isConciergeContact}
      `,
    );
    return Number(rows[0]?.total ?? 0n);
  }

  async countBookingsLaneNonPrivate(): Promise<number> {
    const { isNonPrivateClassBooking } = peticionesSqlFragments();
    const rows = await this.prisma.$queryRaw<Array<{ total: bigint }>>(
      Prisma.sql`
        SELECT COUNT(*)::bigint AS total
        FROM "bookings" b
        WHERE ${isNonPrivateClassBooking}
      `,
    );
    return Number(rows[0]?.total ?? 0n);
  }

  listBookingsLaneFeed(
    skip: number,
    take: number,
  ): Promise<PeticionesFeedRow[]> {
    const {
      isOrphanContact,
      isShadowedBookingInquiryContact,
      isConciergeContact,
      isNonPrivateClassBooking,
    } = peticionesSqlFragments();
    return this.prisma.$queryRaw<PeticionesFeedRow[]>(Prisma.sql`
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
        WHERE ${isNonPrivateClassBooking}
      ) unified
      ORDER BY created_at DESC
      OFFSET ${skip}
      LIMIT ${take}
    `);
  }
}
