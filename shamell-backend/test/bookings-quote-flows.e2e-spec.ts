import type { INestApplication } from '@nestjs/common';
import {
  BookingPaymentStatus,
  BookingQuotePaymentModel,
  BookingQuoteStatus,
} from '@prisma/client';
import request from 'supertest';
import type { App } from 'supertest/types';
import { createBookingsServiceMock } from '../src/modules/bookings/__mocks__/bookings.service.mock';
import {
  makeActiveQuoteRow,
  makeBookingWithRelations,
  makePendingQuotePayment,
} from '../src/modules/bookings/__mocks__/bookings.fixtures';
import { createBookingsHttpApp } from '../src/modules/bookings/testing/bookings-http-app';
import { createBookingsQuoteServiceTestModule } from '../src/modules/bookings/testing/bookings-quote-service.test-module';
import type {
  ErrorBody,
  QuoteCheckoutBody,
  QuoteCreatedBody,
  QuoteSessionStatusBody,
} from '../src/modules/bookings/testing/bookings.test-types';

const BOOKING_ID = '11111111-1111-4111-8111-111111111111';

type DeepHarness = {
  app: INestApplication<App>;
  repository: Awaited<
    ReturnType<typeof createBookingsQuoteServiceTestModule>
  >['repository'];
  stripe: Awaited<
    ReturnType<typeof createBookingsQuoteServiceTestModule>
  >['stripe'];
  admin: Awaited<
    ReturnType<typeof createBookingsQuoteServiceTestModule>
  >['admin'];
  webhook: Awaited<
    ReturnType<typeof createBookingsQuoteServiceTestModule>
  >['webhook'];
};

async function createDeepBookingsQuoteHttpApp(): Promise<DeepHarness> {
  const harness = await createBookingsQuoteServiceTestModule();
  const bookingsService = {
    ...createBookingsServiceMock(),
    createBookingQuote: (
      adminUserId: string,
      bookingId: string,
      dto: unknown,
    ) =>
      harness.service.createBookingQuote(
        adminUserId,
        bookingId,
        dto as Parameters<typeof harness.service.createBookingQuote>[2],
      ),
    resolveQuoteCheckoutClientSecret: (token: string) =>
      harness.service.resolveQuoteCheckoutClientSecret(token),
    getQuotePaymentSessionStatus: (sessionId: string) =>
      harness.service.getQuotePaymentSessionStatus(sessionId),
    resolveQuotePayUrl: (token: string) =>
      harness.service.resolveQuotePayUrl(token),
    sendBookingBalanceLink: (
      adminUserId: string,
      bookingId: string,
      dto: unknown,
    ) =>
      harness.service.sendBookingBalanceLink(
        adminUserId,
        bookingId,
        dto as Parameters<typeof harness.service.sendBookingBalanceLink>[2],
      ),
  };

  const { app } = await createBookingsHttpApp({
    guardsAllow: true,
    bookingsService,
  });

  return {
    app,
    repository: harness.repository,
    stripe: harness.stripe,
    admin: harness.admin,
    webhook: harness.webhook,
  };
}

