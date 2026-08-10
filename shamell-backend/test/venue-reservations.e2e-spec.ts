import { BadRequestException } from '@nestjs/common';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types';
import { REQUEST_ID_HEADER } from '../src/common/http/constants/http-headers.constants';
import { createVenueReservationsServiceMock } from '../src/modules/venue-reservations/__mocks__/venue-reservations.service.mock';
import { createVenueReservationsHttpApp } from '../src/modules/venue-reservations/testing/venue-reservations-http-app';
import type {
  AdminCashReservationBody,
  AdminCheckoutPayLinkBody,
  AdminListBody,
  AvailabilityBody,
  CancelReservationBody,
  CheckoutSessionCreatedBody,
  ErrorBody,
  PayCheckoutClientSecretBody,
  ResendConfirmationBody,
  SessionStatusBody,
  WebhookDispatchBody,
} from '../src/modules/venue-reservations/testing/venue-reservations.test-types';

const EVENT_ID = '11111111-1111-4111-8111-111111111111';
const LAYOUT_ITEM_ID = '22222222-2222-4222-8222-222222222222';
const TABLE_CONFIG_ID = '33333333-3333-4333-8333-333333333333';
const CANCEL_RESERVATION_ID = '11111111-1111-1111-1111-111111111111';

const checkoutDto = {
  kind: 'catalog_table' as const,
  layoutItemId: LAYOUT_ITEM_ID,
  venueTableConfigId: TABLE_CONFIG_ID,
  upcomingEventId: EVENT_ID,
  customerName: 'Guest User',
  customerEmail: 'guest@example.com',
};

