import { ConfigService } from '@nestjs/config';
import { Test, type TestingModule } from '@nestjs/testing';
import { createAvailabilityServiceMock } from '../../availability/__mocks__/availability.service.mock';
import { AvailabilityService } from '../../availability/services/availability.service';
import { MailService } from '../../mail/services/mail.service';
import { AdminCustomerActivityNotifyService } from '../../mail/services/admin-customer-activity-notify.service';
import { AdminPaymentNotifyService } from '../../mail/services/admin-payment-notify.service';
import { createBookingsRepositoryMock } from '../__mocks__/bookings.repository.mock';
import { BookingsAdminService } from '../services/bookings-admin.service';
import { BookingsRepository } from '../services/bookings.repository';

export type BookingsAdminServiceTestHarness = {
  moduleRef: TestingModule;
  service: BookingsAdminService;
  repository: ReturnType<typeof createBookingsRepositoryMock>;
  availability: ReturnType<typeof createAvailabilityServiceMock>;
  mail: { sendTransactional: jest.Mock };
  adminActivityNotify: { notifyCustomerActivity: jest.Mock };
  adminPaymentNotify: { notifyPaymentOutcome: jest.Mock };
  config: { get: jest.Mock };
};

export async function createBookingsAdminServiceTestModule(): Promise<BookingsAdminServiceTestHarness> {
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
  repository.findActiveSlotsInDayRange.mockResolvedValue([]);
  repository.findOccupiedBookingsInDayRange.mockResolvedValue([]);
  repository.findServiceById.mockResolvedValue({ id: 'service-1' });
  repository.findServiceIdsExisting.mockImplementation((ids: string[]) =>
    Promise.resolve(ids.map((id) => ({ id }))),
  );
  repository.cancelPendingBookingPayments.mockResolvedValue({ count: 0 });

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

  return {
    moduleRef,
    service: moduleRef.get(BookingsAdminService),
    repository,
    availability,
    mail,
    adminActivityNotify,
    adminPaymentNotify,
    config,
  };
}
