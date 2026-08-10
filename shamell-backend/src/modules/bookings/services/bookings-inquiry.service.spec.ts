import { BadRequestException, ConflictException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as bookingTz from '../../availability/utils/booking-tz';
import { createAvailabilityServiceMock } from '../../availability/__mocks__/availability.service.mock';
import { AvailabilityService } from '../../availability/services/availability.service';
import {
  bookingDetailsForPublicInquiry,
  resolvePrimaryServiceIdForInquiry,
} from '../../booking-inquiry/utils/contact-inquiry-booking.util';
import { createBookingsRepositoryMock } from '../__mocks__/bookings.repository.mock';
import { makeBookingWithRelations } from '../__mocks__/bookings.fixtures';
import { BookingsAdminService } from './bookings-admin.service';
import { BookingsInquiryService } from './bookings-inquiry.service';
import { BookingsRepository } from './bookings.repository';

jest.mock('../../booking-inquiry/utils/contact-inquiry-booking.util', () => ({
  resolvePrimaryServiceIdForInquiry: jest.fn(),
  bookingDetailsForPublicInquiry: jest.fn(),
}));

const SERVICE_ID = '11111111-1111-4111-8111-111111111111';
const EVENT_TYPE_ID = '22222222-2222-4222-8222-222222222222';
const EVENT_ID = '33333333-3333-4333-8333-333333333333';

const baseDto = {
  fullName: 'Ada Lovelace',
  email: 'ada@example.com',
  phone: '+15551234567',
  location: 'Miami Beach',
  eventDate: '2026-07-15',
  message: 'Preface\n\n---\n\nClient comment here',
};

const baseEnriched = {
  eventTimeStart: '14:00',
  eventTimeEnd: '16:00',
  guestCount: 40,
};

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

  const resolveServiceId = jest.mocked(resolvePrimaryServiceIdForInquiry);
  const alignDetails = jest.mocked(bookingDetailsForPublicInquiry);

  beforeEach(async () => {
    jest.clearAllMocks();
    availability.bookingTimeZone.mockReturnValue('America/New_York');
    availability.assertDateTimeAllowed.mockResolvedValue(undefined);
    admin.assertNoDuplicateSlot.mockResolvedValue(undefined);
    admin.enrichBookingDetails.mockImplementation((d: unknown) =>
      Promise.resolve(d),
    );
    resolveServiceId.mockResolvedValue(SERVICE_ID);
    alignDetails.mockImplementation((_enriched, serviceId) => ({
      ...baseEnriched,
      serviceIds: [serviceId],
    }));

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
    expect(resolveServiceId).not.toHaveBeenCalled();
  });

  it('preparePublicBookingInquiry returns null when location missing', async () => {
    const result = await service.preparePublicBookingInquiry(
      {
        ...baseDto,
        location: '   ',
      },
      baseEnriched,
    );
    expect(result).toBeNull();
    expect(resolveServiceId).not.toHaveBeenCalled();
  });

  it('preparePublicBookingInquiry returns null when eventDate missing', async () => {
    const result = await service.preparePublicBookingInquiry(
      {
        ...baseDto,
        eventDate: undefined,
      },
      baseEnriched,
    );
    expect(result).toBeNull();
    expect(resolveServiceId).not.toHaveBeenCalled();
  });

  it('preparePublicBookingInquiry returns null when service cannot be resolved', async () => {
    resolveServiceId.mockResolvedValue(null);

    const result = await service.preparePublicBookingInquiry(
      baseDto,
      baseEnriched,
    );

    expect(result).toBeNull();
    expect(admin.validateBookingTimeRange).not.toHaveBeenCalled();
  });

  it('preparePublicBookingInquiry happy path returns prepared payload', async () => {
    const enrichedDetails = {
      ...baseEnriched,
      eventTypeId: EVENT_TYPE_ID,
      eventId: EVENT_ID,
      serviceIds: [SERVICE_ID],
    };
    alignDetails.mockReturnValue(enrichedDetails);
    admin.enrichBookingDetails.mockResolvedValue({
      ...enrichedDetails,
      eventTypeName: 'Gala',
    });

    const result = await service.preparePublicBookingInquiry(
      baseDto,
      enrichedDetails,
      'contact-1',
    );

    expect(result).toMatchObject({
      serviceId: SERVICE_ID,
      eventTypeId: EVENT_TYPE_ID,
      eventId: EVENT_ID,
      location: 'Miami Beach',
      guestCount: 40,
      notes: 'Client comment here',
      guestFullName: 'Ada Lovelace',
      guestEmail: 'ada@example.com',
      guestPhone: '+15551234567',
    });
    expect(result?.eventDate).toBeInstanceOf(Date);
    expect(admin.validateBookingTimeRange).toHaveBeenCalled();
    expect(availability.assertDateTimeAllowed).toHaveBeenCalled();
    expect(admin.assertNoDuplicateSlot).toHaveBeenCalled();
    expect(admin.assertBookingCatalogRefs).toHaveBeenCalledWith({
      serviceId: SERVICE_ID,
      eventTypeId: EVENT_TYPE_ID,
      occasionTypeId: undefined,
      eventId: EVENT_ID,
    });
  });

  it('preparePublicBookingInquiry skips catalog refs when no eventTypeId or eventId', async () => {
    alignDetails.mockReturnValue({ ...baseEnriched, serviceIds: [SERVICE_ID] });

    await service.preparePublicBookingInquiry(baseDto, baseEnriched);

    expect(admin.assertBookingCatalogRefs).not.toHaveBeenCalled();
  });

  it('preparePublicBookingInquiry propagates availability rejection', async () => {
    availability.assertDateTimeAllowed.mockRejectedValue(
      new BadRequestException('Date/time not available'),
    );

    await expect(
      service.preparePublicBookingInquiry(baseDto, baseEnriched),
    ).rejects.toThrow(BadRequestException);
  });

  it('preparePublicBookingInquiry propagates duplicate slot rejection', async () => {
    admin.assertNoDuplicateSlot.mockRejectedValue(
      new ConflictException('Slot already booked'),
    );

    await expect(
      service.preparePublicBookingInquiry(baseDto, baseEnriched),
    ).rejects.toThrow(ConflictException);
  });

  it('preparePublicBookingInquiry returns null when event instant is invalid', async () => {
    jest
      .spyOn(bookingTz, 'utcInstantForWallClock')
      .mockReturnValue(new Date(Number.NaN));

    const result = await service.preparePublicBookingInquiry(
      baseDto,
      baseEnriched,
    );

    expect(result).toBeNull();
    jest.spyOn(bookingTz, 'utcInstantForWallClock').mockRestore();
  });

  it('createFromPublicBookingInquiry returns null when prepare fails', async () => {
    resolveServiceId.mockResolvedValue(null);

    const result = await service.createFromPublicBookingInquiry(
      'contact-1',
      baseDto,
      baseEnriched,
    );

    expect(result).toBeNull();
    expect(repository.insertPublicInquiryBooking).not.toHaveBeenCalled();
  });

  it('createFromPublicBookingInquiry persists when prepare succeeds', async () => {
    const booking = makeBookingWithRelations({ contactRequestId: 'contact-1' });
    repository.insertPublicInquiryBooking.mockResolvedValue(booking);

    const result = await service.createFromPublicBookingInquiry(
      'contact-1',
      baseDto,
      baseEnriched,
    );

    expect(result).toEqual(booking);
    expect(repository.insertPublicInquiryBooking).toHaveBeenCalled();
    expect(admin.sendBookingCreatedConfirmation).toHaveBeenCalledWith(booking);
  });

  it('notifyBookingCreated delegates to admin confirmation mail', async () => {
    const booking = makeBookingWithRelations();

    await service.notifyBookingCreated(booking);

    expect(admin.sendBookingCreatedConfirmation).toHaveBeenCalledWith(booking);
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
