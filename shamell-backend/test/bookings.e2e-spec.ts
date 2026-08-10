import { BadRequestException } from '@nestjs/common';
import type { INestApplication } from '@nestjs/common';
import { BookingStatus } from '@prisma/client';
import request from 'supertest';
import type { App } from 'supertest/types';
import { REQUEST_ID_HEADER } from '../src/common/http/constants/http-headers.constants';
import { createBookingsServiceMock } from '../src/modules/bookings/__mocks__/bookings.service.mock';
import {
  ADMIN_BOOKING_GUEST_DTO,
  makeBookingWithRelations,
  makeConfirmedBooking,
} from '../src/modules/bookings/__mocks__/bookings.fixtures';
import { createBookingsHttpApp } from '../src/modules/bookings/testing/bookings-http-app';
import type {
  AdminBookingBody,
  AdminBookingListBody,
  AdminCalendarBody,
  BalanceLinkBody,
  DeprecatedWebhookBody,
  ErrorBody,
  OccupiedBody,
  PrivateClassCashBody,
  PrivateClassCheckoutBody,
  QuoteCheckoutBody,
  QuoteCreatedBody,
  QuoteSessionStatusBody,
  RemoveAdminBody,
} from '../src/modules/bookings/testing/bookings.test-types';

const BOOKING_ID = '11111111-1111-4111-8111-111111111111';

