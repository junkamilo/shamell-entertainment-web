import { Test, type TestingModule } from '@nestjs/testing';
import { MailService } from '@app/modules/mail/services/mail.service';
import { AdminPaymentNotifyService } from '@app/modules/mail/services/admin-payment-notify.service';
import { createStripeServiceMock } from '@test-support/modules/stripe/mocks/stripe.service.mock';
import { StripeService } from '@app/modules/stripe/services/stripe.service';
import { createUpcomingEventsRepositoryMock } from '@test-support/modules/upcoming-events/mocks/upcoming-events.repository.mock';
import { AdminClassEnrollmentService } from '@app/modules/upcoming-events/services/admin-class-enrollment.service';
import { UpcomingEventsRepository } from '@app/modules/upcoming-events/services/upcoming-events.repository';
import { UpcomingEventsService } from '@app/modules/upcoming-events/services/upcoming-events.service';

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
    payment_intent: 'pi_admin',
  });
  stripe.client.checkout.sessions.update = jest
    .fn()
    .mockResolvedValue({ id: 'cs_admin' });
  stripe.client.checkout.sessions.retrieve = jest.fn().mockResolvedValue({
    id: 'cs_admin',
    payment_intent: 'pi_admin',
  });
  stripe.client.paymentIntents.update = jest.fn().mockResolvedValue({});
  stripe.client.paymentIntents.search = jest
    .fn()
    .mockResolvedValue({ data: [] });

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
