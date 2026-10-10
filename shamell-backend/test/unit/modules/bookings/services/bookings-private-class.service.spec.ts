import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { createAvailabilityServiceMock } from '@test-support/modules/availability/mocks/availability.service.mock';
import { AvailabilityService } from '@app/modules/availability/services/availability.service';
import { MailService } from '@app/modules/mail/services/mail.service';
import { AdminPaymentNotifyService } from '@app/modules/mail/services/admin-payment-notify.service';
import { createBookingsRepositoryMock } from '@test-support/modules/bookings/mocks/bookings.repository.mock';
import { makeBookingWithRelations } from '@test-support/modules/bookings/fixtures/bookings.fixtures';
import { BookingsAdminService } from '@app/modules/bookings/services/bookings-admin.service';
import { BookingsPrivateClassService } from '@app/modules/bookings/services/bookings-private-class.service';
import { BookingsQuoteService } from '@app/modules/bookings/services/bookings-quote.service';
import { BookingsRepository } from '@app/modules/bookings/services/bookings.repository';

describe('BookingsPrivateClassService', () => {
  let service: BookingsPrivateClassService;
  const repository = createBookingsRepositoryMock();
  const availability = createAvailabilityServiceMock();
  const admin = { assertNoDuplicateSlot: jest.fn() };
  const quote = { createBookingQuote: jest.fn() };
  const mail = { sendTransactional: jest.fn().mockResolvedValue({ ok: true }) };
  const adminPaymentNotify = { notifyPaymentOutcome: jest.fn() };
  const config = { get: jest.fn().mockReturnValue(undefined) };

  const dto = {
    classType: 'Salsa',
    eventDate: '2030-08-15',
    eventTimeStart: '14:00',
    location: 'Studio',
    customerName: 'Ada',
    customerEmail: 'ada@example.com',
    amountUsd: 150,
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    availability.bookingTimeZone.mockReturnValue('America/New_York');
    availability.assertDateTimeAllowed.mockResolvedValue(undefined);
    repository.findPrivateClassServiceByCode.mockResolvedValue({
      id: 'svc-private',
    });
    repository.createPrivateClassBookingWithServices.mockResolvedValue(
      makeBookingWithRelations({
        id: 'pc-1',
        guestFullName: 'Ada',
        guestEmail: 'ada@example.com',
      }),
    );
    const moduleRef = await Test.createTestingModule({
      providers: [
        BookingsPrivateClassService,
        { provide: BookingsRepository, useValue: repository },
        { provide: AvailabilityService, useValue: availability },
        { provide: BookingsAdminService, useValue: admin },
        { provide: BookingsQuoteService, useValue: quote },
        { provide: MailService, useValue: mail },
        { provide: AdminPaymentNotifyService, useValue: adminPaymentNotify },
        { provide: ConfigService, useValue: config },
      ],
    }).compile();
    service = moduleRef.get(BookingsPrivateClassService);
  });

  it('createCash reserves and notifies', async () => {
    await expect(service.createCash('admin-1', dto)).resolves.toEqual({
      bookingId: 'pc-1',
      message: 'Private class reserved.',
    });
    expect(adminPaymentNotify.notifyPaymentOutcome).toHaveBeenCalled();
  });

  it('createCheckoutSession creates quote after booking', async () => {
    quote.createBookingQuote.mockResolvedValue({
      quoteId: 'q-1',
      message: 'Payment link sent successfully.',
    });
    await expect(
      service.createCheckoutSession('admin-1', dto),
    ).resolves.toMatchObject({
      bookingId: 'pc-1',
      quoteId: 'q-1',
    });
  });

  it('rejects when private class service missing', async () => {
    repository.findPrivateClassServiceByCode.mockResolvedValue(null);
    repository.findPrivateClassServiceByName.mockResolvedValue(null);
    await expect(service.createCash('admin-1', dto)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});
