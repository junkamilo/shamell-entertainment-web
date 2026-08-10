import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import {
  VenueSeatKind,
  VenueSeatReservationStatus,
  VenueTableSize,
} from '@prisma/client';
import request from 'supertest';
import type { App } from 'supertest/types';
import { ThrottlerGuard } from '@nestjs/throttler';
import { AdminJwtGuard } from '../src/common/auth/guards/admin-jwt.guard';
import { applyHttpObservability } from '../src/common/http/apply-http-observability';
import { createPrismaMock, type PrismaMock } from '../src/testing';
import { FloorLayoutService } from '../src/modules/floor-layout/services/floor-layout.service';
import { MailService } from '../src/modules/mail/services/mail.service';
import { AdminPaymentNotifyService } from '../src/modules/mail/services/admin-payment-notify.service';
import { createStripeServiceMock } from '../src/modules/stripe/__mocks__/stripe.service.mock';
import { StripeService } from '../src/modules/stripe/services/stripe.service';
import {
  makeCancelledVenueReservationStub,
  makeCatalogTableLayoutItem,
  makeCheckoutSessionStub,
  makeFloorLayoutStub,
  makePaidCheckoutSessionStub,
  makePaidVenueReservationStub,
  makeVenueConfigStub,
  makeVenueEventStub,
  makeVenueSeatReservationLite,
  makeVenueTableConfigStub,
} from '../src/modules/venue-reservations/__mocks__/venue-reservations.fixtures';
import { createVenueReservationsRepositoryMock } from '../src/modules/venue-reservations/__mocks__/venue-reservations.repository.mock';
import { VenueReservationsController } from '../src/modules/venue-reservations/controllers/venue-reservations.controller';
import type { CreateCheckoutSessionDto } from '../src/modules/venue-reservations/dto/create-checkout-session.dto';
import { VenueReservationsRepository } from '../src/modules/venue-reservations/services/venue-reservations.repository';
import { VenueReservationsService } from '../src/modules/venue-reservations/services/venue-reservations.service';
import type {
  AdminCashReservationBody,
  AdminCheckoutPayLinkBody,
  AvailabilityBody,
  CancelReservationBody,
  CheckoutSessionCreatedBody,
  ErrorBody,
  SessionStatusBody,
} from '../src/modules/venue-reservations/testing/venue-reservations.test-types';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';

const EVENT_ID = '11111111-1111-4111-8111-111111111111';
const LAYOUT_ITEM_ID = '22222222-2222-4222-8222-222222222222';
const TABLE_CONFIG_ID = '33333333-3333-4333-8333-333333333333';
const RESERVATION_ID = '44444444-4444-4444-8444-444444444444';
const FLOOR_LAYOUT_ID = '55555555-5555-4555-8555-555555555555';

const checkoutDto: CreateCheckoutSessionDto = {
  kind: 'catalog_table',
  layoutItemId: LAYOUT_ITEM_ID,
  venueTableConfigId: TABLE_CONFIG_ID,
  upcomingEventId: EVENT_ID,
  customerName: 'Ada Lovelace',
  customerEmail: 'ada@example.com',
};

type DeepHttpHarness = {
  app: INestApplication<App>;
  prisma: PrismaMock;
  repository: ReturnType<typeof createVenueReservationsRepositoryMock>;
  stripe: ReturnType<typeof createStripeServiceMock>;
  service: VenueReservationsService;
  floorLayout: {
    getPublicFloorLayoutForClient: jest.Mock;
    getActiveFloorLayoutId: jest.Mock;
  };
};

function wireVenueSeatReservationFindMany(
  prisma: PrismaMock,
  paidReservations: Array<Record<string, unknown>> = [],
  blockingReservations: Array<Record<string, unknown>> = [],
) {
  prisma.venueSeatReservation.findMany.mockImplementation(
    (args: {
      where?: { status?: VenueSeatReservationStatus; OR?: unknown[] };
    }) => {
      const where = args.where;
      if (where?.status === VenueSeatReservationStatus.PAID) {
        return Promise.resolve(paidReservations);
      }
      if (where?.OR) {
        return Promise.resolve(blockingReservations);
      }
      return Promise.resolve([]);
    },
  );
}

