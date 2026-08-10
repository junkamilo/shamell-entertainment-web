import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types';
import { REQUEST_ID_HEADER } from '../src/common/http/constants/http-headers.constants';
import { createAdminClassEnrollmentServiceMock } from '../src/modules/upcoming-events/__mocks__/admin-class-enrollment.service.mock';
import { createAdminFixedEventEnrollmentServiceMock } from '../src/modules/upcoming-events/__mocks__/admin-fixed-event-enrollment.service.mock';
import { makePublicEventStub } from '../src/modules/upcoming-events/__mocks__/upcoming-events.fixtures';
import { createUpcomingEventsServiceMock } from '../src/modules/upcoming-events/__mocks__/upcoming-events.service.mock';
import { createUpcomingEventsHttpApp } from '../src/modules/upcoming-events/testing/upcoming-events-http-app';
import type {
  AdminCashEnrollmentBody,
  AdminCheckoutPayLinkBody,
  AdminFixedCashBody,
  AdminFixedCheckoutBody,
  BookableClassEventsBody,
  BoxOfficeFixedEventsBody,
  CheckoutSessionCreatedBody,
  ClassBookingContextBody,
  ErrorBody,
  PayCheckoutClientSecretBody,
  PublicClassOptionsBody,
  PublicEventBody,
  PublicVenueBundleBody,
  ReconcileBody,
  RegenerateSessionsBody,
  SessionStatusBody,
} from '../src/modules/upcoming-events/testing/upcoming-events.test-types';

const EVENT_ID = '11111111-1111-4111-8111-111111111111';
const SESSION_ID = '22222222-2222-4222-8222-222222222222';
const SLUG = 'salsa-night';

const classCheckoutDto = {
  sessionId: SESSION_ID,
  customerName: 'Guest User',
  customerEmail: 'guest@example.com',
};

const adminEnrollmentDto = {
  purchaseKind: 'session' as const,
  upcomingEventId: EVENT_ID,
  sessionId: SESSION_ID,
  customerName: 'Admin Guest',
  customerEmail: 'admin-guest@example.com',
};

const fixedCheckoutDto = {
  customerName: 'Ticket Guest',
  customerEmail: 'ticket@example.com',
};

const adminFixedEnrollmentDto = {
  upcomingEventId: EVENT_ID,
  customerName: 'Box Office Guest',
  customerEmail: 'box-office@example.com',
  boxOfficeDetails: { channel: 'walk-in' },
};

