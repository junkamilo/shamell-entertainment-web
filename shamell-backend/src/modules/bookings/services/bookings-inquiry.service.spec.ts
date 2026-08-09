import { Test } from '@nestjs/testing';
import { createAvailabilityServiceMock } from '../../availability/__mocks__/availability.service.mock';
import { AvailabilityService } from '../../availability/services/availability.service';
import { createBookingsRepositoryMock } from '../__mocks__/bookings.repository.mock';
import { makeBookingWithRelations } from '../__mocks__/bookings.fixtures';
import { BookingsAdminService } from './bookings-admin.service';
import { BookingsInquiryService } from './bookings-inquiry.service';
import { BookingsRepository } from './bookings.repository';

describe('BookingsInquiryService', () => {
  let service: BookingsInquiryService;
  const repository = createBookingsRepositoryMock();
  const availability = createAvailabilityServiceMock();
  const admin = {
    validateBookingTimeRange: jest.fn(),
    assertNoDuplicateSlot: jest.fn(),
    enrichBookingDetails: jest.fn(),
    assertBookingCatalogRefs: jest.fn(),
    sendBookingCreatedConfirmation: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    availability.bookingTimeZone.mockReturnValue('America/New_York');
    const moduleRef = await Test.createTestingModule({
      providers: [
        BookingsInquiryService,
        { provide: BookingsRepository, useValue: repository },
        { provide: AvailabilityService, useValue: availability },
        { provide: BookingsAdminService, useValue: admin },
      ],
    }).compile();
    service = moduleRef.get(BookingsInquiryService);
  });

  it('preparePublicBookingInquiry returns null when phone missing', async () => {
    const result = await service.preparePublicBookingInquiry(
      {
        fullName: 'Ada',
        email: 'ada@example.com',
        message: 'hi',
        location: 'Studio',
        eventDate: '2026-07-15',
      },
      {},
    );
    expect(result).toBeNull();
  });

  it('insertPublicBookingInquiry persists then confirms', async () => {
    const booking = makeBookingWithRelations();
    repository.insertPublicInquiryBooking.mockResolvedValue(booking);
    const prepared = {
      serviceId: 'service-1',
      eventTypeId: null,
      occasionTypeId: null,
      eventId: null,
      eventDate: new Date(),
      location: 'Studio',
      guestCount: null,
      notes: null,
      bookingDetails: {},
      guestFullName: 'Ada',
      guestEmail: 'ada@example.com',
      guestPhone: '+1',
    };
    await expect(
      service.insertPublicBookingInquiry('contact-1', prepared as never),
    ).resolves.toEqual(booking);
    expect(admin.sendBookingCreatedConfirmation).toHaveBeenCalledWith(booking);
  });

  it('insertPublicBookingInquiry can skip confirmation', async () => {
    const booking = makeBookingWithRelations();
    repository.insertPublicInquiryBooking.mockResolvedValue(booking);
    await service.insertPublicBookingInquiry('contact-1', {} as never, {
      skipConfirmationEmail: true,
    });
    expect(admin.sendBookingCreatedConfirmation).not.toHaveBeenCalled();
  });
});
