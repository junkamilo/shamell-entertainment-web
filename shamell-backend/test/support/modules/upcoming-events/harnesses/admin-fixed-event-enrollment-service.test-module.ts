import { Test, type TestingModule } from '@nestjs/testing';
import { MailService } from '@app/modules/mail/services/mail.service';
import { AdminPaymentNotifyService } from '@app/modules/mail/services/admin-payment-notify.service';
import { createStripeServiceMock } from '@test-support/modules/stripe/mocks/stripe.service.mock';
import { StripeService } from '@app/modules/stripe/services/stripe.service';
import { createUpcomingEventsRepositoryMock } from '@test-support/modules/upcoming-events/mocks/upcoming-events.repository.mock';
import { UpcomingFixedEventPackagesRepository } from '@app/modules/upcoming-events/packages/upcoming-fixed-event-packages.repository';
import { AdminFixedEventEnrollmentService } from '@app/modules/upcoming-events/services/admin-fixed-event-enrollment.service';
import { UpcomingEventsRepository } from '@app/modules/upcoming-events/services/upcoming-events.repository';

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