function withReservationTimestamps<T extends Record<string, unknown>>(
  row: T,
): T & { createdAt: Date; updatedAt: Date } {
  const now = new Date();
  return {
    ...row,
    createdAt: (row.createdAt as Date | undefined) ?? now,
    updatedAt: (row.updatedAt as Date | undefined) ?? now,
  };
}

function setupPublishedVenueContext(
  harness: DeepHttpHarness,
  options: {
    eventOverrides?: Record<string, unknown>;
    configOverrides?: Record<string, unknown>;
    layoutItems?: Array<Record<string, unknown>>;
    tableOverrides?: Record<string, unknown>;
    paidReservations?: Array<Record<string, unknown>>;
    blockingReservations?: Array<Record<string, unknown>>;
  } = {},
): PrismaMock {
  const { floorLayout, repository } = harness;
  const eventVenueConfig = options.eventOverrides?.venueConfig as
    | Record<string, unknown>
    | undefined;
  const venueConfig = makeVenueConfigStub({
    ...options.configOverrides,
    ...eventVenueConfig,
    eventId: EVENT_ID,
    floorLayoutId: FLOOR_LAYOUT_ID,
  });
  const { venueConfig: _ignoredVenueConfig, ...eventRest } =
    options.eventOverrides ?? {};
  void _ignoredVenueConfig;

  const prisma = createPrismaMock({
    venueSeatReservation: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn().mockResolvedValue(0),
    },
    event: {
      findFirst: jest.fn(),
      findUnique: jest.fn().mockResolvedValue(null),
    },
    upcomingVenueConfig: {
      findUnique: jest.fn(),
    },
    venueTableConfig: {
      findFirst: jest.fn(),
    },
    venueLayoutClientSettings: {
      findFirst: jest.fn().mockResolvedValue(null),
    },
  });
  repository.asPrisma.mockReturnValue(prisma);
  harness.prisma = prisma;

  const event = makeVenueEventStub({
    id: EVENT_ID,
    ...eventRest,
    venueConfig,
  });

  prisma.event.findFirst.mockResolvedValue(event);
  prisma.upcomingVenueConfig.findUnique.mockResolvedValue(
    makeVenueConfigStub({
      ...options.configOverrides,
      eventId: EVENT_ID,
      floorLayoutId: FLOOR_LAYOUT_ID,
      reservationEventTemplate: null,
    }),
  );
  floorLayout.getPublicFloorLayoutForClient.mockResolvedValue(
    makeFloorLayoutStub(
      options.layoutItems ?? [
        makeCatalogTableLayoutItem({
          id: LAYOUT_ITEM_ID,
          venueTableConfigId: TABLE_CONFIG_ID,
        }),
      ],
    ),
  );
  floorLayout.getActiveFloorLayoutId.mockResolvedValue(FLOOR_LAYOUT_ID);
  prisma.venueTableConfig.findFirst.mockResolvedValue(
    makeVenueTableConfigStub({
      id: TABLE_CONFIG_ID,
      ...options.tableOverrides,
    }),
  );

  wireVenueSeatReservationFindMany(
    prisma,
    options.paidReservations ?? [],
    options.blockingReservations ?? [],
  );

  return prisma;
}

