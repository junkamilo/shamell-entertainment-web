import { Injectable } from '@nestjs/common';
import {
  BookingPaymentStage,
  BookingPaymentStatus,
  BookingQuoteStatus,
  BookingSource,
  BookingStatus,
  ContactRequestStatus,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  adminListInclude,
  calendarInclude,
  type BookingWithRelations,
} from '../constants/booking-includes';
import {
  resolveBookingServiceIds,
  syncBookingServices,
} from '../utils/booking-services.util';
import type { PublicBookingInquiryPrepared } from '../types/bookings.types';

const webhookPaymentInclude = {
  booking: {
    include: {
      user: true,
      eventType: true,
      service: { include: { serviceType: true } },
      event: { include: { eventType: true } },
    },
  },
  quote: true,
} satisfies Prisma.BookingPaymentInclude;

const webhookExpiredInclude = {
  booking: {
    include: {
      user: true,
      eventType: true,
      service: { include: { serviceType: true } },
      event: { include: { eventType: true } },
    },
  },
} satisfies Prisma.BookingPaymentInclude;

@Injectable()
export class BookingsRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** Expose Prisma for helpers that require the full client (e.g. inquiry service resolve). */
  asPrisma(): PrismaService {
    return this.prisma;
  }

  runTransaction<T>(
    fn: (tx: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    return this.prisma.$transaction(fn);
  }

  cancelPendingBookingPayments(bookingId: string) {
    return this.prisma.bookingPayment.updateMany({
      where: { bookingId, status: BookingPaymentStatus.PENDING },
      data: { status: BookingPaymentStatus.CANCELLED },
    });
  }

  findOccasionTypeNamesByIds(ids: string[]) {
    return this.prisma.occasionType.findMany({
      where: { id: { in: ids } },
      select: { id: true, name: true },
    });
  }

  findEventTypeName(id: string) {
    return this.prisma.eventType.findUnique({
      where: { id },
      select: { name: true },
    });
  }

  findServicesWithTypeNames(ids: string[]) {
    return this.prisma.service.findMany({
      where: { id: { in: ids } },
      select: {
        id: true,
        serviceType: { select: { name: true } },
      },
    });
  }

  findServiceIdsExisting(ids: string[]) {
    return this.prisma.service.findMany({
      where: { id: { in: ids } },
      select: { id: true },
    });
  }

  findActiveSlotsInDayRange(dayStart: Date, dayEnd: Date, excludeId?: string) {
    return this.prisma.booking.findMany({
      where: {
        eventDate: { gte: dayStart, lte: dayEnd },
        status: { in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] },
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
      select: { id: true, eventDate: true, bookingDetails: true },
    });
  }

  findOccupiedBookingsInDayRange(dayStart: Date, dayEnd: Date) {
    return this.prisma.booking.findMany({
      where: {
        eventDate: { gte: dayStart, lte: dayEnd },
        status: { in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] },
      },
      select: { eventDate: true, bookingDetails: true },
    });
  }

  findServiceById(id: string) {
    return this.prisma.service.findUnique({ where: { id } });
  }

  findEventTypeCatalogChannel(id: string) {
    return this.prisma.eventType.findUnique({
      where: { id },
      select: { id: true, catalogChannel: true },
    });
  }

  findOccasionTypeById(id: string) {
    return this.prisma.occasionType.findUnique({ where: { id } });
  }

  findBookingCatalogEvent(id: string) {
    return this.prisma.event.findFirst({
      where: { id },
      select: {
        id: true,
        eventTypeId: true,
        publicSection: true,
        eventType: { select: { catalogChannel: true } },
      },
    });
  }

  findUserById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  findContactRequestById(id: string) {
    return this.prisma.contactRequest.findUnique({ where: { id } });
  }

  findBookingIdByContactRequestId(contactRequestId: string) {
    return this.prisma.booking.findFirst({
      where: { contactRequestId },
      select: { id: true },
    });
  }

  async createAdminBookingWithServices(args: {
    data: Prisma.BookingCreateInput | Prisma.BookingUncheckedCreateInput;
    serviceIds: string[];
    contactRequestId?: string | null;
    markContactReserved?: boolean;
  }): Promise<BookingWithRelations> {
    return this.prisma.$transaction(async (tx) => {
      const booking = await tx.booking.create({
        data: args.data,
        include: adminListInclude,
      });
      await syncBookingServices(tx, booking.id, args.serviceIds);
      if (args.markContactReserved && args.contactRequestId) {
        await tx.contactRequest.update({
          where: { id: args.contactRequestId },
          data: {
            status: ContactRequestStatus.RESERVED,
            isRead: true,
          },
        });
      }
      return tx.booking.findUniqueOrThrow({
        where: { id: booking.id },
        include: adminListInclude,
      });
    });
  }

  countBookings(where: Prisma.BookingWhereInput) {
    return this.prisma.booking.count({ where });
  }

  findBookingsAdminList(
    where: Prisma.BookingWhereInput,
    skip: number,
    take: number,
  ) {
    return this.prisma.booking.findMany({
      where,
      orderBy: { eventDate: 'desc' },
      include: adminListInclude,
      skip,
      take,
    });
  }

  findBookingsCalendar(where: Prisma.BookingWhereInput) {
    return this.prisma.booking.findMany({
      where,
      orderBy: { eventDate: 'asc' },
      include: calendarInclude,
    });
  }

  findBookingAdminById(id: string) {
    return this.prisma.booking.findUnique({
      where: { id },
      include: adminListInclude,
    });
  }

  async updateAdminBookingWithServices(args: {
    id: string;
    data: Prisma.BookingUpdateInput | Prisma.BookingUncheckedUpdateInput;
    shouldSyncServices: boolean;
    serviceIds?: string[];
  }): Promise<BookingWithRelations> {
    return this.prisma.$transaction(async (tx) => {
      await tx.booking.update({
        where: { id: args.id },
        data: args.data,
        include: adminListInclude,
      });
      if (args.shouldSyncServices && args.serviceIds) {
        await syncBookingServices(tx, args.id, args.serviceIds);
      }
      return tx.booking.findUniqueOrThrow({
        where: { id: args.id },
        include: adminListInclude,
      });
    });
  }

  async removeAdminBooking(args: {
    id: string;
    contactRequestId: string | null;
    purgeContact?: boolean;
  }): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      if (args.contactRequestId) {
        await tx.contactRequest.update({
          where: { id: args.contactRequestId },
          data: {
            status: ContactRequestStatus.CANCELLED,
            isRead: true,
          },
        });
      }
      await tx.booking.delete({ where: { id: args.id } });
      if (args.purgeContact && args.contactRequestId) {
        await tx.contactRequest.delete({
          where: { id: args.contactRequestId },
        });
      }
    });
  }

  updateContactRequestCancelled(contactRequestId: string) {
    return this.prisma.contactRequest.update({
      where: { id: contactRequestId },
      data: {
        status: ContactRequestStatus.CANCELLED,
        isRead: true,
      },
    });
  }

  async insertPublicInquiryBooking(
    contactRequestId: string,
    prepared: PublicBookingInquiryPrepared,
    tx?: Prisma.TransactionClient,
  ): Promise<BookingWithRelations> {
    const db = tx ?? this.prisma;
    const created = await db.booking.create({
      data: {
        serviceId: prepared.serviceId,
        eventTypeId: prepared.eventTypeId,
        occasionTypeId: prepared.occasionTypeId,
        eventId: prepared.eventId,
        eventDate: prepared.eventDate,
        location: prepared.location,
        guestCount: prepared.guestCount,
        notes: prepared.notes,
        status: BookingStatus.PENDING,
        bookingDetails: prepared.bookingDetails,
        source: BookingSource.CLIENT_REGISTERED,
        contactRequestId,
        guestFullName: prepared.guestFullName,
        guestEmail: prepared.guestEmail,
        guestPhone: prepared.guestPhone,
      },
      include: adminListInclude,
    });
    await syncBookingServices(
      db,
      created.id,
      resolveBookingServiceIds(prepared.serviceId, prepared.bookingDetails),
    );
    return db.booking.findUniqueOrThrow({
      where: { id: created.id },
      include: adminListInclude,
    });
  }

  createBookingQuote(
    data:
      | Prisma.BookingQuoteCreateInput
      | Prisma.BookingQuoteUncheckedCreateInput,
  ) {
    return this.prisma.bookingQuote.create({ data });
  }

  updateBooking(
    id: string,
    data: Prisma.BookingUpdateInput | Prisma.BookingUncheckedUpdateInput,
  ) {
    return this.prisma.booking.update({ where: { id }, data });
  }

  findActiveQuoteByBookingId(bookingId: string) {
    return this.prisma.bookingQuote.findFirst({
      where: {
        bookingId,
        status: { in: [BookingQuoteStatus.SENT, BookingQuoteStatus.ACCEPTED] },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  updateBookingQuote(
    id: string,
    data:
      | Prisma.BookingQuoteUpdateInput
      | Prisma.BookingQuoteUncheckedUpdateInput,
  ) {
    return this.prisma.bookingQuote.update({ where: { id }, data });
  }

  cancelOtherPendingBalancePayments(bookingId: string, keepPaymentId: string) {
    return this.prisma.bookingPayment.updateMany({
      where: {
        bookingId,
        stage: BookingPaymentStage.BALANCE,
        status: BookingPaymentStatus.PENDING,
        id: { not: keepPaymentId },
      },
      data: { status: BookingPaymentStatus.CANCELLED },
    });
  }

  findBookingWithUser(id: string) {
    return this.prisma.booking.findUnique({
      where: { id },
      include: { user: true },
    });
  }

  findPendingPaymentByQuoteId(quoteId: string) {
    return this.prisma.bookingPayment.findFirst({
      where: {
        quoteId,
        status: BookingPaymentStatus.PENDING,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  updateBookingPayment(
    id: string,
    data:
      | Prisma.BookingPaymentUpdateInput
      | Prisma.BookingPaymentUncheckedUpdateInput,
  ) {
    return this.prisma.bookingPayment.update({ where: { id }, data });
  }

  findPaymentByCheckoutSessionId(sessionId: string) {
    return this.prisma.bookingPayment.findUnique({
      where: { stripeCheckoutSessionId: sessionId },
      include: { booking: { include: { user: true } } },
    });
  }

  createBookingPayment(
    data:
      | Prisma.BookingPaymentCreateInput
      | Prisma.BookingPaymentUncheckedCreateInput,
  ) {
    return this.prisma.bookingPayment.create({ data });
  }

  findActiveQuoteByTokenHash(tokenHash: string) {
    return this.prisma.bookingQuote.findFirst({
      where: {
        tokenHash,
        status: { in: [BookingQuoteStatus.SENT, BookingQuoteStatus.ACCEPTED] },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  findWebhookPaymentBySessionId(sessionId: string) {
    return this.prisma.bookingPayment.findUnique({
      where: { stripeCheckoutSessionId: sessionId },
      include: webhookPaymentInclude,
    });
  }

  findExpiredWebhookPaymentBySessionId(sessionId: string) {
    return this.prisma.bookingPayment.findUnique({
      where: { stripeCheckoutSessionId: sessionId },
      include: webhookExpiredInclude,
    });
  }

  findActiveServiceById(id: string) {
    return this.prisma.service.findUnique({
      where: { id },
      select: { id: true, isActive: true },
    });
  }

  findPrivateClassServiceByCode() {
    return this.prisma.service.findFirst({
      where: {
        isActive: true,
        serviceType: {
          isActive: true,
          contactInquiryCode: 'PRIVATE_CLASS',
        },
      },
      select: { id: true },
    });
  }

  findPrivateClassServiceByName() {
    return this.prisma.service.findFirst({
      where: {
        isActive: true,
        serviceType: {
          isActive: true,
          name: { equals: 'Private Class', mode: 'insensitive' },
        },
      },
      select: { id: true },
    });
  }

  async createPrivateClassBookingWithServices(args: {
    data: Prisma.BookingUncheckedCreateInput;
    serviceId: string;
  }): Promise<BookingWithRelations> {
    return this.prisma.$transaction(async (tx) => {
      const booking = await tx.booking.create({
        data: args.data,
        include: adminListInclude,
      });
      await syncBookingServices(tx, booking.id, [args.serviceId]);
      return tx.booking.findUniqueOrThrow({
        where: { id: booking.id },
        include: adminListInclude,
      });
    });
  }
}
