import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { createAvailabilityServiceMock } from '../../availability/__mocks__/availability.service.mock';
import { AvailabilityService } from '../../availability/services/availability.service';
import { MailService } from '../../mail/services/mail.service';
import { AdminCustomerActivityNotifyService } from '../../mail/services/admin-customer-activity-notify.service';
import { AdminPaymentNotifyService } from '../../mail/services/admin-payment-notify.service';
import { createBookingsRepositoryMock } from '../__mocks__/bookings.repository.mock';
import { makeBookingWithRelations } from '../__mocks__/bookings.fixtures';
import { BookingsAdminService } from './bookings-admin.service';
import { BookingsRepository } from './bookings.repository';

describe('BookingsAdminService', () => {
  let service: BookingsAdminService;
  const repository = createBookingsRepositoryMock();
  const availability = createAvailabilityServiceMock();
  const mail = { sendTransactional: jest.fn().mockResolvedValue({ ok: true }) };
  const adminActivityNotify = { notifyCustomerActivity: jest.fn() };
  const adminPaymentNotify = { notifyPaymentOutcome: jest.fn() };
  const config = { get: jest.fn().mockReturnValue(undefined) };

  beforeEach(async () => {
    jest.clearAllMocks();
    availability.bookingTimeZone.mockReturnValue('America/New_York');
    availability.assertDateTimeAllowed.mockResolvedValue(undefined);
    repository.findActiveSlotsInDayRange.mockResolvedValue([]);
    const moduleRef = await Test.createTestingModule({
      providers: [
        BookingsAdminService,
        { provide: BookingsRepository, useValue: repository },
        { provide: AvailabilityService, useValue: availability },
        { provide: MailService, useValue: mail },
        {
          provide: AdminCustomerActivityNotifyService,
          useValue: adminActivityNotify,
        },
        {
          provide: AdminPaymentNotifyService,
          useValue: adminPaymentNotify,
        },
        { provide: ConfigService, useValue: config },
      ],
    }).compile();
    service = moduleRef.get(BookingsAdminService);
  });

  it('getPublicOccupiedByDate rejects bad date', async () => {
    await expect(
      service.getPublicOccupiedByDate('07-15-2026'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('getPublicOccupiedByDate returns occupied windows', async () => {
    repository.findOccupiedBookingsInDayRange.mockResolvedValue([
      {
        eventDate: new Date('2026-07-15T14:00:00.000Z'),
        bookingDetails: { eventTimeStart: '10:00', eventTimeEnd: '12:00' },
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
      makeBookingWithRelations({
        eventType: { catalogChannel: 'UPCOMING_HUB' } as never,
      }),
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
