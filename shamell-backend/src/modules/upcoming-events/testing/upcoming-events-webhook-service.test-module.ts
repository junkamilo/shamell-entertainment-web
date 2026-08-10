import { Test, type TestingModule } from '@nestjs/testing';
import { MailService } from '../../mail/services/mail.service';
import { AdminPaymentNotifyService } from '../../mail/services/admin-payment-notify.service';
import { createStripeServiceMock } from '../../stripe/__mocks__/stripe.service.mock';
import { StripeService } from '../../stripe/services/stripe.service';
import { createPrismaMock, type PrismaMock } from '../../../testing';
import { createUpcomingEventsRepositoryMock } from '../__mocks__/upcoming-events.repository.mock';
import { UpcomingEventsRepository } from '../services/upcoming-events.repository';
import { UpcomingEventsWebhookService } from '../services/upcoming-events-webhook.service';

export type UpcomingEventsWebhookServiceTestHarness = {
  moduleRef: TestingModule;
  service: UpcomingEventsWebhookService;
  repository: ReturnType<typeof createUpcomingEventsRepositoryMock>;
  prisma: PrismaMock;
  stripe: ReturnType<typeof createStripeServiceMock>;
  mail: { sendTransactional: jest.Mock };
  adminPaymentNotify: { notifyPaymentOutcome: jest.Mock };
};

export async function createUpcomingEventsWebhookServiceTestModule(): Promise<UpcomingEventsWebhookServiceTestHarness> {
  const repository = createUpcomingEventsRepositoryMock();
  const prisma = createPrismaMock();
  const stripe = createStripeServiceMock();
  const mail = {
    sendTransactional: jest.fn().mockResolvedValue({ ok: true }),
  };
  const adminPaymentNotify = {
    notifyPaymentOutcome: jest.fn().mockResolvedValue(undefined),
  };

  repository.asPrisma.mockReturnValue(prisma);
  stripe.client.webhooks.constructEvent = jest.fn();
  stripe.client.checkout.sessions.retrieve = jest.fn();
  stripe.client.paymentIntents = {
    retrieve: jest.fn().mockResolvedValue({
      id: 'pi_test_1',
      payment_method: null,
    }),
  };

  const moduleRef = await Test.createTestingModule({
    providers: [
      UpcomingEventsWebhookService,
      { provide: UpcomingEventsRepository, useValue: repository },
      { provide: StripeService, useValue: stripe },
      { provide: MailService, useValue: mail },
      { provide: AdminPaymentNotifyService, useValue: adminPaymentNotify },
    ],
  }).compile();

  return {
    moduleRef,
    service: moduleRef.get(UpcomingEventsWebhookService),
    repository,
    prisma,
    stripe,
    mail,
    adminPaymentNotify,
  };
}