describe('Bookings (contract e2e)', () => {
  let app: INestApplication<App>;
  const bookingsService = createBookingsServiceMock();

  afterEach(async () => {
    await app.close();
  });

  describe('admin routes without JWT (guardsAllow: false)', () => {
    beforeEach(async () => {
      const created = await createBookingsHttpApp({
        guardsAllow: false,
        bookingsService,
      });
      app = created.app;
    });

    it('GET /admin returns 401 or 403', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/bookings/admin')
        .expect((response) => {
          expect([401, 403]).toContain(response.status);
        });
      const body = res.body as ErrorBody;
      expect(body.statusCode).toBe(res.status);
    });

    it('POST /admin returns 401 or 403', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/bookings/admin')
        .send(ADMIN_BOOKING_GUEST_DTO)
        .expect((response) => {
          expect([401, 403]).toContain(response.status);
        });
    });

    it('PATCH /admin/:id returns 401 or 403', async () => {
      await request(app.getHttpServer())
        .patch(`/api/v1/bookings/admin/${BOOKING_ID}`)
        .send({ status: BookingStatus.CONFIRMED })
        .expect((response) => {
          expect([401, 403]).toContain(response.status);
        });
    });

    it('DELETE /admin/:id returns 401 or 403', async () => {
      await request(app.getHttpServer())
        .delete(`/api/v1/bookings/admin/${BOOKING_ID}`)
        .expect((response) => {
          expect([401, 403]).toContain(response.status);
        });
    });

    it('POST /admin/:id/send-balance-link returns 401 or 403', async () => {
      await request(app.getHttpServer())
        .post(`/api/v1/bookings/admin/${BOOKING_ID}/send-balance-link`)
        .send({})
        .expect((response) => {
          expect([401, 403]).toContain(response.status);
        });
    });
  });

  describe('admin + public with JWT (guardsAllow: true)', () => {
    beforeEach(async () => {
      jest.clearAllMocks();
      const created = await createBookingsHttpApp({
        guardsAllow: true,
        bookingsService,
      });
      app = created.app;
    });

    it('GET /admin returns typed list', async () => {
      bookingsService.findAllAdmin.mockResolvedValue({
        items: [makeBookingWithRelations({ id: BOOKING_ID })],
        meta: {
          page: 1,
          perPage: 10,
          totalItems: 1,
          totalPages: 1,
          hasPrev: false,
          hasNext: false,
        },
      });
      const res = await request(app.getHttpServer())
        .get('/api/v1/bookings/admin')
        .expect(200);
      const body = res.body as AdminBookingListBody;
      expect(body.items[0]?.id).toBe(BOOKING_ID);
      expect(body.meta.totalItems).toBe(1);
    });

    it('POST /admin returns created booking', async () => {
      bookingsService.createAdminBooking.mockResolvedValue(
        makeBookingWithRelations({ id: BOOKING_ID }),
      );
      const res = await request(app.getHttpServer())
        .post('/api/v1/bookings/admin')
        .send(ADMIN_BOOKING_GUEST_DTO)
        .expect(201);
      const body = res.body as AdminBookingBody;
      expect(body.id).toBe(BOOKING_ID);
      expect(body.status).toBe(BookingStatus.PENDING);
    });

    it('PATCH /admin/:id CONFIRMED returns updated booking', async () => {
      bookingsService.updateAdmin.mockResolvedValue(
        makeConfirmedBooking({ id: BOOKING_ID }),
      );
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/bookings/admin/${BOOKING_ID}`)
        .send({ status: BookingStatus.CONFIRMED })
        .expect(200);
      const body = res.body as AdminBookingBody;
      expect(body.status).toBe(BookingStatus.CONFIRMED);
    });

    it('PATCH /admin/:id CANCELLED returns cancelled booking', async () => {
      bookingsService.updateAdmin.mockResolvedValue(
        makeBookingWithRelations({
          id: BOOKING_ID,
          status: BookingStatus.CANCELLED,
        }),
      );
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/bookings/admin/${BOOKING_ID}`)
        .send({ status: BookingStatus.CANCELLED })
        .expect(200);
      const body = res.body as AdminBookingBody;
      expect(body.status).toBe(BookingStatus.CANCELLED);
    });

    it('DELETE /admin/:id returns ok', async () => {
      bookingsService.removeAdmin.mockResolvedValue({ ok: true });
      const res = await request(app.getHttpServer())
        .delete(`/api/v1/bookings/admin/${BOOKING_ID}`)
        .expect(200);
      const body = res.body as RemoveAdminBody;
      expect(body.ok).toBe(true);
    });

    it('GET /public/occupied returns typed payload', async () => {
      bookingsService.getPublicOccupiedByDate.mockResolvedValue({
        date: '2026-07-15',
        occupied: [{ startMinutes: 600, endMinutes: 720 }],
      });
      const res = await request(app.getHttpServer())
        .get('/api/v1/bookings/public/occupied')
        .query({ date: '2026-07-15' })
        .expect(200);
      const body = res.body as OccupiedBody;
      expect(body.date).toBe('2026-07-15');
      expect(body.occupied).toHaveLength(1);
    });

    it('POST /admin/:id/quote BadRequest returns typed error + x-request-id', async () => {
      bookingsService.createBookingQuote.mockRejectedValue(
        new BadRequestException('Invalid total amount.'),
      );
      const res = await request(app.getHttpServer())
        .post(`/api/v1/bookings/admin/${BOOKING_ID}/quote`)
        .send({ paymentModel: 'FULL', totalAmount: 0 })
        .expect(400);
      const body = res.body as ErrorBody;
      expect(body.statusCode).toBe(400);
      expect(res.headers[REQUEST_ID_HEADER]).toBeTruthy();
    });

    it('POST /admin/:id/quote success returns typed quote body', async () => {
      bookingsService.createBookingQuote.mockResolvedValue({
        message: 'Payment link sent successfully.',
        quoteId: 'quote-1',
        paymentId: 'payment-1',
        checkoutSessionId: 'cs_1',
        quoteExpiresAt: new Date().toISOString(),
      } satisfies QuoteCreatedBody);
      const res = await request(app.getHttpServer())
        .post(`/api/v1/bookings/admin/${BOOKING_ID}/quote`)
        .send({ paymentModel: 'FULL', totalAmount: 500 })
        .expect(201);
      const body = res.body as QuoteCreatedBody;
      expect(body.quoteId).toBe('quote-1');
      expect(body.paymentId).toBe('payment-1');
    });

    it('POST /admin/:id/send-balance-link returns typed body', async () => {
      bookingsService.sendBookingBalanceLink.mockResolvedValue({
        message: 'Balance payment link sent successfully.',
        paymentId: 'payment-balance',
        payUrl: 'https://example.com/pay/quote?token=bal',
      } satisfies BalanceLinkBody);
      const res = await request(app.getHttpServer())
        .post(`/api/v1/bookings/admin/${BOOKING_ID}/send-balance-link`)
        .send({})
        .expect(201);
      const body = res.body as BalanceLinkBody;
      expect(body.paymentId).toBe('payment-balance');
      expect(body.payUrl).toContain('/pay/quote');
    });

    it('GET /public/quote/pay redirects to frontend pay URL', async () => {
      bookingsService.resolveQuotePayUrl.mockReturnValue(
        'https://example.com/pay/quote?token=abc',
      );
      const res = await request(app.getHttpServer())
        .get('/api/v1/bookings/public/quote/pay')
        .query({ token: 'abc' })
        .expect((response) => {
          expect([301, 302]).toContain(response.status);
        });
      expect(res.headers.location).toContain('/pay/quote?token=abc');
    });

    it('GET /public/quote/checkout returns clientSecret', async () => {
      bookingsService.resolveQuoteCheckoutClientSecret.mockResolvedValue(
        'cs_test_secret',
      );
      const res = await request(app.getHttpServer())
        .get('/api/v1/bookings/public/quote/checkout')
        .query({ token: 'tok' })
        .expect(200);
      const body = res.body as QuoteCheckoutBody;
      expect(body.clientSecret).toBe('cs_test_secret');
    });

    it('GET /public/quote/checkout BadRequest includes x-request-id', async () => {
      bookingsService.resolveQuoteCheckoutClientSecret.mockRejectedValue(
        new BadRequestException('Quote has expired.'),
      );
      const res = await request(app.getHttpServer())
        .get('/api/v1/bookings/public/quote/checkout')
        .query({ token: 'expired' })
        .expect(400);
      const body = res.body as ErrorBody;
      expect(body.statusCode).toBe(400);
      expect(res.headers[REQUEST_ID_HEADER]).toBeTruthy();
    });

    it('GET /public/quote/session-status returns typed status', async () => {
      bookingsService.getQuotePaymentSessionStatus.mockResolvedValue({
        stripeStatus: 'open',
        paymentStatus: 'PENDING',
        stage: 'FULL',
        amount: 500,
        currency: 'usd',
        customerName: 'A***',
        customerEmail: 'a***@example.com',
      } satisfies QuoteSessionStatusBody);
      const res = await request(app.getHttpServer())
        .get('/api/v1/bookings/public/quote/session-status')
        .query({ session_id: 'cs_open' })
        .expect(200);
      const body = res.body as QuoteSessionStatusBody;
      expect(body.stripeStatus).toBe('open');
      expect(body.amount).toBe(500);
    });

    it('GET /admin/calendar returns AdminCalendarBody', async () => {
      bookingsService.findCalendarAdmin.mockResolvedValue({
        items: [
          {
            id: BOOKING_ID,
            eventDate: '2026-08-15T18:00:00.000Z',
            status: 'CONFIRMED',
          },
        ],
      });
      const res = await request(app.getHttpServer())
        .get('/api/v1/bookings/admin/calendar')
        .query({ from: '2026-08-01', to: '2026-08-31' })
        .expect(200);
      const body = res.body as AdminCalendarBody;
      expect(body.items[0]?.id).toBe(BOOKING_ID);
    });

    it('GET /admin/:id returns AdminBookingBody', async () => {
      bookingsService.findOneAdmin.mockResolvedValue(
        makeBookingWithRelations({ id: BOOKING_ID }),
      );
      const res = await request(app.getHttpServer())
        .get(`/api/v1/bookings/admin/${BOOKING_ID}`)
        .expect(200);
      const body = res.body as AdminBookingBody;
      expect(body.id).toBe(BOOKING_ID);
    });

    it('POST /admin/private-class/cash returns typed booking', async () => {
      bookingsService.createPrivateClassCash.mockResolvedValue(
        makeBookingWithRelations({ id: BOOKING_ID }),
      );
      const res = await request(app.getHttpServer())
        .post('/api/v1/bookings/admin/private-class/cash')
        .send({
          ...ADMIN_BOOKING_GUEST_DTO,
          eventDate: '2026-08-15T18:00:00.000Z',
        })
        .expect(201);
      const body = res.body as PrivateClassCashBody;
      expect(body.id).toBe(BOOKING_ID);
    });

    it('POST /admin/private-class/checkout-session returns payUrl', async () => {
      bookingsService.createPrivateClassCheckoutSession.mockResolvedValue({
        bookingId: BOOKING_ID,
        payUrl: 'https://checkout.stripe.com/c/pay/cs_pc',
        message: 'Payment link sent.',
      });
      const res = await request(app.getHttpServer())
        .post('/api/v1/bookings/admin/private-class/checkout-session')
        .send({
          ...ADMIN_BOOKING_GUEST_DTO,
          eventDate: '2026-08-15T18:00:00.000Z',
        })
        .expect(201);
      const body = res.body as PrivateClassCheckoutBody;
      expect(body.bookingId).toBe(BOOKING_ID);
      expect(body.payUrl).toContain('http');
    });

    it('POST /public/quote/reconcile returns QuoteSessionStatusBody', async () => {
      bookingsService.getQuotePaymentSessionStatus.mockResolvedValue({
        stripeStatus: 'complete',
        paymentStatus: 'PAID',
        stage: 'FULL',
        amount: 500,
        currency: 'usd',
        customerName: 'A***',
        customerEmail: 'a***@example.com',
      } satisfies QuoteSessionStatusBody);
      const res = await request(app.getHttpServer())
        .post('/api/v1/bookings/public/quote/reconcile')
        .query({ session_id: 'cs_paid' })
        .expect(200);
      const body = res.body as QuoteSessionStatusBody;
      expect(body.paymentStatus).toBe('PAID');
    });

    it('POST /public/quote/reconcile without session_id returns 400', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/bookings/public/quote/reconcile')
        .expect(400);
      const body = res.body as ErrorBody;
      expect(body.message).toBe('session_id is required.');
    });

    it('POST /public/webhook returns deprecated 410 body', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/bookings/public/webhook')
        .expect(410);
      const body = res.body as DeprecatedWebhookBody;
      expect(body.deprecated).toBe(true);
      expect(body.message).toContain('/api/v1/stripe/webhook');
    });
  });
});