describe('UpcomingEvents (contract e2e)', () => {
  let app: INestApplication<App>;
  const upcomingEventsService = {
    ...createUpcomingEventsServiceMock(),
    regenerateAdminClassSessions: jest.fn(),
    createClassCheckout: jest.fn(),
    reconcileClassFromStripeSession: jest.fn(),
    getClassSessionStatus: jest.fn(),
    createFixedEventCheckout: jest.fn(),
    reconcileFixedTicketFromStripeSession: jest.fn(),
  };
  const adminClassEnrollment = createAdminClassEnrollmentServiceMock();
  const adminFixedEventEnrollment =
    createAdminFixedEventEnrollmentServiceMock();

  afterEach(async () => {
    await app.close();
  });

  describe('admin routes without JWT (guardsAllow: false)', () => {
    beforeEach(async () => {
      const created = await createUpcomingEventsHttpApp({
        guardsAllow: false,
        upcomingEventsService,
        adminClassEnrollment,
        adminFixedEventEnrollment,
      });
      app = created.app;
    });

    it('GET bookable-class-events returns 401 or 403', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/upcoming-events/admin/bookable-class-events')
        .expect((response) => {
          expect([401, 403]).toContain(response.status);
        });

      const body = res.body as ErrorBody;
      expect(body.statusCode).toBe(res.status);
    });

    it('POST sessions/regenerate returns 401 or 403', async () => {
      await request(app.getHttpServer())
        .post(
          `/api/v1/upcoming-events/admin/events/${EVENT_ID}/sessions/regenerate`,
        )
        .expect((response) => {
          expect([401, 403]).toContain(response.status);
        });
    });

    it('POST admin class checkout-session returns 401 or 403', async () => {
      await request(app.getHttpServer())
        .post(
          '/api/v1/upcoming-events/admin/class-enrollments/checkout-session',
        )
        .send(adminEnrollmentDto)
        .expect((response) => {
          expect([401, 403]).toContain(response.status);
        });
    });

    it('POST admin class cash returns 401 or 403', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/upcoming-events/admin/class-enrollments/cash')
        .send(adminEnrollmentDto)
        .expect((response) => {
          expect([401, 403]).toContain(response.status);
        });
    });

    it('GET class-booking-context returns 401 or 403', async () => {
      await request(app.getHttpServer())
        .get(
          `/api/v1/upcoming-events/admin/events/${EVENT_ID}/class-booking-context`,
        )
        .expect((response) => {
          expect([401, 403]).toContain(response.status);
        });
    });

    it('GET box-office/fixed-events returns 401 or 403', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/upcoming-events/admin/box-office/fixed-events')
        .expect((response) => {
          expect([401, 403]).toContain(response.status);
        });
    });

    it('POST admin fixed-event cash returns 401 or 403', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/upcoming-events/admin/fixed-event-enrollments/cash')
        .send(adminFixedEnrollmentDto)
        .expect((response) => {
          expect([401, 403]).toContain(response.status);
        });
    });

    it('POST admin fixed-event checkout-session returns 401 or 403', async () => {
      await request(app.getHttpServer())
        .post(
          '/api/v1/upcoming-events/admin/fixed-event-enrollments/checkout-session',
        )
        .send(adminFixedEnrollmentDto)
        .expect((response) => {
          expect([401, 403]).toContain(response.status);
        });
    });
  });

  describe('admin routes with guard allow', () => {
    beforeEach(async () => {
      jest.clearAllMocks();
      adminClassEnrollment.listAdminBookableClassEvents.mockResolvedValue({
        events: [{ id: EVENT_ID, slug: SLUG, name: 'Salsa Night' }],
      });
      upcomingEventsService.regenerateAdminClassSessions.mockResolvedValue({
        upserted: 2,
        deactivated: 1,
      });
      adminClassEnrollment.createAdminClassCheckoutSession.mockResolvedValue({
        enrollmentId: 'enroll-admin-1',
        message: 'Payment link sent to customer.',
        payUrl: 'https://example.com/pay/class?token=abc',
      });
      adminClassEnrollment.getAdminClassBookingContext.mockResolvedValue({
        event: { id: EVENT_ID, slug: SLUG, name: 'Salsa Night' },
        sessions: [{ id: SESSION_ID, seatsRemaining: 12 }],
      });
      adminClassEnrollment.resolveClassPayCheckoutClientSecret.mockResolvedValue(
        'cs_pay_secret',
      );
      adminClassEnrollment.createAdminClassCashEnrollment.mockResolvedValue({
        enrollmentId: 'enroll-cash-1',
        message: 'Class reservation confirmed.',
      });
      adminFixedEventEnrollment.listBoxOfficeFixedEvents.mockResolvedValue({
        events: [
          {
            id: EVENT_ID,
            name: 'Gala Night',
            slug: SLUG,
            purchaseKind: 'fixed_ticket',
            price: 75,
            currency: 'usd',
            ticketsRemaining: 40,
            fixedTicketCapacity: 50,
            floorLayoutId: null,
            eventDateIso: null,
            eventLabel: 'Gala Night',
          },
        ],
      });
      adminFixedEventEnrollment.createAdminCash.mockResolvedValue({
        enrollmentId: 'fixed-cash-1',
        ticketNumber: 7,
        message: 'Ticket reserved.',
      });
      adminFixedEventEnrollment.createAdminCheckoutSession.mockResolvedValue({
        enrollmentId: 'fixed-checkout-1',
        message: 'Payment link sent to customer.',
        payUrl: 'https://checkout.stripe.com/c/pay/cs_fixed',
      });

      const created = await createUpcomingEventsHttpApp({
        guardsAllow: true,
        upcomingEventsService,
        adminClassEnrollment,
        adminFixedEventEnrollment,
      });
      app = created.app;
    });

    it('GET bookable-class-events returns typed events list', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/upcoming-events/admin/bookable-class-events')
        .expect(200);

      const body = res.body as BookableClassEventsBody;
      expect(body.events).toEqual([
        { id: EVENT_ID, slug: SLUG, name: 'Salsa Night' },
      ]);
    });

    it('POST sessions/regenerate returns regeneration counts', async () => {
      const res = await request(app.getHttpServer())
        .post(
          `/api/v1/upcoming-events/admin/events/${EVENT_ID}/sessions/regenerate`,
        )
        .expect(200);

      const body = res.body as RegenerateSessionsBody;
      expect(body).toEqual({ upserted: 2, deactivated: 1 });
    });

    it('POST admin class checkout-session returns pay link', async () => {
      const res = await request(app.getHttpServer())
        .post(
          '/api/v1/upcoming-events/admin/class-enrollments/checkout-session',
        )
        .send(adminEnrollmentDto)
        .expect(201);

      const body = res.body as AdminCheckoutPayLinkBody;
      expect(body.enrollmentId).toBe('enroll-admin-1');
      expect(body.message).toBe('Payment link sent to customer.');
      expect(body.payUrl).toBe('https://example.com/pay/class?token=abc');
    });

    it('GET class-booking-context returns ClassBookingContextBody', async () => {
      const res = await request(app.getHttpServer())
        .get(
          `/api/v1/upcoming-events/admin/events/${EVENT_ID}/class-booking-context`,
        )
        .expect(200);

      const body = res.body as ClassBookingContextBody;
      expect(body.event).toEqual({
        id: EVENT_ID,
        slug: SLUG,
        name: 'Salsa Night',
      });
      expect(body.sessions).toEqual([{ id: SESSION_ID, seatsRemaining: 12 }]);
    });

    it('POST admin class cash returns enrollment confirmation', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/upcoming-events/admin/class-enrollments/cash')
        .send(adminEnrollmentDto)
        .expect(201);

      const body = res.body as AdminCashEnrollmentBody;
      expect(body.enrollmentId).toBe('enroll-cash-1');
      expect(body.message).toBe('Class reservation confirmed.');
    });

    it('GET box-office/fixed-events returns typed list', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/upcoming-events/admin/box-office/fixed-events')
        .expect(200);

      const body = res.body as BoxOfficeFixedEventsBody;
      expect(body.events).toHaveLength(1);
      expect(body.events[0].purchaseKind).toBe('fixed_ticket');
      expect(body.events[0].id).toBe(EVENT_ID);
    });

    it('POST admin fixed-event cash returns ticket confirmation', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/upcoming-events/admin/fixed-event-enrollments/cash')
        .send(adminFixedEnrollmentDto)
        .expect(201);

      const body = res.body as AdminFixedCashBody;
      expect(body.enrollmentId).toBe('fixed-cash-1');
      expect(body.ticketNumber).toBe(7);
      expect(body.message).toBe('Ticket reserved.');
    });

    it('POST admin fixed-event checkout-session returns payUrl', async () => {
      const res = await request(app.getHttpServer())
        .post(
          '/api/v1/upcoming-events/admin/fixed-event-enrollments/checkout-session',
        )
        .send(adminFixedEnrollmentDto)
        .expect(201);

      const body = res.body as AdminFixedCheckoutBody;
      expect(body.enrollmentId).toBe('fixed-checkout-1');
      expect(body.payUrl).toBe('https://checkout.stripe.com/c/pay/cs_fixed');
      expect(body.message).toBe('Payment link sent to customer.');
    });

    it('POST admin fixed-event cash sold-out returns 409', async () => {
      adminFixedEventEnrollment.createAdminCash.mockRejectedValue(
        new ConflictException('Tickets sold out.'),
      );

      const res = await request(app.getHttpServer())
        .post('/api/v1/upcoming-events/admin/fixed-event-enrollments/cash')
        .send(adminFixedEnrollmentDto)
        .expect(409);

      const body = res.body as ErrorBody;
      expect(body.message).toBe('Tickets sold out.');
    });
  });

  describe('public routes', () => {
    beforeEach(async () => {
      jest.clearAllMocks();
      const created = await createUpcomingEventsHttpApp({
        guardsAllow: true,
        upcomingEventsService,
        adminClassEnrollment,
        adminFixedEventEnrollment,
      });
      app = created.app;
    });

    it('GET :slug returns PublicEventBody', async () => {
      const payload = makePublicEventStub({ slug: SLUG, name: 'Salsa Night' });
      upcomingEventsService.getPublicBySlug.mockResolvedValue(payload);

      const res = await request(app.getHttpServer())
        .get(`/api/v1/upcoming-events/${SLUG}`)
        .expect(200);

      const body = res.body as PublicEventBody;
      expect(body.slug).toBe(SLUG);
      expect(body.name).toBe('Salsa Night');
    });

    it('GET :slug not found returns 404 with x-request-id', async () => {
      upcomingEventsService.getPublicBySlug.mockRejectedValue(
        new NotFoundException('Event not found.'),
      );

      const res = await request(app.getHttpServer())
        .get('/api/v1/upcoming-events/missing-slug')
        .expect(404);

      const body = res.body as ErrorBody;
      expect(body.statusCode).toBe(404);
      const requestId = res.headers[REQUEST_ID_HEADER];
      expect(typeof requestId).toBe('string');
      expect(String(requestId).length).toBeGreaterThan(0);
    });

    it('GET :slug/venue returns PublicVenueBundleBody', async () => {
      upcomingEventsService.getPublicVenueBundle.mockResolvedValue({
        event: { slug: SLUG, eventTypeName: 'Gala Night' },
        config: {
          reservationEventLabel: 'Gala Night',
          reservationTimezone: 'America/New_York',
          floorLayoutId: 'layout-1',
          reservationEventDate: '2026-09-01T00:00:00.000Z',
          reservationOpensAt: '2026-01-01T00:00:00.000Z',
          reservationClosesAt: '2026-12-31T00:00:00.000Z',
        },
      });

      const res = await request(app.getHttpServer())
        .get(`/api/v1/upcoming-events/${SLUG}/venue`)
        .expect(200);

      const body = res.body as PublicVenueBundleBody;
      expect(body.event.slug).toBe(SLUG);
      expect(body.config.floorLayoutId).toBe('layout-1');
    });

    it('GET :slug/venue unpublished returns 404', async () => {
      upcomingEventsService.getPublicVenueBundle.mockRejectedValue(
        new NotFoundException(
          'Seat reservations are not published for this event.',
        ),
      );

      const res = await request(app.getHttpServer())
        .get(`/api/v1/upcoming-events/${SLUG}/venue`)
        .expect(404);

      const body = res.body as ErrorBody;
      expect(body.message).toBe(
        'Seat reservations are not published for this event.',
      );
    });

    it('GET :slug/class-options returns PublicClassOptionsBody', async () => {
      upcomingEventsService.getPublicClassOptions.mockResolvedValue({
        eventSlug: SLUG,
        timezone: 'America/New_York',
        days: [
          {
            weekday: 1,
            label: 'Mon',
            sessions: [{ id: SESSION_ID, weekday: 1 }],
          },
        ],
      });

      const res = await request(app.getHttpServer())
        .get(`/api/v1/upcoming-events/${SLUG}/class-options`)
        .expect(200);

      const body = res.body as PublicClassOptionsBody;
      expect(body.eventSlug).toBe(SLUG);
      expect(body.days[0]?.sessions[0]?.id).toBe(SESSION_ID);
    });

    it('GET :slug/class-options wrong mode returns 400', async () => {
      upcomingEventsService.getPublicClassOptions.mockRejectedValue(
        new BadRequestException('This event does not offer class sessions.'),
      );

      const res = await request(app.getHttpServer())
        .get(`/api/v1/upcoming-events/${SLUG}/class-options`)
        .expect(400);

      const body = res.body as ErrorBody;
      expect(body.message).toBe('This event does not offer class sessions.');
    });

    it('POST sessions/checkout-session BadRequest returns 400', async () => {
      upcomingEventsService.createClassCheckout.mockRejectedValue(
        new BadRequestException('Session is full.'),
      );

      const res = await request(app.getHttpServer())
        .post(`/api/v1/upcoming-events/${SLUG}/sessions/checkout-session`)
        .send(classCheckoutDto)
        .expect(400);

      const body = res.body as ErrorBody;
      expect(body.statusCode).toBe(400);
      expect(body.message).toBe('Session is full.');
    });

    it('POST sessions/checkout-session success returns clientSecret', async () => {
      upcomingEventsService.createClassCheckout.mockResolvedValue({
        clientSecret: 'cs_public_secret',
        enrollmentId: 'enroll-public-1',
      });

      const res = await request(app.getHttpServer())
        .post(`/api/v1/upcoming-events/${SLUG}/sessions/checkout-session`)
        .send(classCheckoutDto)
        .expect(201);

      const body = res.body as CheckoutSessionCreatedBody;
      expect(body.clientSecret).toBe('cs_public_secret');
      expect(body.enrollmentId).toBe('enroll-public-1');
    });

    it('POST class-enrollments/reconcile unpaid returns 400', async () => {
      upcomingEventsService.reconcileClassFromStripeSession.mockRejectedValue(
        new BadRequestException('Checkout session is not paid.'),
      );

      const res = await request(app.getHttpServer())
        .post('/api/v1/class-enrollments/reconcile')
        .query({ session_id: 'cs_unpaid' })
        .expect(400);

      const body = res.body as ErrorBody;
      expect(body.message).toBe('Checkout session is not paid.');
    });

    it('GET class-enrollments/session-status returns SessionStatusBody', async () => {
      upcomingEventsService.getClassSessionStatus.mockResolvedValue({
        stripeStatus: 'complete',
        enrollment: {
          id: 'enroll-status-1',
          status: 'PAID',
        },
      });

      const res = await request(app.getHttpServer())
        .get('/api/v1/class-enrollments/session-status')
        .query({ session_id: 'cs_status' })
        .expect(200);

      const body = res.body as SessionStatusBody;
      expect(body.stripeStatus).toBe('complete');
      expect(body.enrollment?.status).toBe('PAID');
    });

    it('POST fixed-event/checkout-session BadRequest returns 400', async () => {
      upcomingEventsService.createFixedEventCheckout.mockRejectedValue(
        new BadRequestException('Invalid event ticket price.'),
      );

      const res = await request(app.getHttpServer())
        .post(`/api/v1/upcoming-events/${SLUG}/fixed-event/checkout-session`)
        .send(fixedCheckoutDto)
        .expect(400);

      const body = res.body as ErrorBody;
      expect(body.message).toBe('Invalid event ticket price.');
    });

    it('POST fixed-event/checkout-session success returns clientSecret', async () => {
      upcomingEventsService.createFixedEventCheckout.mockResolvedValue({
        clientSecret: 'cs_fixed_secret',
        enrollmentId: 'fixed-enroll-1',
      });

      const res = await request(app.getHttpServer())
        .post(`/api/v1/upcoming-events/${SLUG}/fixed-event/checkout-session`)
        .send(fixedCheckoutDto)
        .expect(201);

      const body = res.body as CheckoutSessionCreatedBody;
      expect(body.clientSecret).toBe('cs_fixed_secret');
      expect(body.enrollmentId).toBe('fixed-enroll-1');
    });

    it('POST fixed-event-enrollments/reconcile unpaid returns 400', async () => {
      upcomingEventsService.reconcileFixedTicketFromStripeSession.mockRejectedValue(
        new BadRequestException('Checkout session is not paid.'),
      );

      const res = await request(app.getHttpServer())
        .post('/api/v1/fixed-event-enrollments/reconcile')
        .query({ session_id: 'cs_fixed_unpaid' })
        .expect(400);

      const body = res.body as ErrorBody;
      expect(body.statusCode).toBe(400);
    });

    it('POST fixed-event-enrollments/reconcile paid returns reconciled', async () => {
      upcomingEventsService.reconcileFixedTicketFromStripeSession.mockResolvedValue(
        { reconciled: true },
      );

      const res = await request(app.getHttpServer())
        .post('/api/v1/fixed-event-enrollments/reconcile')
        .query({ session_id: 'cs_fixed_paid' })
        .expect(200);

      const body = res.body as ReconcileBody;
      expect(body.reconciled).toBe(true);
    });

    it('GET class-enrollments/public/pay/checkout without token returns 400', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/class-enrollments/public/pay/checkout')
        .expect(400);

      const body = res.body as ErrorBody;
      expect(body.statusCode).toBe(400);
      expect(body.message).toBe('token is required.');
    });

    it('GET class-enrollments/public/pay/checkout with token returns clientSecret', async () => {
      adminClassEnrollment.resolveClassPayCheckoutClientSecret.mockResolvedValue(
        'cs_pay_secret',
      );

      const res = await request(app.getHttpServer())
        .get('/api/v1/class-enrollments/public/pay/checkout')
        .query({ token: 'pay-token-abc' })
        .expect(200);

      const body = res.body as PayCheckoutClientSecretBody;
      expect(body.clientSecret).toBe('cs_pay_secret');
    });

    it('GET :slug/sessions returns typed public sessions list', async () => {
      upcomingEventsService.listPublicSessions.mockResolvedValue([
        { id: SESSION_ID, startsAt: '2026-08-15T18:00:00.000Z' },
      ]);
      const res = await request(app.getHttpServer())
        .get(`/api/v1/upcoming-events/${SLUG}/sessions`)
        .expect(200);
      const body = res.body as Array<{ id: string }>;
      expect(body).toHaveLength(1);
      expect(body[0]?.id).toBe(SESSION_ID);
    });

    it('GET fixed-event-enrollments/session-status without session_id returns 400', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/fixed-event-enrollments/session-status')
        .expect(400);
      const body = res.body as ErrorBody;
      expect(body.message).toBe('session_id is required.');
    });

    it('GET fixed-event-enrollments/session-status returns SessionStatusBody', async () => {
      upcomingEventsService.getFixedEventSessionStatus.mockResolvedValue({
        stripeStatus: 'open',
        enrollment: {
          status: 'PENDING_PAYMENT',
          customerEmail: 'g***@example.com',
          eventName: 'Gala',
          eventSlug: 'gala',
        },
      });
      const res = await request(app.getHttpServer())
        .get('/api/v1/fixed-event-enrollments/session-status')
        .query({ session_id: 'cs_fixed_open' })
        .expect(200);
      const body = res.body as SessionStatusBody;
      expect(body.stripeStatus).toBe('open');
    });

    it('GET admin sessions list returns typed rows', async () => {
      upcomingEventsService.listAdminSessions.mockResolvedValue([
        { id: SESSION_ID, capacity: 10 },
      ]);
      const res = await request(app.getHttpServer())
        .get(`/api/v1/upcoming-events/admin/events/${EVENT_ID}/sessions`)
        .expect(200);
      const body = res.body as Array<{ id: string; capacity: number }>;
      expect(body[0]?.id).toBe(SESSION_ID);
    });

    it('POST/PATCH/DELETE admin session CRUD returns typed bodies', async () => {
      upcomingEventsService.createAdminSession.mockResolvedValue({
        id: SESSION_ID,
      });
      upcomingEventsService.updateAdminSession.mockResolvedValue({
        id: SESSION_ID,
        capacity: 12,
      });
      upcomingEventsService.deleteAdminSession.mockResolvedValue({
        message: 'Session deleted.',
      });

      const created = await request(app.getHttpServer())
        .post(`/api/v1/upcoming-events/admin/events/${EVENT_ID}/sessions`)
        .send({
          startsAt: '2026-08-15T18:00:00.000Z',
          endsAt: '2026-08-15T19:00:00.000Z',
          capacity: 10,
          price: 50,
        })
        .expect(201);
      expect((created.body as { id: string }).id).toBe(SESSION_ID);

      const updated = await request(app.getHttpServer())
        .patch(
          `/api/v1/upcoming-events/admin/events/${EVENT_ID}/sessions/${SESSION_ID}`,
        )
        .send({
          startsAt: '2026-08-15T18:00:00.000Z',
          endsAt: '2026-08-15T19:00:00.000Z',
          capacity: 12,
          price: 50,
        })
        .expect(200);
      expect((updated.body as { capacity: number }).capacity).toBe(12);

      const deleted = await request(app.getHttpServer())
        .delete(
          `/api/v1/upcoming-events/admin/events/${EVENT_ID}/sessions/${SESSION_ID}`,
        )
        .expect(200);
      expect((deleted.body as { message: string }).message).toContain(
        'deleted',
      );
    });

    it('GET/PATCH admin venue-config returns typed config', async () => {
      upcomingEventsService.getAdminVenueConfig.mockResolvedValue({
        eventId: EVENT_ID,
        clientEnabled: false,
      });
      upcomingEventsService.upsertAdminVenueConfig.mockResolvedValue({
        eventId: EVENT_ID,
        clientEnabled: true,
      });

      const getRes = await request(app.getHttpServer())
        .get(`/api/v1/upcoming-events/admin/events/${EVENT_ID}/venue-config`)
        .expect(200);
      expect(
        (getRes.body as { eventId: string; clientEnabled: boolean })
          .clientEnabled,
      ).toBe(false);

      const patchRes = await request(app.getHttpServer())
        .patch(`/api/v1/upcoming-events/admin/events/${EVENT_ID}/venue-config`)
        .send({ clientEnabled: true })
        .expect(200);
      expect((patchRes.body as { clientEnabled: boolean }).clientEnabled).toBe(
        true,
      );
    });

    it('POST admin fixed-event reconcile without session_id returns 400', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/upcoming-events/admin/fixed-event-enrollments/reconcile')
        .expect(400);
      const body = res.body as ErrorBody;
      expect(body.message).toBe('session_id is required.');
    });
  });
});
