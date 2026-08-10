import { BadRequestException } from '@nestjs/common';
import { makeCreateContactDto } from '../src/modules/contact/__mocks__/contact.fixtures';
import { makeBookingWithRelations } from '../src/modules/bookings/__mocks__/bookings.fixtures';
import { createBookingsInquiryServiceTestModule } from '../src/modules/bookings/testing/bookings-inquiry-service.test-module';

const SERVICE_ID = '11111111-1111-4111-8111-111111111111';

describe('Bookings inquiry flows (deep e2e)', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('preparePublicBookingInquiry happy path via real service', async () => {
    const { service, availability } =
      await createBookingsInquiryServiceTestModule();

    const dto = makeCreateContactDto({
      eventDate: '2026-09-15',
      location: 'Miami Beach',
      message: 'Intro\n\n---\n\nPlease call back.',
    });
    const enriched = {
      serviceIds: [SERVICE_ID],
      eventTimeStart: '10:00',
      eventTimeEnd: '12:00',
      guestCount: 25,
    };

    const prepared = await service.preparePublicBookingInquiry(
      dto,
      enriched,
      'contact-happy',
    );

    expect(prepared).toMatchObject({
      serviceId: SERVICE_ID,
      location: 'Miami Beach',
      guestCount: 25,
      notes: 'Please call back.',
      guestFullName: dto.fullName,
      guestEmail: dto.email.trim().toLowerCase(),
      guestPhone: dto.phone,
    });
    expect(prepared?.eventDate).toBeInstanceOf(Date);
    expect(availability.assertDateTimeAllowed).toHaveBeenCalled();
  });

  it('preparePublicBookingInquiry returns null when phone missing', async () => {
    const { service } = await createBookingsInquiryServiceTestModule();

    const result = await service.preparePublicBookingInquiry(
      makeCreateContactDto({
        phone: undefined,
        eventDate: '2026-09-15',
        location: 'Studio',
      }),
      { serviceIds: [SERVICE_ID] },
    );

    expect(result).toBeNull();
  });

  it('preparePublicBookingInquiry propagates availability rejection', async () => {
    const { service, availability } =
      await createBookingsInquiryServiceTestModule();
    availability.assertDateTimeAllowed.mockRejectedValue(
      new BadRequestException('Date/time not available'),
    );

    await expect(
      service.preparePublicBookingInquiry(
        makeCreateContactDto({
          eventDate: '2026-09-15',
          location: 'Studio',
        }),
        {
          serviceIds: [SERVICE_ID],
          eventTimeStart: '10:00',
          eventTimeEnd: '12:00',
        },
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('createFromPublicBookingInquiry persists booking via real service', async () => {
    const { service, repository } =
      await createBookingsInquiryServiceTestModule();
    const booking = makeBookingWithRelations({
      contactRequestId: 'contact-flow',
    });
    repository.insertPublicInquiryBooking.mockResolvedValue(booking);

    const result = await service.createFromPublicBookingInquiry(
      'contact-flow',
      makeCreateContactDto({
        eventDate: '2026-09-20',
        location: 'Orlando',
      }),
      {
        serviceIds: [SERVICE_ID],
        eventTimeStart: '14:00',
        eventTimeEnd: '16:00',
      },
    );

    expect(result).toEqual(booking);
    expect(repository.insertPublicInquiryBooking).toHaveBeenCalledWith(
      'contact-flow',
      expect.objectContaining({
        serviceId: SERVICE_ID,
        location: 'Orlando',
      }),
      undefined,
    );
  });

  it('createFromPublicBookingInquiry returns null when service unresolved', async () => {
    const { service, repository } =
      await createBookingsInquiryServiceTestModule();

    const result = await service.createFromPublicBookingInquiry(
      'contact-null',
      makeCreateContactDto({
        eventDate: '2026-09-15',
        location: 'Studio',
      }),
      {},
    );

    expect(result).toBeNull();
    expect(repository.insertPublicInquiryBooking).not.toHaveBeenCalled();
  });

  it('preparePublicBookingInquiry propagates duplicate slot from real admin', async () => {
    const { service, repository } =
      await createBookingsInquiryServiceTestModule();
    repository.findActiveSlotsInDayRange.mockResolvedValue([
      {
        id: 'existing-1',
        eventDate: new Date('2026-09-15T14:00:00.000Z'),
        bookingDetails: { eventTimeStart: '10:00', eventTimeEnd: '12:00' },
      },
    ]);

    await expect(
      service.preparePublicBookingInquiry(
        makeCreateContactDto({
          eventDate: '2026-09-15',
          location: 'Studio',
        }),
        {
          serviceIds: [SERVICE_ID],
          eventTimeStart: '10:00',
          eventTimeEnd: '12:00',
        },
      ),
    ).rejects.toThrow(BadRequestException);
  });
});
