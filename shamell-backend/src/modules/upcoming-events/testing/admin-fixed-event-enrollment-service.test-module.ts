import { Test, type TestingModule } from '@nestjs/testing';
import { MailService } from '../../mail/services/mail.service';
import { AdminPaymentNotifyService } from '../../mail/services/admin-payment-notify.service';
import { createStripeServiceMock } from '../../stripe/__mocks__/stripe.service.mock';
import { StripeService } from '../../stripe/services/stripe.service';
import { createUpcomingEventsRepositoryMock } from '../__mocks__/upcoming-events.repository.mock';
import { UpcomingFixedEventPackagesRepository } from '../packages/upcoming-fixed-event-packages.repository';
import { AdminFixedEventEnrollmentService } from '../services/admin-fixed-event-enrollment.service';
import { UpcomingEventsRepository } from '../services/upcoming-events.repository';

export type AdminFixedEventEnrollmentServiceTestHarness = {
  moduleRef: TestingModule;
  service: AdminFixedEventEnrollmentService;
  repository: ReturnType<typeof createUpcomingEventsRepositoryMock>;
  packagesRepository: {
    findPackageById: jest.Mock;
    listPackagesByEvent: jest.Mock;
    minActivePackagePriceCents: jest.Mock;
    countActivePackagesByEvent: jest.Mock;
  };
  stripe: ReturnType<typeof createStripeServiceMock>;
  mail: { sendTransactional: jest.Mock };
  adminPaymentNotify: { notifyPaymentOutcome: jest.Mock };
};

export async function createAdminFixedEventEnrollmentServiceTestModule(): Promise<AdminFixedEventEnrollmentServiceTestHarness> {
  const repository = createUpcomingEventsRepositoryMock();
  const packagesRepository = {
    findPackageById: jest.fn(),
    listPackagesByEvent: jest.fn().mockResolvedValue([]),
    minActivePackagePriceCents: jest.fn().mockResolvedValue(null),
    countActivePackagesByEvent: jest.fn().mockResolvedValue(0),
  };
  const stripe = createStripeServiceMock();
  const mail = {
    sendTransactional: jest.fn().mockResolvedValue({ ok: true }),
  };
  const adminPaymentNotify = {
    notifyPaymentOutcome: jest.fn().mockResolvedValue(undefined),
  };

  stripe.client.checkout.sessions.create = jest.fn().mockResolvedValue({
    id: 'cs_fixed_admin',
    url: 'https://checkout.stripe.com/c/pay/cs_fixed_admin',
  });
  stripe.client.checkout.sessions.update = jest
    .fn()
    .mockResolvedValue({ id: 'cs_fixed_admin' });
  stripe.client.checkout.sessions.retrieve = jest.fn();

  const moduleRef = await Test.createTestingModule({
    providers: [
      AdminFixedEventEnrollmentService,
      { provide: UpcomingEventsRepository, useValue: repository },
      {
        provide: UpcomingFixedEventPackagesRepository,
        useValue: packagesRepository,
      },
      { provide: StripeService, useValue: stripe },
      { provide: MailService, useValue: mail },
      { provide: AdminPaymentNotifyService, useValue: adminPaymentNotify },
    ],
  }).compile();

  return {
    moduleRef,
    service: moduleRef.get(AdminFixedEventEnrollmentService),
    repository,
    packagesRepository,
    stripe,
    mail,
    adminPaymentNotify,
  };
}
