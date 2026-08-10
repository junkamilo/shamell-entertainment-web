import { BadRequestException, NotFoundException } from '@nestjs/common';
import {
  BookingStatus,
  EventPublicSection,
  EventTypeCatalogChannel,
} from '@prisma/client';
import {
  ADMIN_BOOKING_GUEST_DTO,
  BOOKING_DETAILS_WINDOW,
  OVERLAPPING_SLOT_EXISTING,
  makeBookingWithRelations,
  makeCancelledBooking,
  makeConfirmedBooking,
  makeUpcomingHubMismatchBooking,
} from '../__mocks__/bookings.fixtures';
import { createBookingsAdminServiceTestModule } from '../testing/bookings-admin-service.test-module';
import type { BookingsAdminService } from './bookings-admin.service';

describe('BookingsAdminService', () => {
  let service: BookingsAdminService;
  let repository: Awaited<
    ReturnType<typeof createBookingsAdminServiceTestModule>
  >['repository'];
  let availability: Awaited<
    ReturnType<typeof createBookingsAdminServiceTestModule>
  >['availability'];
  let mail: Awaited<
    ReturnType<typeof createBookingsAdminServiceTestModule>
  >['mail'];
  let adminActivityNotify: Awaited<
    ReturnType<typeof createBookingsAdminServiceTestModule>
  >['adminActivityNotify'];
  let adminPaymentNotify: Awaited<
    ReturnType<typeof createBookingsAdminServiceTestModule>
  >['adminPaymentNotify'];

  beforeEach(async () => {
    const harness = await createBookingsAdminServiceTestModule();
    service = harness.service;
    repository = harness.repository;
    availability = harness.availability;
    mail = harness.mail;
    adminActivityNotify = harness.adminActivityNotify;
    adminPaymentNotify = harness.adminPaymentNotify;
  });

  describe('occupied / findOne / validateTimeRange (baseline)', () => {
    it('getPublicOccupiedByDate rejects bad date', async () => {
      await expect(
        service.getPublicOccupiedByDate('07-15-2026'),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('getPublicOccupiedByDate returns occupied windows', async () => {
      repository.findOccupiedBookingsInDayRange.mockResolvedValue([
        {
          eventDate: new Date('2026-07-15T14:00:00.000Z'),
          bookingDetails: { ...BOOKING_DETAILS_WINDOW },
        },
      ]);
      const result = await service.getPublicOccupiedByDate('2026-07-15');
      expect(result.date).toBe('2026-07-15');
      expect(result.occupied.length).toBeGreaterThanOrEqual(1);
    });

    it('findOneAdmin throws NotFound', async () => {
      repository.findBookingAdminById.mockResolvedValue(null);
      await expect(service.findOneAdmin('missing')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('findOneAdmin returns catalogMismatch flag', async () => {
      repository.findBookingAdminById.mockResolvedValue(
        makeUpcomingHubMismatchBooking(),
      );
      const row = await service.findOneAdmin('booking-1');
      expect(row.catalogMismatch).toBe(true);
    });

    it('validateBookingTimeRange rejects inverted range', () => {
      expect(() =>
        service.validateBookingTimeRange({
          eventTimeStart: '14:00',
          eventTimeEnd: '13:00',
        }),
      ).toThrow(BadRequestException);
    });
  });

  describe('createAdminBooking', () => {
    function stubCatalogHappy() {
      repository.findServiceById.mockResolvedValue({ id: 'service-1' });
      repository.createAdminBookingWithServices.mockResolvedValue(
        makeBookingWithRelations(),
      );
    }

    it('creates PENDING booking and sends confirmation mail', async () => {
      stubCatalogHappy();
      const created = await service.createAdminBooking('admin-1', {
        ...ADMIN_BOOKING_GUEST_DTO,
      });
      expect(created.status).toBe(BookingStatus.PENDING);
      expect(repository.createAdminBookingWithServices).toHaveBeenCalled();
      expect(mail.sendTransactional).toHaveBeenCalled();
      expect(adminActivityNotify.notifyCustomerActivity).toHaveBeenCalledWith(
        expect.objectContaining({ kind: 'BOOKING_CONFIRMED' }),
      );
    });

    it('rejects invalid guest vs user combination', async () => {
      await expect(
        service.createAdminBooking('admin-1', {
          serviceId: 'service-1',
          eventDate: ADMIN_BOOKING_GUEST_DTO.eventDate,
          location: 'Studio',
          userId: 'user-1',
          guestFullName: 'Ada',
          guestEmail: 'ada@example.com',
          guestPhone: '+1',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects overlapping slot', async () => {
      stubCatalogHappy();
      repository.findActiveSlotsInDayRange.mockResolvedValue([
        OVERLAPPING_SLOT_EXISTING,
      ]);
      await expect(
        service.createAdminBooking('admin-1', {
          ...ADMIN_BOOKING_GUEST_DTO,
          bookingDetails: { ...BOOKING_DETAILS_WINDOW },
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects invalid serviceId', async () => {
      repository.findServiceById.mockResolvedValue(null);
      await expect(
        service.createAdminBooking('admin-1', {
          ...ADMIN_BOOKING_GUEST_DTO,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects UPCOMING_HUB eventType channel', async () => {
      repository.findServiceById.mockResolvedValue({ id: 'service-1' });
      repository.findEventTypeCatalogChannel.mockResolvedValue({
        catalogChannel: EventTypeCatalogChannel.UPCOMING_HUB,
      });
      await expect(
        service.createAdminBooking('admin-1', {
          ...ADMIN_BOOKING_GUEST_DTO,
          eventTypeId: 'et-hub',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects invalid eventDate', async () => {
      stubCatalogHappy();
      await expect(
        service.createAdminBooking('admin-1', {
          ...ADMIN_BOOKING_GUEST_DTO,
          eventDate: 'not-a-date',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects invalid userId', async () => {
      stubCatalogHappy();
      repository.findUserById.mockResolvedValue(null);
      await expect(
        service.createAdminBooking('admin-1', {
          serviceId: 'service-1',
          eventDate: ADMIN_BOOKING_GUEST_DTO.eventDate,
          location: 'Studio',
          userId: 'missing-user',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('updateAdmin status / cancel', () => {
    it('updates status to CONFIRMED (approve-like)', async () => {
      const existing = makeBookingWithRelations();
      repository.findBookingAdminById.mockResolvedValue(existing);
      repository.updateAdminBookingWithServices.mockResolvedValue(
        makeConfirmedBooking(),
      );
      const updated = await service.updateAdmin('booking-1', {
        status: BookingStatus.CONFIRMED,
      });
      expect(updated.status).toBe(BookingStatus.CONFIRMED);
      expect(repository.updateAdminBookingWithServices).toHaveBeenCalled();
      expect(adminPaymentNotify.notifyPaymentOutcome).not.toHaveBeenCalled();
    });

    it('cancels first time: payments + contact + notify', async () => {
      const existing = makeBookingWithRelations({
        contactRequestId: 'contact-1',
        quoteTotalAmount: 200 as never,
        quoteCurrency: 'usd',
      });
      const cancelled = makeCancelledBooking({
        contactRequestId: 'contact-1',
        quoteTotalAmount: 200 as never,
        quoteCurrency: 'usd',
      });
      repository.findBookingAdminById.mockResolvedValue(existing);
      repository.updateAdminBookingWithServices.mockResolvedValue(cancelled);
      repository.updateContactRequestCancelled.mockResolvedValue(undefined);

      await service.updateAdmin('booking-1', {
        status: BookingStatus.CANCELLED,
      });

      expect(repository.updateContactRequestCancelled).toHaveBeenCalledWith(
        'contact-1',
      );
      expect(repository.cancelPendingBookingPayments).toHaveBeenCalledWith(
        cancelled.id,
      );
      expect(adminPaymentNotify.notifyPaymentOutcome).toHaveBeenCalledWith(
        expect.objectContaining({
          outcome: 'CANCELLED',
          flow: 'BOOKING_QUOTE',
        }),
      );
    });

    it('second cancel (already CANCELLED) does not re-notify', async () => {
      const existing = makeCancelledBooking({
        contactRequestId: 'contact-1',
      });
      repository.findBookingAdminById.mockResolvedValue(existing);
      repository.updateAdminBookingWithServices.mockResolvedValue(existing);

      await service.updateAdmin('booking-1', {
        status: BookingStatus.CANCELLED,
      });

      expect(repository.updateContactRequestCancelled).toHaveBeenCalledWith(
        'contact-1',
      );
      expect(repository.cancelPendingBookingPayments).not.toHaveBeenCalled();
      expect(adminPaymentNotify.notifyPaymentOutcome).not.toHaveBeenCalled();
    });

    it('updateAdmin throws NotFound', async () => {
      repository.findBookingAdminById.mockResolvedValue(null);
      await expect(
        service.updateAdmin('missing', { status: BookingStatus.CONFIRMED }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('rejects schedule change with slot conflict', async () => {
      repository.findBookingAdminById.mockResolvedValue(
        makeBookingWithRelations({
          bookingDetails: { ...BOOKING_DETAILS_WINDOW },
        }),
      );
      repository.findActiveSlotsInDayRange.mockResolvedValue([
        OVERLAPPING_SLOT_EXISTING,
      ]);
      await expect(
        service.updateAdmin('booking-1', {
          eventDate: '2026-07-15T16:00:00.000Z',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects invalid bookingDetails merge', async () => {
      repository.findBookingAdminById.mockResolvedValue(
        makeBookingWithRelations({
          bookingDetails: { eventTimeStart: '10:00', eventTimeEnd: '12:00' },
        }),
      );
      await expect(
        service.updateAdmin('booking-1', {
          bookingDetails: {
            eventTimeStart: '14:00',
            eventTimeEnd: '13:00',
          },
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('list / calendar / remove / enrich', () => {
    it('findAllAdmin paginates and flags catalogMismatch', async () => {
      repository.countBookings.mockResolvedValue(1);
      repository.findBookingsAdminList.mockResolvedValue([
        makeUpcomingHubMismatchBooking(),
      ]);
      const result = await service.findAllAdmin({ page: 1, perPage: 10 });
      expect(result.meta.totalItems).toBe(1);
      expect(result.items[0]?.catalogMismatch).toBe(true);
    });

    it('findCalendarAdmin returns items in range', async () => {
      repository.findBookingsCalendar.mockResolvedValue([
        makeBookingWithRelations(),
      ]);
      const result = await service.findCalendarAdmin({
        from: '2026-07-01T00:00:00.000Z',
        to: '2026-07-31T23:59:59.000Z',
      });
      expect(result.items).toHaveLength(1);
      expect(repository.findBookingsCalendar).toHaveBeenCalled();
    });

    it('removeAdmin deletes booking', async () => {
      repository.findBookingAdminById.mockResolvedValue(
        makeBookingWithRelations({ contactRequestId: 'contact-1' }),
      );
      const result = await service.removeAdmin('booking-1', {
        purgeContact: true,
      });
      expect(result).toEqual({ ok: true });
      expect(repository.removeAdminBooking).toHaveBeenCalledWith({
        id: 'booking-1',
        contactRequestId: 'contact-1',
        purgeContact: true,
      });
    });

    it('enrichBookingDetails resolves occasion/event/service labels', async () => {
      repository.findOccasionTypeNamesByIds.mockResolvedValue([
        { id: 'occ-1', name: 'Wedding' },
      ]);
      repository.findEventTypeName.mockResolvedValue({
        id: 'et-1',
        name: 'Gala',
      });
      repository.findServicesWithTypeNames.mockResolvedValue([
        {
          id: 'service-1',
          serviceType: { name: 'Performance' },
        },
      ]);
      const enriched = await service.enrichBookingDetails({
        occasionTypeId: 'occ-1',
        eventTypeId: 'et-1',
        serviceIds: ['service-1'],
      });
      expect(enriched.occasionSingleLabel).toBe('Wedding');
      expect(enriched.eventTypeLabel).toBe('Gala');
      expect(enriched.serviceLabels).toEqual(['Performance']);
    });

    it('assertBookingCatalogRefs rejects mismatched eventId eventType', async () => {
      repository.findServiceById.mockResolvedValue({ id: 'service-1' });
      repository.findEventTypeCatalogChannel.mockResolvedValue({
        catalogChannel: EventTypeCatalogChannel.BOOKING,
      });
      repository.findBookingCatalogEvent.mockResolvedValue({
        eventTypeId: 'other-et',
        publicSection: EventPublicSection.GENERAL,
        eventType: { catalogChannel: EventTypeCatalogChannel.BOOKING },
      });
      await expect(
        service.assertBookingCatalogRefs({
          serviceId: 'service-1',
          eventTypeId: 'et-1',
          eventId: 'event-1',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('create skips confirmation activity when mail fails', async () => {
      repository.findServiceById.mockResolvedValue({ id: 'service-1' });
      repository.createAdminBookingWithServices.mockResolvedValue(
        makeBookingWithRelations(),
      );
      mail.sendTransactional.mockResolvedValue({ ok: false });
      await service.createAdminBooking('admin-1', {
        ...ADMIN_BOOKING_GUEST_DTO,
      });
      expect(adminActivityNotify.notifyCustomerActivity).not.toHaveBeenCalled();
    });
  });

  describe('availability gate', () => {
    it('createAdminBooking propagates availability rejection', async () => {
      repository.findServiceById.mockResolvedValue({ id: 'service-1' });
      availability.assertDateTimeAllowed.mockRejectedValue(
        new BadRequestException('Date not allowed'),
      );
      await expect(
        service.createAdminBooking('admin-1', {
          ...ADMIN_BOOKING_GUEST_DTO,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });
});