async function createDeepVenueReservationsHttpApp(): Promise<DeepHttpHarness> {
  const repository = createVenueReservationsRepositoryMock();
  const stripe = createStripeServiceMock();
  const mail = {
    sendTransactional: jest.fn().mockResolvedValue({ ok: true }),
  };
  const adminPaymentNotify = {
    notifyPaymentOutcome: jest.fn().mockResolvedValue(undefined),
  };
  const config = { get: jest.fn().mockReturnValue(undefined) };
  const floorLayout = {
    getPublicFloorLayoutForClient: jest.fn().mockResolvedValue({ items: [] }),
    getActiveFloorLayoutId: jest.fn().mockResolvedValue(null),
  };

  stripe.client.checkout.sessions.create = jest.fn().mockResolvedValue({
    id: 'cs_test_created',
    client_secret: 'cs_test_secret',
  });
  stripe.client.checkout.sessions.update = jest
    .fn()
    .mockResolvedValue({ id: 'cs_test_created' });
  stripe.client.checkout.sessions.retrieve = jest.fn();
  stripe.client.paymentIntents.retrieve = jest.fn();

  const moduleRef = await Test.createTestingModule({
    controllers: [VenueReservationsController],
    providers: [
      VenueReservationsService,
      { provide: VenueReservationsRepository, useValue: repository },
      { provide: ConfigService, useValue: config },
      { provide: MailService, useValue: mail },
      { provide: AdminPaymentNotifyService, useValue: adminPaymentNotify },
      { provide: StripeService, useValue: stripe },
      { provide: FloorLayoutService, useValue: floorLayout },
    ],
  })
    .overrideGuard(AdminJwtGuard)
    .useValue({
      canActivate: (context: {
        switchToHttp: () => {
          getRequest: () => { adminUser?: { id: string; email: string } };
        };
      }) => {
        const req = context.switchToHttp().getRequest();
        req.adminUser = {
          id: 'admin-deep-e2e',
          email: 'admin-deep@e2e.test',
        };
        return true;
      },
    })
    .overrideGuard(ThrottlerGuard)
    .useValue({ canActivate: () => true })
    .compile();

  const app =
    moduleRef.createNestApplication() as unknown as INestApplication<App>;
  applyHttpObservability(app);
  app.setGlobalPrefix('api/v1');
  await app.init();

  const prisma = createPrismaMock();
  repository.asPrisma.mockReturnValue(prisma);

  return {
    app,
    prisma,
    repository,
    stripe,
    floorLayout,
    service: moduleRef.get(VenueReservationsService),
  };
}

