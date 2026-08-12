import { ConfigService } from '@nestjs/config';
import { Test, type TestingModule } from '@nestjs/testing';
import { MailService } from '../../mail/services/mail.service';
import { AdminCustomerActivityNotifyService } from '../../mail/services/admin-customer-activity-notify.service';
import { createStripeServiceMock } from '../../stripe/__mocks__/stripe.service.mock';
import { StripeService } from '../../stripe/services/stripe.service';
import { createBookingsRepositoryMock } from '../__mocks__/bookings.repository.mock';
import { BookingsAdminService } from '../services/bookings-admin.service';
import { BookingsQuoteService } from '../services/bookings-quote.service';
import { BookingsRepository } from '../services/bookings.repository';
import { BookingsWebhookService } from '../services/bookings-webhook.service';

export type BookingsQuoteServiceTestHarness = {
  moduleRef: TestingModule;
  service: BookingsQuoteService;
  repository: ReturnType<typeof createBookingsRepositoryMock>;
  stripe: ReturnType<typeof createStripeServiceMock>;
  admin: {
    findOneAdmin: jest.Mock;
    bookingContextLabel: jest.Mock;
  };
  mail: { sendTransactional: jest.Mock };
  adminActivityNotify: { notifyCustomerActivity: jest.Mock };
  webhook: {
    markBookingPaymentPaid: jest.Mock;
    parseStripeCheckoutSession: jest.Mock;
  };
  config: { get: jest.Mock };
};

export async function createBookingsQuoteServiceTestModule(): Promise<BookingsQuoteServiceTestHarness> {
  const repository = createBookingsRepositoryMock();
  const stripe = createStripeServiceMock();
  const admin = {
    findOneAdmin: jest.fn(),
    bookingContextLabel: jest.fn().mockReturnValue('Booking'),
  };
  const mail = {
    sendTransactional: jest.fn().mockResolvedValue({ ok: true }),
  };
  const adminActivityNotify = {
    notifyCustomerActivity: jest.fn().mockResolvedValue(undefined),
  };
  const webhook = {
    markBookingPaymentPaid: jest.fn().mockResolvedValue(undefined),
    parseStripeCheckoutSession: jest.fn((x: unknown) => x),
  };
  const config = { get: jest.fn().mockReturnValue(undefined) };

  stripe.client.checkout.sessions.create = jest.fn().mockResolvedValue({
    id: 'cs_quote_1',
    client_secret: 'cs_secret_1',
    payment_intent: 'pi_quote_1',
  });
  stripe.client.checkout.sessions.retrieve = jest.fn().mockResolvedValue({
    id: 'cs_quote_1',
    status: 'open',
    client_secret: 'cs_secret_1',
    payment_status: 'unpaid',
  });
  stripe.client.paymentIntents.update = jest.fn().mockResolvedValue({});
  stripe.client.paymentIntents.search = jest
    .fn()
    .mockResolvedValue({ data: [] });

  repository.createBookingQuote.mockResolvedValue({ id: 'quote-1' });
  repository.createBookingPayment.mockResolvedValue({
    id: 'payment-1',
    stripeCheckoutSessionId: 'cs_quote_1',
  });
  repository.cancelPendingBookingPayments.mockResolvedValue({ count: 0 });
  repository.updateBooking.mockResolvedValue(undefined);
  repository.updateBookingQuote.mockResolvedValue(undefined);
  repository.updateBookingPayment.mockResolvedValue(undefined);

  const moduleRef = await Test.createTestingModule({
    providers: [
      BookingsQuoteService,
      { provide: BookingsRepository, useValue: repository },
      { provide: MailService, useValue: mail },
      {
        provide: AdminCustomerActivityNotifyService,
        useValue: adminActivityNotify,
      },
      { provide: ConfigService, useValue: config },
      { provide: StripeService, useValue: stripe },
      { provide: BookingsAdminService, useValue: admin },
      { provide: BookingsWebhookService, useValue: webhook },
    ],
  }).compile();

  return {
    moduleRef,
    service: moduleRef.get(BookingsQuoteService),
    repository,
    stripe,
    admin,
    mail,
    adminActivityNotify,
    webhook,
    config,
  };
}
