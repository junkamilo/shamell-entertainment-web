import { Test } from '@nestjs/testing';
import { PrismaService } from '../../../prisma/prisma.service';
import { createPrismaMock } from '../../../testing';
import { BookingsRepository } from './bookings.repository';

describe('BookingsRepository', () => {
  let repository: BookingsRepository;
  const prisma = createPrismaMock();
  const findUniqueOrThrow = jest.fn();

  beforeEach(async () => {
    jest.clearAllMocks();
    Object.assign(prisma.booking, { findUniqueOrThrow });
    prisma.$transaction.mockImplementation(
      (fn: (tx: typeof prisma) => Promise<unknown>) =>
        Promise.resolve(fn(prisma)),
    );
    const moduleRef = await Test.createTestingModule({
      providers: [
        BookingsRepository,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    repository = moduleRef.get(BookingsRepository);
  });

  it('cancelPendingBookingPayments updates PENDING rows', async () => {
    prisma.bookingPayment.updateMany.mockResolvedValue({ count: 2 });
    await repository.cancelPendingBookingPayments('booking-1');
    const calls = prisma.bookingPayment.updateMany.mock.calls as Array<
      [{ where: { bookingId: string } }]
    >;
    expect(calls[0]?.[0].where.bookingId).toBe('booking-1');
  });

  it('findBookingAdminById uses admin include', async () => {
    prisma.booking.findUnique.mockResolvedValue({ id: 'b-1' });
    await repository.findBookingAdminById('b-1');
    expect(prisma.booking.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'b-1' } }),
    );
  });

  it('asPrisma returns injected client', () => {
    expect(repository.asPrisma()).toBe(prisma);
  });

  it('runTransaction delegates to prisma.$transaction', async () => {
    const result = await repository.runTransaction(() => Promise.resolve(42));
    expect(result).toBe(42);
  });

  describe('admin write txs', () => {
    it('createAdminBookingWithServices creates booking, syncs services, marks contact', async () => {
      prisma.booking.create.mockResolvedValue({ id: 'booking-new' });
      findUniqueOrThrow.mockResolvedValue({ id: 'booking-new' });
      prisma.bookingService.deleteMany.mockResolvedValue({ count: 0 });
      prisma.bookingService.createMany.mockResolvedValue({ count: 1 });
      prisma.contactRequest.update.mockResolvedValue({});

      const result = await repository.createAdminBookingWithServices({
        data: {
          serviceId: 'service-1',
          eventDate: new Date('2026-07-15T16:00:00.000Z'),
          location: 'Studio',
        },
        serviceIds: ['service-1'],
        contactRequestId: 'contact-1',
        markContactReserved: true,
      });

      expect(result.id).toBe('booking-new');
      expect(prisma.booking.create).toHaveBeenCalled();
      expect(prisma.bookingService.deleteMany).toHaveBeenCalledWith({
        where: { bookingId: 'booking-new' },
      });
      expect(prisma.bookingService.createMany).toHaveBeenCalled();
      expect(prisma.contactRequest.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'contact-1' },
        }),
      );
    });

    it('createAdminBookingWithServices skips contact when not reserved', async () => {
      prisma.booking.create.mockResolvedValue({ id: 'booking-2' });
      findUniqueOrThrow.mockResolvedValue({ id: 'booking-2' });
      prisma.bookingService.deleteMany.mockResolvedValue({ count: 0 });
      prisma.bookingService.createMany.mockResolvedValue({ count: 1 });

      await repository.createAdminBookingWithServices({
        data: {
          serviceId: 'service-1',
          eventDate: new Date(),
          location: 'Studio',
        },
        serviceIds: ['service-1'],
        markContactReserved: false,
      });

      expect(prisma.contactRequest.update).not.toHaveBeenCalled();
    });

    it('updateAdminBookingWithServices syncs services when requested', async () => {
      prisma.booking.update.mockResolvedValue({ id: 'booking-1' });
      findUniqueOrThrow.mockResolvedValue({ id: 'booking-1' });
      prisma.bookingService.deleteMany.mockResolvedValue({ count: 1 });
      prisma.bookingService.createMany.mockResolvedValue({ count: 2 });

      await repository.updateAdminBookingWithServices({
        id: 'booking-1',
        data: { location: 'Updated' },
        shouldSyncServices: true,
        serviceIds: ['service-1', 'service-2'],
      });

      expect(prisma.booking.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'booking-1' } }),
      );
      expect(prisma.bookingService.createMany).toHaveBeenCalled();
    });

    it('updateAdminBookingWithServices skips sync when not requested', async () => {
      prisma.booking.update.mockResolvedValue({ id: 'booking-1' });
      findUniqueOrThrow.mockResolvedValue({ id: 'booking-1' });

      await repository.updateAdminBookingWithServices({
        id: 'booking-1',
        data: { notes: 'x' },
        shouldSyncServices: false,
      });

      expect(prisma.bookingService.deleteMany).not.toHaveBeenCalled();
    });

    it('removeAdminBooking cancels contact then deletes booking', async () => {
      prisma.contactRequest.update.mockResolvedValue({});
      prisma.booking.delete.mockResolvedValue({});

      await repository.removeAdminBooking({
        id: 'booking-1',
        contactRequestId: 'contact-1',
      });

      expect(prisma.contactRequest.update).toHaveBeenCalled();
      expect(prisma.booking.delete).toHaveBeenCalledWith({
        where: { id: 'booking-1' },
      });
      expect(prisma.contactRequest.delete).not.toHaveBeenCalled();
    });

    it('removeAdminBooking purges contact when requested', async () => {
      prisma.contactRequest.update.mockResolvedValue({});
      prisma.booking.delete.mockResolvedValue({});
      prisma.contactRequest.delete.mockResolvedValue({});

      await repository.removeAdminBooking({
        id: 'booking-1',
        contactRequestId: 'contact-1',
        purgeContact: true,
      });

      expect(prisma.contactRequest.delete).toHaveBeenCalledWith({
        where: { id: 'contact-1' },
      });
    });
  });

  describe('inquiry / private class / quote helpers', () => {
    it('insertPublicInquiryBooking creates booking and syncs services', async () => {
      prisma.booking.create.mockResolvedValue({ id: 'inquiry-booking' });
      findUniqueOrThrow.mockResolvedValue({ id: 'inquiry-booking' });
      prisma.bookingService.deleteMany.mockResolvedValue({ count: 0 });
      prisma.bookingService.createMany.mockResolvedValue({ count: 1 });

      const result = await repository.insertPublicInquiryBooking('contact-1', {
        serviceId: 'service-1',
        eventTypeId: null,
        occasionTypeId: null,
        eventId: null,
        eventDate: new Date('2026-07-15T16:00:00.000Z'),
        location: 'Studio',
        guestCount: 10,
        notes: null,
        bookingDetails: { serviceIds: ['service-1'] },
        guestFullName: 'Guest',
        guestEmail: 'g@example.com',
        guestPhone: '+1',
      });

      expect(result.id).toBe('inquiry-booking');
      expect(prisma.booking.create).toHaveBeenCalled();
      expect(prisma.bookingService.createMany).toHaveBeenCalled();
    });

    it('createPrivateClassBookingWithServices syncs single service', async () => {
      prisma.booking.create.mockResolvedValue({ id: 'pc-1' });
      findUniqueOrThrow.mockResolvedValue({ id: 'pc-1' });
      prisma.bookingService.deleteMany.mockResolvedValue({ count: 0 });
      prisma.bookingService.createMany.mockResolvedValue({ count: 1 });

      const result = await repository.createPrivateClassBookingWithServices({
        data: {
          serviceId: 'pc-service',
          eventDate: new Date(),
          location: 'Studio',
        },
        serviceId: 'pc-service',
      });

      expect(result.id).toBe('pc-1');
      expect(prisma.bookingService.createMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: [
            expect.objectContaining({
              bookingId: 'pc-1',
              serviceId: 'pc-service',
            }),
          ],
        }),
      );
    });

    it('cancelOtherPendingBalancePayments cancels other BALANCE pending', async () => {
      prisma.bookingPayment.updateMany.mockResolvedValue({ count: 1 });
      await repository.cancelOtherPendingBalancePayments(
        'booking-1',
        'keep-payment',
      );
      expect(prisma.bookingPayment.updateMany).toHaveBeenCalledTimes(1);
    });

    it('findActiveQuoteByTokenHash filters SENT/ACCEPTED', async () => {
      prisma.bookingQuote.findFirst.mockResolvedValue({ id: 'quote-1' });
      await repository.findActiveQuoteByTokenHash('hash');
      expect(prisma.bookingQuote.findFirst).toHaveBeenCalled();
    });

    it('findActiveQuoteByBookingId queries by booking', async () => {
      prisma.bookingQuote.findFirst.mockResolvedValue({ id: 'quote-2' });
      await repository.findActiveQuoteByBookingId('booking-1');
      expect(prisma.bookingQuote.findFirst).toHaveBeenCalled();
    });

    it('createBookingQuote and createBookingPayment persist rows', async () => {
      prisma.bookingQuote.create.mockResolvedValue({ id: 'quote-x' });
      prisma.bookingPayment.create.mockResolvedValue({ id: 'pay-x' });
      await repository.createBookingQuote({
        bookingId: 'booking-1',
        paymentModel: 'FULL',
        totalAmount: 100,
        currency: 'usd',
        tokenHash: 'h',
        tokenExpiresAt: new Date(),
      } as never);
      await repository.createBookingPayment({
        bookingId: 'booking-1',
        quoteId: 'quote-x',
        stage: 'FULL',
        expectedAmount: 100,
        currency: 'usd',
        stripeCheckoutSessionId: 'cs_1',
      } as never);
      expect(prisma.bookingQuote.create).toHaveBeenCalled();
      expect(prisma.bookingPayment.create).toHaveBeenCalled();
    });

    it('findActiveSlotsInDayRange excludes id when provided', async () => {
      prisma.booking.findMany.mockResolvedValue([]);
      const start = new Date('2026-07-15T00:00:00.000Z');
      const end = new Date('2026-07-15T23:59:00.000Z');
      await repository.findActiveSlotsInDayRange(start, end, 'exclude-me');
      expect(prisma.booking.findMany).toHaveBeenCalled();
      const calls = prisma.booking.findMany.mock.calls as Array<
        [{ where: { NOT?: { id: string } } }]
      >;
      expect(calls[0][0].where.NOT).toEqual({ id: 'exclude-me' });
    });

    it('findActiveSlotsInDayRange omits NOT when excludeId absent', async () => {
      prisma.booking.findMany.mockResolvedValue([]);
      const start = new Date('2026-07-15T00:00:00.000Z');
      const end = new Date('2026-07-15T23:59:00.000Z');
      await repository.findActiveSlotsInDayRange(start, end);
      const calls = prisma.booking.findMany.mock.calls as Array<
        [{ where: { NOT?: { id: string } } }]
      >;
      expect(calls[0][0].where.NOT).toBeUndefined();
    });

    it('thin find helpers delegate to prisma', async () => {
      prisma.occasionType.findMany.mockResolvedValue([]);
      prisma.eventType.findUnique.mockResolvedValue({ name: 'Wedding' });
      prisma.service.findMany.mockResolvedValue([]);
      prisma.service.findUnique.mockResolvedValue({ id: 'svc-1' });
      prisma.occasionType.findUnique.mockResolvedValue({ id: 'occ-1' });
      prisma.event.findFirst.mockResolvedValue({ id: 'evt-1' });
      prisma.booking.findMany.mockResolvedValue([]);
      prisma.contactRequest.update.mockResolvedValue({});

      await repository.findOccasionTypeNamesByIds(['occ-1']);
      await repository.findEventTypeName('et-1');
      await repository.findServicesWithTypeNames(['svc-1']);
      await repository.findServiceIdsExisting(['svc-1']);
      await repository.findOccupiedBookingsInDayRange(
        new Date('2026-07-15T00:00:00.000Z'),
        new Date('2026-07-15T23:59:00.000Z'),
      );
      await repository.findServiceById('svc-1');
      await repository.findEventTypeCatalogChannel('et-1');
      await repository.findOccasionTypeById('occ-1');
      await repository.findBookingCatalogEvent('evt-1');
      await repository.updateContactRequestCancelled('cr-1');

      expect(prisma.occasionType.findMany).toHaveBeenCalled();
      expect(prisma.eventType.findUnique).toHaveBeenCalled();
      expect(prisma.service.findMany).toHaveBeenCalled();
      expect(prisma.service.findUnique).toHaveBeenCalled();
      expect(prisma.booking.findMany).toHaveBeenCalled();
      expect(prisma.contactRequest.update).toHaveBeenCalled();
    });
  });

  it('removeAdminBooking skips contact update when contactRequestId is null', async () => {
    prisma.$transaction.mockImplementation(
      async (fn: (tx: typeof prisma) => Promise<void>) => fn(prisma),
    );
    prisma.booking.delete.mockResolvedValue({});
    await repository.removeAdminBooking({
      id: 'booking-1',
      contactRequestId: null,
    });
    expect(prisma.contactRequest.update).not.toHaveBeenCalled();
    expect(prisma.booking.delete).toHaveBeenCalledWith({
      where: { id: 'booking-1' },
    });
  });
});
