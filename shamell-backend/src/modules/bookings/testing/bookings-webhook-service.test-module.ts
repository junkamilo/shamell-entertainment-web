import { ConfigService } from '@nestjs/config';
import { Test, type TestingModule } from '@nestjs/testing';
import { MailService } from '../../mail/services/mail.service';
import { AdminPaymentNotifyService } from '../../mail/services/admin-payment-notify.service';
import { createStripeServiceMock } from '../../stripe/__mocks__/stripe.service.mock';
import { StripeService } from '../../stripe/services/stripe.service';
import { createBookingsRepositoryMock } from '../__mocks__/bookings.repository.mock';
import { BookingsAdminService } from '../services/bookings-admin.service';
import { BookingsRepository } from '../services/bookings.repository';
import { BookingsWebhookService } from '../services/bookings-webhook.service';

export type BookingsWebhookServiceTestHarness = {
  moduleRef: TestingModule;
  service: BookingsWebhookService;
  repository: ReturnType<typeof createBookingsRepositoryMock>;
  stripe: ReturnType<typeof createStripeServiceMock>;
  mail: { sendTransactional: jest.Mock };
  adminPaymentNotify: { notifyPaymentOutcome: jest.Mock };
  admin: {
    bookingContextLabel: jest.Mock;
    bookingEventDateLabel: jest.Mock;
  };
  config: { get: jest.Mock };
};

export async function createBookingsWebhookServiceTestModule(): Promise<BookingsWebhookServiceTestHarness> {
  const repository = createBookingsRepositoryMock();
  const stripe = createStripeServiceMock();
  const mail = {
    sendTransactional: jest.fn().mockResolvedValue({ ok: true }),
  };
  const adminPaymentNotify = {
    notifyPaymentOutcome: jest.fn().mockResolvedValue(undefined),
  };
  const admin = {
    bookingContextLabel: jest.fn().mockReturnValue('Booking context'),
    bookingEventDateLabel: jest.fn().mockReturnValue('Aug 15, 2026'),
  };
  const config = { get: jest.fn().mockReturnValue(undefined) };

  stripe.client.webhooks.constructEvent = jest.fn();

  const moduleRef = await Test.createTestingModule({
    providers: [
      BookingsWebhookService,
      { provide: BookingsRepository, useValue: repository },
      { provide: MailService, useValue: mail },
      { provide: AdminPaymentNotifyService, useValue: adminPaymentNotify },
      { provide: ConfigService, useValue: config },
      { provide: StripeService, useValue: stripe },
      { provide: BookingsAdminService, useValue: admin },
    ],
  }).compile();

  return {
    moduleRef,
    service: moduleRef.get(BookingsWebhookService),
    repository,
    stripe,
    mail,
    adminPaymentNotify,
    admin,
    config,
  };
}