describe('VenueReservations (contract e2e)', () => {
  let app: INestApplication<App>;
  const venueReservationsService = createVenueReservationsServiceMock();
  const stripeWebhookDispatch = {
    handle: jest.fn((_raw: Buffer, signature?: string) => {
      if (!signature) {
        throw new BadRequestException('Missing stripe-signature header.');
      }
      return Promise.resolve({ received: true });
    }),
  };

  afterEach(async () => {
    await app.close();
  });

  describe('admin routes without JWT (guardsAllow: false)', () => {
    beforeEach(async () => {
      const created = await createVenueReservationsHttpApp({
        guardsAllow: false,
        venueReservationsService,
      });
      app = created.app;
    });

    it('GET /admin returns 401 or 403', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/venue-reservations/admin')
        .expect((response) => {
          expect([401, 403]).toContain(response.status);
        });

      const body = res.body as ErrorBody;
      expect(body.statusCode).toBe(res.status);
    });

    it('PATCH /admin/:id/cancel returns 401 or 403', async () => {
      await request(app.getHttpServer())
        .patch(
          `/api/v1/venue-reservations/admin/${CANCEL_RESERVATION_ID}/cancel`,
        )
        .expect((response) => {
          expect([401, 403]).toContain(response.status);
        });
    });

    it('POST /admin/cash returns 401 or 403', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/venue-reservations/admin/cash')
        .send(checkoutDto)
        .expect((response) => {
          expect([401, 403]).toContain(response.status);
        });
    });

    it('POST /admin/checkout-session returns 401 or 403', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/venue-reservations/admin/checkout-session')
        .send(checkoutDto)
        .expect((response) => {
          expect([401, 403]).toContain(response.status);
        });
    });
  });

  describe('admin routes with guard allow', () => {
    beforeEach(async () => {
      jest.clearAllMocks();
      venueReservationsService.listAdminReservations.mockResolvedValue({
        items: [{ id: CANCEL_RESERVATION_ID, status: 'PENDING_PAYMENT' }],
        meta: { page: 1, perPage: 10, total: 1 },
      });
      venueReservationsService.cancelAdminReservation.mockResolvedValue({
        message: 'Reservation cancelled.',
        reservation: { id: CANCEL_RESERVATION_ID, status: 'CANCELLED' },
      });
      venueReservationsService.createAdminCashReservation.mockResolvedValue({
        message: 'Cash reservation confirmed.',
        reservation: { id: 'cash-res-1', status: 'PAID' },
      });
      venueReservationsService.createAdminCheckoutSession.mockResolvedValue({
        reservationId: 'admin-res-1',
        message: 'Payment link sent to customer.',
        payUrl: 'https://example.test/pay/venue-seat?token=abc',
      });

      const created = await createVenueReservationsHttpApp({
        guardsAllow: true,
        venueReservationsService,
      });
      app = created.app;
    });

    it('GET /admin returns typed list body', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/venue-reservations/admin')
        .expect(200);

      const body = res.body as AdminListBody;
      expect(body.items).toEqual([
        { id: CANCEL_RESERVATION_ID, status: 'PENDING_PAYMENT' },
      ]);
      expect(body.meta?.page).toBe(1);
    });

    it('PATCH /admin/:id/cancel returns CancelReservationBody', async () => {
      const res = await request(app.getHttpServer())
        .patch(
          `/api/v1/venue-reservations/admin/${CANCEL_RESERVATION_ID}/cancel`,
        )
        .expect(200);

      const body = res.body as CancelReservationBody;
      expect(body.message).toBe('Reservation cancelled.');
      expect(body.reservation.status).toBe('CANCELLED');
    });

    it('POST /admin/cash returns cash confirmation', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/venue-reservations/admin/cash')
        .send(checkoutDto)
        .expect(201);

      const body = res.body as AdminCashReservationBody;
      expect(body.message).toBe('Cash reservation confirmed.');
      expect(body.reservation.status).toBe('PAID');
    });

    it('POST /admin/checkout-session returns payment link payload', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/venue-reservations/admin/checkout-session')
        .send(checkoutDto)
        .expect(201);

      const body = res.body as AdminCheckoutPayLinkBody;
      expect(body.reservationId).toBe('admin-res-1');
      expect(body.message).toBe('Payment link sent to customer.');
      expect(body.payUrl).toContain('/pay/venue-seat?token=');
    });

    it('PATCH /admin/:id/cancel already cancelled returns idempotent message', async () => {
      venueReservationsService.cancelAdminReservation.mockResolvedValue({
        message: 'Reservation already cancelled.',
        reservation: { id: CANCEL_RESERVATION_ID, status: 'CANCELLED' },
      });

      const res = await request(app.getHttpServer())
        .patch(
          `/api/v1/venue-reservations/admin/${CANCEL_RESERVATION_ID}/cancel`,
        )
        .expect(200);

      const body = res.body as CancelReservationBody;
      expect(body.message).toBe('Reservation already cancelled.');
      expect(body.reservation.status).toBe('CANCELLED');
    });
  });

  describe('public routes', () => {
    beforeEach(async () => {
      jest.clearAllMocks();
      const created = await createVenueReservationsHttpApp({
        guardsAllow: true,
        venueReservationsService,
      });
      app = created.app;
    });

    it('GET /availability returns AvailabilityBody', async () => {
      venueReservationsService.getAvailability.mockResolvedValue({
        upcomingEventId: EVENT_ID,
        eventDate: '2026-08-15T22:00:00.000Z',
        reservationsOpen: true,
        reservedLayoutItemIds: [LAYOUT_ITEM_ID],
      });

      const res = await request(app.getHttpServer())
        .get('/api/v1/venue-reservations/availability')
        .query({ upcomingEventId: EVENT_ID })
        .expect(200);

      const body = res.body as AvailabilityBody;
      expect(body.upcomingEventId).toBe(EVENT_ID);
      expect(body.reservationsOpen).toBe(true);
      expect(body.reservedLayoutItemIds).toContain(LAYOUT_ITEM_ID);
    });

    it('GET /availability sold_out returns typed closed reason', async () => {
      venueReservationsService.getAvailability.mockResolvedValue({
        upcomingEventId: EVENT_ID,
        eventDate: '2026-08-15T22:00:00.000Z',
        reservationsOpen: false,
        salesClosedReason: 'sold_out',
        reservedLayoutItemIds: [LAYOUT_ITEM_ID],
      });

      const res = await request(app.getHttpServer())
        .get('/api/v1/venue-reservations/availability')
        .query({ upcomingEventId: EVENT_ID })
        .expect(200);

      const body = res.body as AvailabilityBody;
      expect(body.reservationsOpen).toBe(false);
      expect(body.salesClosedReason).toBe('sold_out');
    });

    it('POST /checkout-session sold-out returns 400', async () => {
      venueReservationsService.createCheckoutSession.mockRejectedValue(
        new BadRequestException('All seats are sold.'),
      );

      const res = await request(app.getHttpServer())
        .post('/api/v1/venue-reservations/checkout-session')
        .send(checkoutDto)
        .expect(400);

      const body = res.body as ErrorBody;
      expect(body.message).toBe('All seats are sold.');
    });

    it('GET /public/pay/checkout expired returns 400', async () => {
      venueReservationsService.resolvePayCheckoutClientSecret.mockRejectedValue(
        new BadRequestException('Payment link has expired.'),
      );

      const res = await request(app.getHttpServer())
        .get('/api/v1/venue-reservations/public/pay/checkout')
        .query({ token: 'expired-token' })
        .expect(400);

      const body = res.body as ErrorBody;
      expect(body.message).toBe('Payment link has expired.');
    });

    it('GET /public/pay/checkout returns clientSecret', async () => {
      venueReservationsService.resolvePayCheckoutClientSecret.mockResolvedValue(
        'cs_pay_secret',
      );

      const res = await request(app.getHttpServer())
        .get('/api/v1/venue-reservations/public/pay/checkout')
        .query({ token: 'pay-token-abc' })
        .expect(200);

      const body = res.body as PayCheckoutClientSecretBody;
      expect(body.clientSecret).toBe('cs_pay_secret');
    });

    it('POST /checkout-session BadRequest returns 400', async () => {
      venueReservationsService.createCheckoutSession.mockRejectedValue(
        new BadRequestException('On Coming Events is not published.'),
      );

      const res = await request(app.getHttpServer())
        .post('/api/v1/venue-reservations/checkout-session')
        .send(checkoutDto)
        .expect(400);

      const body = res.body as ErrorBody;
      expect(body.statusCode).toBe(400);
      expect(body.message).toBe('On Coming Events is not published.');
    });

    it('POST /checkout-session success returns CheckoutSessionCreatedBody', async () => {
      venueReservationsService.createCheckoutSession.mockResolvedValue({
        clientSecret: 'cs_test_secret',
        reservationId: 'res-public-1',
      });

      const res = await request(app.getHttpServer())
        .post('/api/v1/venue-reservations/checkout-session')
        .send(checkoutDto)
        .expect(201);

      const body = res.body as CheckoutSessionCreatedBody;
      expect(body.clientSecret).toBe('cs_test_secret');
      expect(body.reservationId).toBe('res-public-1');
    });

    it('GET /session-status returns SessionStatusBody', async () => {
      venueReservationsService.getSessionStatus.mockResolvedValue({
        stripeStatus: 'complete',
        reservation: {
          id: 'res-status-1',
          status: 'PAID',
        },
      });

      const res = await request(app.getHttpServer())
        .get('/api/v1/venue-reservations/session-status')
        .query({ session_id: 'cs_status' })
        .expect(200);

      const body = res.body as SessionStatusBody;
      expect(body.stripeStatus).toBe('complete');
      expect(body.reservation.status).toBe('PAID');
    });

    it('POST /reconcile unpaid returns 400', async () => {
      venueReservationsService.getSessionStatus.mockRejectedValue(
        new BadRequestException('Checkout session is not paid.'),
      );

      const res = await request(app.getHttpServer())
        .post('/api/v1/venue-reservations/reconcile')
        .query({ session_id: 'cs_unpaid' })
        .expect(400);

      const body = res.body as ErrorBody;
      expect(body.message).toBe('Checkout session is not paid.');
    });

    it('GET /admin/availability returns AvailabilityBody', async () => {
      venueReservationsService.getAdminAvailability.mockResolvedValue({
        upcomingEventId: EVENT_ID,
        eventDate: '2026-09-01',
        reservationsOpen: true,
        reservedLayoutItemIds: [],
      });
      const res = await request(app.getHttpServer())
        .get('/api/v1/venue-reservations/admin/availability')
        .query({ upcomingEventId: EVENT_ID })
        .expect(200);
      const body = res.body as AvailabilityBody;
      expect(body.upcomingEventId).toBe(EVENT_ID);
      expect(body.reservationsOpen).toBe(true);
    });

    it('POST /public/pay/reconcile returns SessionStatusBody', async () => {
      venueReservationsService.getSessionStatus.mockResolvedValue({
        stripeStatus: 'complete',
        reservation: { id: CANCEL_RESERVATION_ID, status: 'PAID' },
      });
      const res = await request(app.getHttpServer())
        .post('/api/v1/venue-reservations/public/pay/reconcile')
        .query({ session_id: 'cs_pay' })
        .expect(200);
      const body = res.body as SessionStatusBody;
      expect(body.reservation.status).toBe('PAID');
    });

    it('GET /public/confirmation.pdf streams application/pdf', async () => {
      venueReservationsService.getConfirmationPdfDownload.mockResolvedValue({
        buffer: Buffer.from('%PDF-1.4 test'),
        filename: 'confirmation.pdf',
      });
      const res = await request(app.getHttpServer())
        .get('/api/v1/venue-reservations/public/confirmation.pdf')
        .query({ token: 'pdf-token' })
        .expect(200);
      expect(String(res.headers['content-type'])).toContain('application/pdf');
    });

    it('GET /public/confirmation.pdf without token returns 400', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/venue-reservations/public/confirmation.pdf')
        .expect(400);
      const body = res.body as ErrorBody;
      expect(body.message).toBe('token is required.');
    });

    it('POST /admin/resend-confirmation with reservationId returns typed body', async () => {
      venueReservationsService.resendAdminPaidConfirmationEmail.mockResolvedValue(
        { message: 'Confirmation resent.', sent: 1 },
      );
      const res = await request(app.getHttpServer())
        .post('/api/v1/venue-reservations/admin/resend-confirmation')
        .send({ reservationIds: [CANCEL_RESERVATION_ID] })
        .expect(200);
      const body = res.body as ResendConfirmationBody;
      expect(body.sent).toBe(1);
    });

    it('POST /admin/resend-confirmation empty body returns 400', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/venue-reservations/admin/resend-confirmation')
        .send({})
        .expect(400);
      const body = res.body as ErrorBody;
      expect(body.statusCode).toBe(400);
    });
  });

  describe('stripe webhook', () => {
    beforeEach(async () => {
      jest.clearAllMocks();
      const created = await createVenueReservationsHttpApp({
        guardsAllow: true,
        venueReservationsService,
        stripeWebhookDispatch,
        includeWebhookController: true,
      });
      app = created.app;
    });

    it('POST /stripe/webhook missing signature returns 400 with x-request-id', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/stripe/webhook')
        .send({ id: 'evt_test' })
        .expect(400);

      const body = res.body as ErrorBody;
      expect(body.statusCode).toBe(400);
      expect(body.message).toBe('Missing stripe-signature header.');
      const requestId = res.headers[REQUEST_ID_HEADER];
      expect(typeof requestId).toBe('string');
      expect(String(requestId).length).toBeGreaterThan(0);
    });

    it('POST /stripe/webhook handled payload returns typed received body', async () => {
      stripeWebhookDispatch.handle.mockResolvedValue({
        received: true,
        handler: 'venue_seat',
        deduplicated: false,
      });

      const res = await request(app.getHttpServer())
        .post('/api/v1/stripe/webhook')
        .set('stripe-signature', 'sig_test')
        .send({ id: 'evt_ok' })
        .expect(200);

      const body = res.body as WebhookDispatchBody;
      expect(body.received).toBe(true);
      expect(body.handler).toBe('venue_seat');
      expect(body.deduplicated).toBe(false);
    });

    it('POST /stripe/webhook unhandled returns 400 tipado', async () => {
      stripeWebhookDispatch.handle.mockRejectedValue(
        new BadRequestException(
          'Unhandled Stripe webhook flow=none type=payment_intent.succeeded',
        ),
      );

      const res = await request(app.getHttpServer())
        .post('/api/v1/stripe/webhook')
        .set('stripe-signature', 'sig_test')
        .send({ id: 'evt_unhandled' })
        .expect(400);

      const body = res.body as ErrorBody;
      expect(body.statusCode).toBe(400);
      expect(String(body.message)).toMatch(/Unhandled Stripe webhook/i);
    });
  });
});
