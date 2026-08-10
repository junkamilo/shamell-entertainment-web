import { ConfigService } from '@nestjs/config';
import { Test, type TestingModule } from '@nestjs/testing';
import { createAvailabilityServiceMock } from '../../availability/__mocks__/availability.service.mock';
import { AvailabilityService } from '../../availability/services/availability.service';
import { createBookingsServiceMock } from '../../bookings/__mocks__/bookings.service.mock';
import { BookingsService } from '../../bookings/services/bookings.service';
import { createAdminCustomerActivityNotifyServiceMock } from '../../mail/__mocks__/admin-customer-activity-notify.service.mock';
import { createMailServiceMock } from '../../mail/__mocks__/mail.service.mock';
import { AdminCustomerActivityNotifyService } from '../../mail/services/admin-customer-activity-notify.service';
import { MailService } from '../../mail/services/mail.service';
import { createContactInboxServiceMock } from '../__mocks__/contact-inbox.service.mock';
import { createContactRepositoryMock } from '../__mocks__/contact.repository.mock';
import { ContactInboxService } from '../services/contact-inbox.service';
import { ContactRepository } from '../services/contact.repository';
import { ContactService } from '../services/contact.service';

export type ContactServiceTestHarness = {
  moduleRef: TestingModule;
  service: ContactService;
  repository: ReturnType<typeof createContactRepositoryMock>;
  inbox: ReturnType<typeof createContactInboxServiceMock>;
  availability: ReturnType<typeof createAvailabilityServiceMock>;
  mail: ReturnType<typeof createMailServiceMock>;
  adminActivityNotify: ReturnType<
    typeof createAdminCustomerActivityNotifyServiceMock
  >;
  bookings: ReturnType<typeof createBookingsServiceMock>;
  config: { get: jest.Mock };
};

export async function createContactServiceTestModule(): Promise<ContactServiceTestHarness> {
  const repository = createContactRepositoryMock();
  const inbox = createContactInboxServiceMock();
  const availability = createAvailabilityServiceMock();
  const mail = createMailServiceMock();
  const adminActivityNotify = createAdminCustomerActivityNotifyServiceMock();
  const bookings = createBookingsServiceMock();
  const config = {
    get: jest.fn((key: string) => {
      if (key === 'APP_PUBLIC_NAME') return 'Shamell Entertainment';
      if (key === 'FRONTEND_URL') return 'http://localhost:3000';
      if (key === 'NODE_ENV') return 'test';
      return undefined;
    }),
  };

  availability.bookingTimeZone.mockReturnValue('America/New_York');
  availability.assertDateTimeAllowed.mockResolvedValue(undefined);
  repository.asPrisma.mockReturnValue({});
  repository.findOccasionTypeNamesByIds.mockResolvedValue([]);
  repository.findEventTypeNameById.mockResolvedValue(null);
  mail.sendTransactional.mockResolvedValue({ ok: true });

  const moduleRef = await Test.createTestingModule({
    providers: [
      ContactService,
      { provide: ContactRepository, useValue: repository },
      { provide: AvailabilityService, useValue: availability },
      { provide: MailService, useValue: mail },
      {
        provide: AdminCustomerActivityNotifyService,
        useValue: adminActivityNotify,
      },
      { provide: ConfigService, useValue: config },
      { provide: BookingsService, useValue: bookings },
      { provide: ContactInboxService, useValue: inbox },
    ],
  }).compile();

  return {
    moduleRef,
    service: moduleRef.get(ContactService),
    repository,
    inbox,
    availability,
    mail,
    adminActivityNotify,
    bookings,
    config,
  };
}