describe('Bookings quote flows (deep e2e)', () => {
  let app: INestApplication<App>;
  let repository: DeepHarness['repository'];
  let stripe: DeepHarness['stripe'];
  let admin: DeepHarness['admin'];
  let webhook: DeepHarness['webhook'];

  afterEach(async () => {
    await app.close();
  });

  async function boot() {
    const created = await createDeepBookingsQuoteHttpApp();
    app = created.app;
    repository = created.repository;
    stripe = created.stripe;
    admin = created.admin;
    webhook = created.webhook;
  }

  it('POST /admin/:id/quote creates FULL quote via real service', async () => {
    await boot();
    admin.findOneAdmin.mockResolvedValue(
      makeBookingWithRelations({ id: BOOKING_ID }),
    );

    const res = await request(app.getHttpServer())
      .post(`/api/v1/bookings/admin/${BOOKING_ID}/quote`)
      .send({
        paymentModel: BookingQuotePaymentModel.FULL,
        totalAmount: 500,
      })
      .expect(201);

    const body = res.body as QuoteCreatedBody;
    expect(body.quoteId).toBe('quote-1');
    expect(body.paymentId).toBe('payment-1');
    expect(repository.createBookingQuote).toHaveBeenCalled();
  });

  it('GET /public/quote/checkout returns clientSecret for open session', async () => {
    await boot();
    repository.findActiveQuoteByTokenHash.mockResolvedValue(
      makeActiveQuoteRow({ bookingId: BOOKING_ID }),
    );
    repository.findBookingWithUser.mockResolvedValue(
      makeBookingWithRelations({ id: BOOKING_ID }),
    );
    repository.findPendingPaymentByQuoteId.mockResolvedValue(
      makePendingQuotePayment({ bookingId: BOOKING_ID }),
    );
    stripe.client.checkout.sessions.retrieve = jest.fn().mockResolvedValue({
      id: 'cs_quote_open',
      status: 'open',
      client_secret: 'cs_open_secret',
      payment_status: 'unpaid',
    });

    const res = await request(app.getHttpServer())
      .get('/api/v1/bookings/public/quote/checkout')
      .query({ token: 'raw-token' })
      .expect(200);

    const body = res.body as QuoteCheckoutBody;
    expect(body.clientSecret).toBe('cs_open_secret');
  });

  it('GET /public/quote/checkout expired token returns 400', async () => {
    await boot();
    repository.findActiveQuoteByTokenHash.mockResolvedValue(
      makeActiveQuoteRow({
        tokenExpiresAt: new Date(Date.now() - 60_000),
      }),
    );

    const res = await request(app.getHttpServer())
      .get('/api/v1/bookings/public/quote/checkout')
      .query({ token: 'expired-token' })
      .expect(400);

    const body = res.body as ErrorBody;
    expect(body.statusCode).toBe(400);
    expect(repository.updateBookingQuote).toHaveBeenCalledWith(
      'quote-1',
      expect.objectContaining({
        status: BookingQuoteStatus.EXPIRED,
      }),
    );
  });

  it('GET /public/quote/checkout reissues when Stripe session expired', async () => {
    await boot();
    repository.findActiveQuoteByTokenHash.mockResolvedValue(
      makeActiveQuoteRow({ bookingId: BOOKING_ID }),
    );
    repository.findBookingWithUser.mockResolvedValue(
      makeBookingWithRelations({ id: BOOKING_ID }),
    );
    repository.findPendingPaymentByQuoteId.mockResolvedValue(
      makePendingQuotePayment({
        id: 'payment-old',
        bookingId: BOOKING_ID,
        stripeCheckoutSessionId: 'cs_expired',
      }),
    );
    stripe.client.checkout.sessions.retrieve = jest
      .fn()
      .mockResolvedValueOnce({
        id: 'cs_expired',
        status: 'expired',
        payment_status: 'unpaid',
        client_secret: null,
      })
      .mockResolvedValueOnce({
        id: 'cs_reissued',
        status: 'open',
        client_secret: 'cs_reissued_secret',
        payment_status: 'unpaid',
      });
    stripe.client.checkout.sessions.create = jest.fn().mockResolvedValue({
      id: 'cs_reissued',
      client_secret: 'cs_reissued_secret',
    });
    repository.createBookingPayment.mockResolvedValue({
      id: 'payment-reissued',
      stripeCheckoutSessionId: 'cs_reissued',
    });

    const res = await request(app.getHttpServer())
      .get('/api/v1/bookings/public/quote/checkout')
      .query({ token: 'raw-token' })
      .expect(200);

    const body = res.body as QuoteCheckoutBody;
    expect(body.clientSecret).toBe('cs_reissued_secret');
  });

  it('GET /public/quote/session-status reconciles paid PENDING payment', async () => {
    await boot();
    const payment = makePendingQuotePayment({
      bookingId: BOOKING_ID,
      status: BookingPaymentStatus.PENDING,
      stripeCheckoutSessionId: 'cs_complete',
    });
    repository.findPaymentByCheckoutSessionId
      .mockResolvedValueOnce(payment)
      .mockResolvedValueOnce({
        ...payment,
        status: BookingPaymentStatus.PAID,
      });
    stripe.client.checkout.sessions.retrieve = jest.fn().mockResolvedValue({
      id: 'cs_complete',
      status: 'complete',
      payment_status: 'paid',
    });

    const res = await request(app.getHttpServer())
      .get('/api/v1/bookings/public/quote/session-status')
      .query({ session_id: 'cs_complete' })
      .expect(200);

    const body = res.body as QuoteSessionStatusBody;
    expect(body.stripeStatus).toBe('complete');
    expect(webhook.markBookingPaymentPaid).toHaveBeenCalled();
  });
});
