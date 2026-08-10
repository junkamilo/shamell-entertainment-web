import { Test, type TestingModule } from '@nestjs/testing';
import { MailService } from '../../mail/services/mail.service';
import { AdminPaymentNotifyService } from '../../mail/services/admin-payment-notify.service';
import { createStripeServiceMock } from '../../stripe/__mocks__/stripe.service.mock';
import { StripeService } from '../../stripe/services/stripe.service';
import { createUpcomingEventsRepositoryMock } from '../__mocks__/upcoming-events.repository.mock';
import { AdminClassEnrollmentService } from '../services/admin-class-enrollment.service';
import { UpcomingEventsRepository } from '../services/upcoming-events.repository';
import { UpcomingEventsService } from '../services/upcoming-events.service';

export type AdminClassEnrollmentServiceTestHarness = {
  moduleRef: TestingModule;
  service: AdminClassEnrollmentService;
  repository: ReturnType<typeof createUpcomingEventsRepositoryMock>;
  stripe: ReturnType<typeof createStripeServiceMock>;
  mail: { sendTransactional: jest.Mock };
  adminPaymentNotify: { notifyPaymentOutcome: jest.Mock };
};

export async function createAdminClassEnrollmentServiceTestModule(): Promise<AdminClassEnrollmentServiceTestHarness> {
  const repository = createUpcomingEventsRepositoryMock();
  const stripe = createStripeServiceMock();
  const mail = {
    sendTransactional: jest.fn().mockResolvedValue({ ok: true }),
  };
  const adminPaymentNotify = {
    notifyPaymentOutcome: jest.fn().mockResolvedValue(undefined),
  };

  stripe.client.checkout.sessions.create = jest.fn().mockResolvedValue({
    id: 'cs_admin',
    client_secret: 'cs_admin_secret',
  });
  stripe.client.checkout.sessions.update = jest
    .fn()
    .mockResolvedValue({ id: 'cs_admin' });
  stripe.client.checkout.sessions.retrieve = jest.fn();

  const moduleRef = await Test.createTestingModule({
    providers: [
      AdminClassEnrollmentService,
      { provide: UpcomingEventsRepository, useValue: repository },
      { provide: StripeService, useValue: stripe },
      { provide: MailService, useValue: mail },
      { provide: AdminPaymentNotifyService, useValue: adminPaymentNotify },
      { provide: UpcomingEventsService, useValue: {} },
    ],
  }).compile();

  return {
    moduleRef,
    service: moduleRef.get(AdminClassEnrollmentService),
    repository,
    stripe,
    mail,
    adminPaymentNotify,
  };
}
