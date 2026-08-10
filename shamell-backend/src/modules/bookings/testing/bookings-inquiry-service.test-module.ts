import { ConfigService } from '@nestjs/config';
import { Test, type TestingModule } from '@nestjs/testing';
import { createAvailabilityServiceMock } from '../../availability/__mocks__/availability.service.mock';
import { AvailabilityService } from '../../availability/services/availability.service';
import { AdminCustomerActivityNotifyService } from '../../mail/services/admin-customer-activity-notify.service';
import { AdminPaymentNotifyService } from '../../mail/services/admin-payment-notify.service';
import { MailService } from '../../mail/services/mail.service';
import { createBookingsRepositoryMock } from '../__mocks__/bookings.repository.mock';
import { BookingsAdminService } from '../services/bookings-admin.service';
import { BookingsInquiryService } from '../services/bookings-inquiry.service';
import { BookingsRepository } from '../services/bookings.repository';

export type BookingsInquiryServiceTestHarness = {
  moduleRef: TestingModule;
  service: BookingsInquiryService;
  admin: BookingsAdminService;
  repository: ReturnType<typeof createBookingsRepositoryMock>;
  availability: ReturnType<typeof createAvailabilityServiceMock>;
  mail: { sendTransactional: jest.Mock };
};

export async function createBookingsInquiryServiceTestModule(): Promise<BookingsInquiryServiceTestHarness> {
  const repository = createBookingsRepositoryMock();
  const availability = createAvailabilityServiceMock();
  const mail = {
    sendTransactional: jest.fn().mockResolvedValue({ ok: true }),
  };
  const adminActivityNotify = {
    notifyCustomerActivity: jest.fn().mockResolvedValue(undefined),
  };
  const adminPaymentNotify = {
    notifyPaymentOutcome: jest.fn().mockResolvedValue(undefined),
  };
  const config = { get: jest.fn().mockReturnValue(undefined) };

  availability.bookingTimeZone.mockReturnValue('America/New_York');
  availability.assertDateTimeAllowed.mockResolvedValue(undefined);
  repository.asPrisma.mockReturnValue({});
  repository.findActiveSlotsInDayRange.mockResolvedValue([]);
  repository.findOccupiedBookingsInDayRange.mockResolvedValue([]);
  repository.findServiceById.mockResolvedValue({
    id: '11111111-1111-4111-8111-111111111111',
  });
  repository.findServiceIdsExisting.mockImplementation((ids: string[]) =>
    Promise.resolve(ids.map((id) => ({ id }))),
  );

  const moduleRef = await Test.createTestingModule({
    providers: [
      BookingsInquiryService,
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

  return {
    moduleRef,
    service: moduleRef.get(BookingsInquiryService),
    admin: moduleRef.get(BookingsAdminService),
    repository,
    availability,
    mail,
  };
}