describe('VenueReservations seat flows (deep e2e)', () => {
  let harness: DeepHttpHarness;

  beforeEach(async () => {
    jest.clearAllMocks();
    harness = await createDeepVenueReservationsHttpApp();
  });

  afterEach(async () => {
    await harness.app.close();
  });

  it('POST /checkout-session returns 409 when seat is already reserved', async () => {
    setupPublishedVenueContext(harness, {
      blockingReservations: [{ layoutItemId: LAYOUT_ITEM_ID }],
    });

    const res = await request(harness.app.getHttpServer())
      .post('/api/v1/venue-reservations/checkout-session')
      .send(checkoutDto)
      .expect((response) => {
        expect([400, 409]).toContain(response.status);
      });

    const message = (res.body as { message: string }).message;
    expect(String(message).toLowerCase()).toMatch(/reserved|sold/i);
  });

  it('POST /checkout-session creates PENDING reservation and returns clientSecret', async () => {
    const prisma = setupPublishedVenueContext(harness);
    const createdReservation = makeVenueSeatReservationLite({
      id: RESERVATION_ID,
      upcomingEventId: EVENT_ID,
      layoutItemId: LAYOUT_ITEM_ID,
      venueTableConfigId: TABLE_CONFIG_ID,
      stripeCheckoutSessionId: 'cs_test_created',
    });
    prisma.venueSeatReservation.create.mockResolvedValue(createdReservation);

    const res = await request(harness.app.getHttpServer())
      .post('/api/v1/venue-reservations/checkout-session')
      .send(checkoutDto)
      .expect(201);

    const body = res.body as CheckoutSessionCreatedBody;
    expect(body.clientSecret).toBe('cs_test_secret');
    expect(body.reservationId).toBe(RESERVATION_ID);

    const createCalls = prisma.venueSeatReservation.create.mock.calls as Array<
      [
        {
          data: {
            status: VenueSeatReservationStatus;
            stripeCheckoutSessionId: string;
          };
        },
      ]
    >;
    expect(createCalls).toHaveLength(1);
    expect(createCalls[0][0].data.status).toBe(
      VenueSeatReservationStatus.PENDING_PAYMENT,
    );
    expect(createCalls[0][0].data.stripeCheckoutSessionId).toBe(
      'cs_test_created',
    );
  });

  it('POST /reconcile soft-reconciles paid session and returns PAID status', async () => {
    const prisma = setupPublishedVenueContext(harness);
    const pending = makeVenueSeatReservationLite({
      id: RESERVATION_ID,
      upcomingEventId: EVENT_ID,
      layoutItemId: LAYOUT_ITEM_ID,
      venueTableConfigId: TABLE_CONFIG_ID,
      stripeCheckoutSessionId: 'cs_reconcile',
      amount: 100,
      customerEmailSentAt: null,
      venueTableConfig: { tableName: 'Table 1', size: VenueTableSize.LARGE },
      kind: VenueSeatKind.CATALOG_TABLE,
    });
    const paid = makePaidVenueReservationStub({
      id: RESERVATION_ID,
      upcomingEventId: EVENT_ID,
      layoutItemId: LAYOUT_ITEM_ID,
      venueTableConfigId: TABLE_CONFIG_ID,
      stripeCheckoutSessionId: 'cs_reconcile',
      venueTableConfig: { tableName: 'Table 1', size: VenueTableSize.LARGE },
      kind: VenueSeatKind.CATALOG_TABLE,
    });

    prisma.venueSeatReservation.findUnique
      .mockResolvedValueOnce(pending)
      .mockResolvedValueOnce(pending)
      .mockResolvedValueOnce(paid);
    prisma.venueSeatReservation.update.mockResolvedValue(paid);
    prisma.event.findUnique.mockResolvedValue({
      eventType: { name: 'Gala' },
    });
    harness.stripe.client.checkout.sessions.retrieve.mockResolvedValue(
      makePaidCheckoutSessionStub({
        id: 'cs_reconcile',
        amount_total: 10_000,
        currency: 'usd',
        payment_intent: 'pi_test_1',
      }),
    );
    harness.stripe.client.paymentIntents.retrieve.mockResolvedValue({
      payment_method: { type: 'card', card: { brand: 'visa', last4: '4242' } },
    });

    const res = await request(harness.app.getHttpServer())
      .post('/api/v1/venue-reservations/reconcile')
      .query({ session_id: 'cs_reconcile' })
      .expect(200);

    const body = res.body as SessionStatusBody;
    expect(body.stripeStatus).toBe('complete');
    expect(body.reservation.status).toBe(VenueSeatReservationStatus.PAID);
  });

  it('PATCH /admin/:id/cancel returns CANCELLED reservation', async () => {
    const prisma = setupPublishedVenueContext(harness);
    const pending = withReservationTimestamps(
      makeVenueSeatReservationLite({
        id: RESERVATION_ID,
        upcomingEventId: EVENT_ID,
        layoutItemId: LAYOUT_ITEM_ID,
        venueTableConfigId: TABLE_CONFIG_ID,
        venueTableConfig: { tableName: 'Table 1', size: VenueTableSize.LARGE },
        kind: VenueSeatKind.CATALOG_TABLE,
      }),
    );
    const cancelled = withReservationTimestamps(
      makeCancelledVenueReservationStub({
        id: RESERVATION_ID,
        upcomingEventId: EVENT_ID,
        layoutItemId: LAYOUT_ITEM_ID,
        venueTableConfigId: TABLE_CONFIG_ID,
        venueTableConfig: { tableName: 'Table 1', size: VenueTableSize.LARGE },
        kind: VenueSeatKind.CATALOG_TABLE,
      }),
    );

    prisma.venueSeatReservation.findUnique.mockResolvedValue(pending);
    prisma.venueSeatReservation.update.mockResolvedValue(cancelled);
    prisma.event.findUnique.mockResolvedValue({
      eventType: { name: 'Gala' },
    });

    const res = await request(harness.app.getHttpServer())
      .patch(`/api/v1/venue-reservations/admin/${RESERVATION_ID}/cancel`)
      .expect(200);

    const body = res.body as CancelReservationBody;
    expect(body.message).toBe('Reservation cancelled.');
    expect(body.reservation.status).toBe(VenueSeatReservationStatus.CANCELLED);
  });

  it('POST /reconcile unpaid leaves reservation PENDING (no false PAID)', async () => {
    const prisma = setupPublishedVenueContext(harness);
    const pending = makeVenueSeatReservationLite({
      id: RESERVATION_ID,
      upcomingEventId: EVENT_ID,
      layoutItemId: LAYOUT_ITEM_ID,
      venueTableConfigId: TABLE_CONFIG_ID,
      stripeCheckoutSessionId: 'cs_unpaid',
      venueTableConfig: { tableName: 'Table 1', size: VenueTableSize.LARGE },
      kind: VenueSeatKind.CATALOG_TABLE,
    });
    prisma.venueSeatReservation.findUnique.mockResolvedValue(pending);
    harness.stripe.client.checkout.sessions.retrieve.mockResolvedValue(
      makeCheckoutSessionStub({
        id: 'cs_unpaid',
        status: 'open',
        payment_status: 'unpaid',
      }),
    );

    const res = await request(harness.app.getHttpServer())
      .post('/api/v1/venue-reservations/reconcile')
      .query({ session_id: 'cs_unpaid' })
      .expect(200);

    const body = res.body as SessionStatusBody;
    expect(body.stripeStatus).toBe('open');
    expect(body.reservation.status).toBe(
      VenueSeatReservationStatus.PENDING_PAYMENT,
    );
    expect(prisma.venueSeatReservation.update).not.toHaveBeenCalled();
  });

  it('webhook already-PAID is idempotent (no second update)', async () => {
    const prisma = setupPublishedVenueContext(harness);
    prisma.venueSeatReservation.findUnique.mockResolvedValue(
      makePaidVenueReservationStub({
        id: RESERVATION_ID,
        stripeCheckoutSessionId: 'cs_dup',
      }),
    );

    const result = await harness.service.processStripeWebhookEvent({
      id: 'evt_dup_deep',
      type: 'checkout.session.completed',
      livemode: false,
      data: {
        object: makePaidCheckoutSessionStub({ id: 'cs_dup' }),
      },
    });

    expect(result).toEqual({ received: true, handled: true });
    expect(prisma.venueSeatReservation.update).not.toHaveBeenCalled();
  });

  it('webhook checkout.session.expired marks PENDING as EXPIRED', async () => {
    const prisma = setupPublishedVenueContext(harness);
    const pending = makeVenueSeatReservationLite({
      id: RESERVATION_ID,
      stripeCheckoutSessionId: 'cs_expired_deep',
    });
    prisma.venueSeatReservation.findUnique.mockResolvedValue(pending);
    prisma.venueSeatReservation.update.mockResolvedValue({
      ...pending,
      status: VenueSeatReservationStatus.EXPIRED,
    });
    prisma.event.findUnique.mockResolvedValue({
      eventType: { name: 'Gala' },
    });

    const result = await harness.service.processStripeWebhookEvent({
      id: 'evt_expired_deep',
      type: 'checkout.session.expired',
      livemode: false,
      data: {
        object: {
          id: 'cs_expired_deep',
          metadata: { flow: 'venue_seat' },
        },
      },
    });

    expect(result).toEqual({ received: true, handled: true });
    const updateCalls = prisma.venueSeatReservation.update.mock.calls as Array<
      [{ data: { status: VenueSeatReservationStatus } }]
    >;
    expect(updateCalls[0][0].data.status).toBe(
      VenueSeatReservationStatus.EXPIRED,
    );
  });

  it('PATCH /admin/:id/cancel already cancelled returns idempotent message', async () => {
    const prisma = setupPublishedVenueContext(harness);
    const cancelled = withReservationTimestamps(
      makeCancelledVenueReservationStub({
        id: RESERVATION_ID,
        venueTableConfig: { tableName: 'Table 1', size: VenueTableSize.LARGE },
        kind: VenueSeatKind.CATALOG_TABLE,
      }),
    );
    prisma.venueSeatReservation.findUnique
      .mockResolvedValueOnce(cancelled)
      .mockResolvedValueOnce(cancelled);

    const res = await request(harness.app.getHttpServer())
      .patch(`/api/v1/venue-reservations/admin/${RESERVATION_ID}/cancel`)
      .expect(200);

    const body = res.body as CancelReservationBody;
    expect(body.message).toBe('Reservation already cancelled.');
    expect(body.reservation.status).toBe(VenueSeatReservationStatus.CANCELLED);
    expect(prisma.venueSeatReservation.update).not.toHaveBeenCalled();
  });

  it('POST /admin/cash happy path returns 201 PAID reservation', async () => {
    const prisma = setupPublishedVenueContext(harness);
    const saved = withReservationTimestamps(
      makePaidVenueReservationStub({
        id: RESERVATION_ID,
        upcomingEventId: EVENT_ID,
        layoutItemId: LAYOUT_ITEM_ID,
        venueTableConfigId: TABLE_CONFIG_ID,
        paymentChannel: 'CASH',
        stripeCheckoutSessionId: null,
        venueTableConfig: { tableName: 'Table 1', size: VenueTableSize.LARGE },
        kind: VenueSeatKind.CATALOG_TABLE,
      }),
    );
    prisma.venueSeatReservation.create.mockResolvedValue(saved);
    prisma.event.findUnique.mockResolvedValue({
      eventType: { name: 'Gala' },
    });

    const res = await request(harness.app.getHttpServer())
      .post('/api/v1/venue-reservations/admin/cash')
      .send(checkoutDto)
      .expect(201);

    const body = res.body as AdminCashReservationBody;
    expect(body.message).toBe('Cash reservation confirmed.');
    expect(body.reservation.status).toBe(VenueSeatReservationStatus.PAID);
  });

  it('POST /admin/cash returns 409 on seat conflict', async () => {
    const prisma = setupPublishedVenueContext(harness);
    prisma.venueSeatReservation.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: '5.0.0',
      }),
    );

    const res = await request(harness.app.getHttpServer())
      .post('/api/v1/venue-reservations/admin/cash')
      .send(checkoutDto)
      .expect(409);

    const body = res.body as ErrorBody;
    expect(body.message).toBe('This seat is already reserved.');
  });

  it('POST /admin/checkout-session returns 201 payUrl', async () => {
    const prisma = setupPublishedVenueContext(harness);
    const pending = makeVenueSeatReservationLite({
      id: RESERVATION_ID,
      upcomingEventId: EVENT_ID,
      layoutItemId: LAYOUT_ITEM_ID,
      venueTableConfigId: TABLE_CONFIG_ID,
      stripeCheckoutSessionId: 'cs_test_created',
      amount: 100,
    });
    prisma.venueSeatReservation.create.mockResolvedValue(pending);

    const res = await request(harness.app.getHttpServer())
      .post('/api/v1/venue-reservations/admin/checkout-session')
      .send(checkoutDto)
      .expect(201);

    const body = res.body as AdminCheckoutPayLinkBody;
    expect(body.reservationId).toBe(RESERVATION_ID);
    expect(body.message).toBe('Payment link sent to customer.');
    expect(body.payUrl).toContain('/pay/venue-seat?token=');
    expect(harness.stripe.client.checkout.sessions.create).toHaveBeenCalled();
  });

  it('GET /availability sold_out returns typed closed reason', async () => {
    setupPublishedVenueContext(harness, {
      layoutItems: [
        makeCatalogTableLayoutItem({
          id: LAYOUT_ITEM_ID,
          venueTableConfigId: TABLE_CONFIG_ID,
        }),
      ],
      paidReservations: [
        makePaidVenueReservationStub({
          layoutItemId: LAYOUT_ITEM_ID,
          venueTableConfigId: TABLE_CONFIG_ID,
        }),
      ],
    });

    const res = await request(harness.app.getHttpServer())
      .get('/api/v1/venue-reservations/availability')
      .query({ upcomingEventId: EVENT_ID })
      .expect(200);

    const body = res.body as AvailabilityBody;
    expect(body.reservationsOpen).toBe(false);
    expect(body.salesClosedReason).toBe('sold_out');
  });

  it('POST /checkout-session sold-out returns 400', async () => {
    setupPublishedVenueContext(harness, {
      layoutItems: [
        makeCatalogTableLayoutItem({
          id: LAYOUT_ITEM_ID,
          venueTableConfigId: TABLE_CONFIG_ID,
        }),
      ],
      paidReservations: [
        makePaidVenueReservationStub({
          layoutItemId: LAYOUT_ITEM_ID,
          venueTableConfigId: TABLE_CONFIG_ID,
        }),
      ],
    });

    const res = await request(harness.app.getHttpServer())
      .post('/api/v1/venue-reservations/checkout-session')
      .send(checkoutDto)
      .expect(400);

    const body = res.body as ErrorBody;
    expect(body.message).toBe('All seats are sold.');
  });

  it('POST /checkout-session returns 400 when reservations are not configured', async () => {
    setupPublishedVenueContext(harness, {
      configOverrides: {
        reservationEventDate: null,
        reservationOpensAt: null,
        reservationClosesAt: null,
      },
    });

    const res = await request(harness.app.getHttpServer())
      .post('/api/v1/venue-reservations/checkout-session')
      .send(checkoutDto)
      .expect(400);

    const body = res.body as ErrorBody;
    expect(body.message).toBe('Reservations are not configured.');
  });
});
