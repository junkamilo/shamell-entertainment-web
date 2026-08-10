import { createHash } from 'crypto';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import {
  Prisma,
  VenueSeatKind,
  VenueSeatReservationStatus,
} from '@prisma/client';
import { createPrismaMock, type PrismaMock } from '../../../testing';
import {
  makeCancelledVenueReservationStub,
  makeCatalogTableLayoutItem,
  makeCheckoutSessionStub,
  makeAmountMismatchCheckoutSessionStub,
  makeExpiredCheckoutSessionStub,
  makeExpiredPayTokenReservationStub,
  makeFloorLayoutStub,
  makePaidCheckoutSessionStub,
  makePaidVenueReservationStub,
  makeUnpaidCompletedCheckoutSessionStub,
  makeVenueConfigStub,
  makeVenueEventStub,
  makeVenueSeatReservationLite,
  makeVenueTableConfigStub,
} from '../__mocks__/venue-reservations.fixtures';
import { signConfirmationShareToken } from '../utils/venue-reservation-confirmation-share.util';
import {
  createVenueReservationsServiceTestModule,
  type VenueReservationsServiceTestHarness,
} from '../testing/venue-reservations-service.test-module';
import type { CreateCheckoutSessionDto } from '../dto/create-checkout-session.dto';
import { VenueReservationsService } from './venue-reservations.service';

const EVENT_ID = 'event-1';
const LAYOUT_ITEM_ID = 'item-1';
const TABLE_CONFIG_ID = 'table-1';
const FLOOR_LAYOUT_ID = 'layout-1';

function hashPayToken(rawToken: string): string {
  return createHash('sha256').update(rawToken).digest('hex');
}

function makeCheckoutDto(
  overrides: Partial<CreateCheckoutSessionDto> = {},
): CreateCheckoutSessionDto {
  return {
    upcomingEventId: EVENT_ID,
    layoutItemId: LAYOUT_ITEM_ID,
    kind: 'catalog_table',
    venueTableConfigId: TABLE_CONFIG_ID,
    customerName: 'Ada Lovelace',
    customerEmail: 'ada@example.com',
    ...overrides,
  };
}

type PublishedVenueOptions = {
  eventOverrides?: Record<string, unknown>;
  configOverrides?: Record<string, unknown>;
  layoutItems?: Array<Record<string, unknown>>;
  tableOverrides?: Record<string, unknown>;
  paidReservations?: Array<Record<string, unknown>>;
  blockingReservations?: Array<Record<string, unknown>>;
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
  harness: VenueReservationsServiceTestHarness,
  options: PublishedVenueOptions = {},
) {
  const { floorLayout, repository } = harness;
  const eventVenueConfig = options.eventOverrides?.venueConfig as
    | Record<string, unknown>
    | undefined;
  const venueConfig = makeVenueConfigStub({
    ...options.configOverrides,
    ...eventVenueConfig,
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

  const event = makeVenueEventStub({
    ...eventRest,
    venueConfig,
  });

  prisma.event.findFirst.mockResolvedValue(event);
  prisma.upcomingVenueConfig.findUnique.mockResolvedValue(
    makeVenueConfigStub({
      ...options.configOverrides,
      reservationEventTemplate: null,
    }),
  );
  floorLayout.getPublicFloorLayoutForClient.mockResolvedValue(
    makeFloorLayoutStub(options.layoutItems ?? [makeCatalogTableLayoutItem()]),
  );
  floorLayout.getActiveFloorLayoutId.mockResolvedValue(FLOOR_LAYOUT_ID);
  prisma.venueTableConfig.findFirst.mockResolvedValue(
    makeVenueTableConfigStub(options.tableOverrides),
  );

  wireVenueSeatReservationFindMany(
    prisma,
    options.paidReservations ?? [],
    options.blockingReservations ?? [],
  );

  return prisma;
}

describe('VenueReservationsService', () => {
  let harness: VenueReservationsServiceTestHarness;
  let service: VenueReservationsService;

  beforeEach(async () => {
    harness = await createVenueReservationsServiceTestModule();
    service = harness.service;
    jest.clearAllMocks();
  });

  describe('webhook / reconcile smoke', () => {
    it('processStripeWebhookEvent ignores non venue_seat flows', async () => {
      const prisma = setupPublishedVenueContext(harness);
      void prisma;

      await expect(
        service.processStripeWebhookEvent({
          id: 'evt_1',
          type: 'checkout.session.completed',
          livemode: false,
          data: {
            object: {
              id: 'cs_1',
              metadata: { flow: 'booking_quote' },
            },
          },
        }),
      ).resolves.toEqual({ received: true, handled: false });
    });

    it('processStripeWebhookEvent returns handled false for unknown event types', async () => {
      setupPublishedVenueContext(harness);

      await expect(
        service.processStripeWebhookEvent({
          id: 'evt_2',
          type: 'payment_intent.succeeded',
          livemode: false,
          data: { object: {} },
        }),
      ).resolves.toEqual({ received: true, handled: false });
    });

    it('processStripeWebhookEvent marks already-paid reservation as handled', async () => {
      const prisma = setupPublishedVenueContext(harness);
      prisma.venueSeatReservation.findUnique.mockResolvedValue(
        makePaidVenueReservationStub(),
      );

      await expect(
        service.processStripeWebhookEvent({
          id: 'evt_paid',
          type: 'checkout.session.completed',
          livemode: false,
          data: {
            object: makePaidCheckoutSessionStub({ id: 'cs_paid' }),
          },
        }),
      ).resolves.toEqual({ received: true, handled: true });
    });

    it('processStripeWebhookEvent returns handled false when reservation missing', async () => {
      const prisma = setupPublishedVenueContext(harness);
      prisma.venueSeatReservation.findUnique.mockResolvedValue(null);

      await expect(
        service.processStripeWebhookEvent({
          id: 'evt_miss',
          type: 'checkout.session.completed',
          livemode: false,
          data: {
            object: {
              id: 'cs_miss',
              metadata: { flow: 'venue_seat' },
              payment_status: 'paid',
            },
          },
        }),
      ).resolves.toEqual({ received: true, handled: false });
    });

    it('processStripeWebhookEvent rejects unpaid checkout.session.completed', async () => {
      const prisma = setupPublishedVenueContext(harness);
      prisma.venueSeatReservation.findUnique.mockResolvedValue(
        makeVenueSeatReservationLite({
          id: 'res-2',
          amount: 50,
        }),
      );

      await expect(
        service.processStripeWebhookEvent({
          id: 'evt_unpaid',
          type: 'checkout.session.completed',
          livemode: false,
          data: {
            object: makeCheckoutSessionStub({
              id: 'cs_unpaid',
              payment_status: 'unpaid',
            }),
          },
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('getSessionStatus throws when reservation missing', async () => {
      const prisma = setupPublishedVenueContext(harness);
      prisma.venueSeatReservation.findUnique.mockResolvedValue(null);

      await expect(
        service.getSessionStatus('cs_missing'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('listAdminReservations rejects invalid eventDate', async () => {
      setupPublishedVenueContext(harness);

      await expect(
        service.listAdminReservations({ eventDate: 'not-a-date' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('getAvailability', () => {
    it('getAvailability returns reservationsOpen false when venue is not published', async () => {
      const prisma = createPrismaMock({
        event: {
          findFirst: jest.fn().mockResolvedValue(
            makeVenueEventStub({
              venueConfig: makeVenueConfigStub({ clientEnabled: false }),
            }),
          ),
        },
        upcomingVenueConfig: { findUnique: jest.fn() },
        venueLayoutClientSettings: {
          findFirst: jest.fn().mockResolvedValue(null),
        },
        venueSeatReservation: { findMany: jest.fn() },
      });
      harness.repository.asPrisma.mockReturnValue(prisma);
      harness.floorLayout.getActiveFloorLayoutId.mockResolvedValue(
        FLOOR_LAYOUT_ID,
      );

      const result = await service.getAvailability({
        upcomingEventId: EVENT_ID,
      });

      expect(result.reservationsOpen).toBe(false);
      expect(result.salesClosedReason).toBe('not_configured');
      expect(result.reservedLayoutItemIds).toEqual([]);
    });

    it('getAvailability includes paid seats when published and window is open', async () => {
      const paidSeat = {
        kind: 'CATALOG_TABLE',
        layoutItemId: LAYOUT_ITEM_ID,
        venueTableConfigId: TABLE_CONFIG_ID,
        customerName: 'Paid Guest',
      };
      setupPublishedVenueContext(harness, {
        layoutItems: [
          makeCatalogTableLayoutItem(),
          makeCatalogTableLayoutItem({
            id: 'item-2',
            venueTableConfigId: 'table-2',
          }),
        ],
        paidReservations: [paidSeat],
      });

      const result = await service.getAvailability({
        upcomingEventId: EVENT_ID,
      });

      expect(result.reservationsOpen).toBe(true);
      expect(result.salesClosedReason).toBeNull();
      expect(result.reservedLayoutItemIds).toContain(LAYOUT_ITEM_ID);
      expect(result.paidSeatHolders).toEqual([
        { layoutItemId: LAYOUT_ITEM_ID, customerName: 'Paid Guest' },
      ]);
    });
  });

  describe('createCheckoutSession', () => {
    it('createCheckoutSession rejects unpublished venue seating', async () => {
      setupPublishedVenueContext(harness, {
        eventOverrides: {
          venueConfig: makeVenueConfigStub({ clientEnabled: false }),
        },
      });

      await expect(
        service.createCheckoutSession(makeCheckoutDto()),
      ).rejects.toThrow(/not published/i);
    });

    it('createCheckoutSession rejects when reservation window is closed', async () => {
      setupPublishedVenueContext(harness, {
        configOverrides: {
          reservationOpensAt: new Date(Date.now() + 86_400_000),
          reservationClosesAt: new Date(Date.now() + 86_400_000 * 30),
        },
      });

      await expect(
        service.createCheckoutSession(makeCheckoutDto()),
      ).rejects.toThrow(/not open yet/i);
    });

    it('createCheckoutSession rejects when seat is already reserved', async () => {
      setupPublishedVenueContext(harness, {
        blockingReservations: [{ layoutItemId: LAYOUT_ITEM_ID }],
      });

      await expect(
        service.createCheckoutSession(makeCheckoutDto()),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('createCheckoutSession creates PENDING reservation and updates Stripe metadata', async () => {
      const prisma = setupPublishedVenueContext(harness);
      const createdReservation = makeVenueSeatReservationLite({
        id: 'res-new',
        stripeCheckoutSessionId: 'cs_test_created',
      });
      prisma.venueSeatReservation.create.mockResolvedValue(createdReservation);

      const result = await service.createCheckoutSession(makeCheckoutDto());

      expect(result).toEqual({
        clientSecret: 'cs_test_secret',
        reservationId: 'res-new',
      });

      const createCalls = prisma.venueSeatReservation.create.mock
        .calls as Array<
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
      const createData = createCalls[0][0].data;
      expect(createData.status).toBe(
        VenueSeatReservationStatus.PENDING_PAYMENT,
      );
      expect(createData.stripeCheckoutSessionId).toBe('cs_test_created');

      expect(
        harness.stripe.client.checkout.sessions.create,
      ).toHaveBeenCalledTimes(1);
      const stripeCreateCalls = harness.stripe.client.checkout.sessions.create
        .mock.calls as Array<[{ metadata: Record<string, string> }]>;
      expect(stripeCreateCalls[0][0].metadata.flow).toBe('venue_seat');

      const stripeUpdateCalls = harness.stripe.client.checkout.sessions.update
        .mock.calls as Array<[string, { metadata: Record<string, string> }]>;
      expect(stripeUpdateCalls).toHaveLength(1);
      expect(stripeUpdateCalls[0][0]).toBe('cs_test_created');
      const updateMetadata = stripeUpdateCalls[0][1];
      expect(updateMetadata.metadata.flow).toBe('venue_seat');
      expect(updateMetadata.metadata.reservationId).toBe('res-new');
      expect(updateMetadata.metadata.upcomingEventId).toBe(EVENT_ID);
    });

    it('createCheckoutSession rejects seat not on published floor plan', async () => {
      setupPublishedVenueContext(harness, {
        layoutItems: [
          makeCatalogTableLayoutItem({
            id: 'other-item',
            venueTableConfigId: 'other-table',
          }),
        ],
      });

      await expect(
        service.createCheckoutSession(makeCheckoutDto()),
      ).rejects.toThrow(/not on the published floor plan/i);
    });
  });

  describe('admin checkout / cash', () => {
    it('createAdminCashReservation creates PAID cash reservation', async () => {
      const prisma = setupPublishedVenueContext(harness);
      const saved = withReservationTimestamps(
        makePaidVenueReservationStub({
          id: 'cash-res-1',
          paymentChannel: 'CASH',
          stripeCheckoutSessionId: null,
        }),
      );
      prisma.venueSeatReservation.create.mockResolvedValue(saved);
      prisma.event.findUnique.mockResolvedValue({
        eventType: { name: 'Gala' },
      });

      const result = await service.createAdminCashReservation(
        'admin-1',
        makeCheckoutDto(),
      );

      expect(result.message).toBe('Cash reservation confirmed.');
      expect(result.reservation.status).toBe(VenueSeatReservationStatus.PAID);

      const createCalls = prisma.venueSeatReservation.create.mock
        .calls as Array<
        [
          {
            data: {
              status: VenueSeatReservationStatus;
              paymentChannel: string;
            };
          },
        ]
      >;
      const createData = createCalls[0][0].data;
      expect(createData.status).toBe(VenueSeatReservationStatus.PAID);
      expect(createData.paymentChannel).toBe('CASH');

      expect(
        harness.adminPaymentNotify.notifyPaymentOutcome,
      ).toHaveBeenCalledWith(
        expect.objectContaining({ outcome: 'PAID', flow: 'VENUE_SEAT' }),
      );
    });

    it('createAdminCashReservation rejects seat conflict', async () => {
      const prisma = setupPublishedVenueContext(harness);
      const conflictError = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint failed',
        { code: 'P2002', clientVersion: '5.0.0' },
      );
      prisma.venueSeatReservation.create.mockRejectedValue(conflictError);

      await expect(
        service.createAdminCashReservation('admin-1', makeCheckoutDto()),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('createAdminCheckoutSession returns payUrl for pending Stripe reservation', async () => {
      const prisma = setupPublishedVenueContext(harness);
      prisma.venueSeatReservation.create.mockImplementation(
        (args: { data: { payTokenHash: string | null } }) =>
          Promise.resolve(
            makeVenueSeatReservationLite({
              id: 'admin-res-1',
              payTokenHash: args.data.payTokenHash,
            }),
          ),
      );

      const result = await service.createAdminCheckoutSession(
        'admin-1',
        makeCheckoutDto(),
      );

      expect(result.reservationId).toBe('admin-res-1');
      expect(result.message).toBe('Payment link sent to customer.');
      expect(result.payUrl).toMatch(/\/pay\/venue-seat\?token=/);

      const createCalls = prisma.venueSeatReservation.create.mock
        .calls as Array<
        [
          {
            data: {
              status: VenueSeatReservationStatus;
              payTokenHash: string | null;
            };
          },
        ]
      >;
      const createData = createCalls[0][0].data;
      expect(createData.status).toBe(
        VenueSeatReservationStatus.PENDING_PAYMENT,
      );
      expect(createData.payTokenHash).toBeTruthy();
    });
  });

  describe('payment / webhook / reconcile', () => {
    it('processStripeWebhookEvent marks PENDING reservation PAID on paid checkout.session.completed', async () => {
      const prisma = setupPublishedVenueContext(harness);
      const pending = makeVenueSeatReservationLite({
        id: 'res-pending',
        amount: 100,
        currency: 'usd',
        customerEmailSentAt: null,
      });
      const paid = makePaidVenueReservationStub({
        id: 'res-pending',
        amount: 100,
        stripePaymentIntentId: 'pi_test_1',
      });

      prisma.venueSeatReservation.findUnique.mockResolvedValue(pending);
      prisma.venueSeatReservation.update.mockResolvedValue(paid);
      prisma.event.findUnique.mockResolvedValue({
        eventType: { name: 'Gala' },
      });
      harness.stripe.client.paymentIntents.retrieve.mockResolvedValue({
        payment_method: {
          type: 'card',
          card: { brand: 'visa', last4: '4242' },
        },
      });

      const result = await service.processStripeWebhookEvent({
        id: 'evt_mark_paid',
        type: 'checkout.session.completed',
        livemode: false,
        data: {
          object: makePaidCheckoutSessionStub({
            id: 'cs_test_1',
            amount_total: 10_000,
            currency: 'usd',
            payment_intent: 'pi_test_1',
          }),
        },
      });

      expect(result).toEqual({ received: true, handled: true });

      const updateCalls = prisma.venueSeatReservation.update.mock
        .calls as Array<[{ data: { status: VenueSeatReservationStatus } }]>;
      expect(updateCalls.length).toBeGreaterThanOrEqual(1);
      const paidUpdate = updateCalls[0][0].data;
      expect(paidUpdate.status).toBe(VenueSeatReservationStatus.PAID);
      expect(
        harness.adminPaymentNotify.notifyPaymentOutcome,
      ).toHaveBeenCalledWith(
        expect.objectContaining({ outcome: 'PAID', flow: 'VENUE_SEAT' }),
      );
    });

    it('processStripeWebhookEvent marks reservation EXPIRED on checkout.session.expired', async () => {
      const prisma = setupPublishedVenueContext(harness);
      const pending = makeVenueSeatReservationLite({
        id: 'res-expire',
        stripeCheckoutSessionId: 'cs_expired',
      });
      prisma.venueSeatReservation.findUnique.mockResolvedValue(pending);
      prisma.venueSeatReservation.update.mockResolvedValue({
        ...pending,
        status: VenueSeatReservationStatus.EXPIRED,
      });
      prisma.event.findUnique.mockResolvedValue({
        eventType: { name: 'Gala' },
      });

      const result = await service.processStripeWebhookEvent({
        id: 'evt_expired',
        type: 'checkout.session.expired',
        livemode: false,
        data: {
          object: {
            id: 'cs_expired',
            metadata: { flow: 'venue_seat' },
          },
        },
      });

      expect(result).toEqual({ received: true, handled: true });

      const updateCalls = prisma.venueSeatReservation.update.mock
        .calls as Array<[{ data: { status: VenueSeatReservationStatus } }]>;
      const expiredUpdate = updateCalls[0][0].data;
      expect(expiredUpdate.status).toBe(VenueSeatReservationStatus.EXPIRED);
      expect(
        harness.adminPaymentNotify.notifyPaymentOutcome,
      ).toHaveBeenCalledWith(
        expect.objectContaining({ outcome: 'EXPIRED', flow: 'VENUE_SEAT' }),
      );
    });

    it('getSessionStatus soft-reconciles paid Stripe session and returns refreshed reservation', async () => {
      const prisma = setupPublishedVenueContext(harness);
      const pending = makeVenueSeatReservationLite({
        id: 'res-reconcile',
        stripeCheckoutSessionId: 'cs_reconcile',
        amount: 100,
        customerEmailSentAt: null,
      });
      const paid = makePaidVenueReservationStub({
        id: 'res-reconcile',
        stripeCheckoutSessionId: 'cs_reconcile',
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
        payment_method: {
          type: 'card',
          card: { brand: 'visa', last4: '4242' },
        },
      });

      const result = await service.getSessionStatus('cs_reconcile');

      expect(result.stripeStatus).toBe('complete');
      expect(result.reservation.status).toBe(VenueSeatReservationStatus.PAID);
    });

    it('resolvePayCheckoutClientSecret throws NotFound for unknown token', async () => {
      const prisma = setupPublishedVenueContext(harness);
      prisma.venueSeatReservation.findFirst.mockResolvedValue(null);

      await expect(
        service.resolvePayCheckoutClientSecret('unknown-token'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('resolvePayCheckoutClientSecret throws BadRequest when checkout session id is missing', async () => {
      const prisma = setupPublishedVenueContext(harness);
      prisma.venueSeatReservation.findFirst.mockResolvedValue(
        makeVenueSeatReservationLite({
          stripeCheckoutSessionId: null,
        }),
      );

      await expect(
        service.resolvePayCheckoutClientSecret('some-token'),
      ).rejects.toThrow(/not available/i);
    });

    it('resolvePayCheckoutClientSecret returns client_secret for active pay token', async () => {
      const prisma = setupPublishedVenueContext(harness);
      const rawToken = 'pay-token-abc';
      const payTokenHash = hashPayToken(rawToken);
      prisma.venueSeatReservation.findFirst.mockResolvedValue(
        makeVenueSeatReservationLite({
          payTokenHash,
          stripeCheckoutSessionId: 'cs_pay',
          expiresAt: new Date(Date.now() + 86_400_000),
        }),
      );
      harness.stripe.client.checkout.sessions.retrieve.mockResolvedValue(
        makeCheckoutSessionStub({
          id: 'cs_pay',
          client_secret: 'cs_pay_secret',
          status: 'open',
          payment_status: 'unpaid',
        }),
      );

      await expect(
        service.resolvePayCheckoutClientSecret(rawToken),
      ).resolves.toBe('cs_pay_secret');
    });

    it('resolvePayCheckoutClientSecret rejects already completed checkout', async () => {
      const prisma = setupPublishedVenueContext(harness);
      prisma.venueSeatReservation.findFirst.mockResolvedValue(
        makeVenueSeatReservationLite({
          stripeCheckoutSessionId: 'cs_done',
          expiresAt: new Date(Date.now() + 86_400_000),
        }),
      );
      harness.stripe.client.checkout.sessions.retrieve.mockResolvedValue(
        makePaidCheckoutSessionStub({ id: 'cs_done' }),
      );

      await expect(
        service.resolvePayCheckoutClientSecret('done-token'),
      ).rejects.toThrow(/already been completed/i);
    });
  });

  describe('cancelAdminReservation', () => {
    it('cancelAdminReservation throws NotFound when reservation is missing', async () => {
      const prisma = setupPublishedVenueContext(harness);
      prisma.venueSeatReservation.findUnique.mockResolvedValue(null);

      await expect(
        service.cancelAdminReservation('missing-id'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('cancelAdminReservation cancels PENDING reservation and notifies CANCELLED', async () => {
      const prisma = setupPublishedVenueContext(harness);
      const pending = withReservationTimestamps(
        makeVenueSeatReservationLite({ id: 'cancel-me' }),
      );
      const cancelled = withReservationTimestamps(
        makeCancelledVenueReservationStub({ id: 'cancel-me' }),
      );

      prisma.venueSeatReservation.findUnique.mockResolvedValue(pending);
      prisma.venueSeatReservation.update.mockResolvedValue(cancelled);
      prisma.event.findUnique.mockResolvedValue({
        eventType: { name: 'Gala' },
      });

      const result = await service.cancelAdminReservation('cancel-me');

      expect(result.message).toBe('Reservation cancelled.');
      expect(result.reservation.status).toBe(
        VenueSeatReservationStatus.CANCELLED,
      );
      expect(
        harness.adminPaymentNotify.notifyPaymentOutcome,
      ).toHaveBeenCalledWith(
        expect.objectContaining({ outcome: 'CANCELLED', flow: 'VENUE_SEAT' }),
      );
    });

    it('cancelAdminReservation cancels PAID reservation and notifies CANCELLED', async () => {
      const prisma = setupPublishedVenueContext(harness);
      const paid = withReservationTimestamps(
        makePaidVenueReservationStub({ id: 'cancel-paid' }),
      );
      const cancelled = withReservationTimestamps(
        makeCancelledVenueReservationStub({ id: 'cancel-paid' }),
      );

      prisma.venueSeatReservation.findUnique.mockResolvedValue(paid);
      prisma.venueSeatReservation.update.mockResolvedValue(cancelled);
      prisma.event.findUnique.mockResolvedValue({
        eventType: { name: 'Gala' },
      });

      const result = await service.cancelAdminReservation('cancel-paid');

      expect(result.message).toBe('Reservation cancelled.');
      expect(result.reservation.status).toBe(
        VenueSeatReservationStatus.CANCELLED,
      );
      expect(
        harness.adminPaymentNotify.notifyPaymentOutcome,
      ).toHaveBeenCalledWith(
        expect.objectContaining({ outcome: 'CANCELLED', flow: 'VENUE_SEAT' }),
      );
    });

    it('cancelAdminReservation is idempotent when reservation is already cancelled', async () => {
      const prisma = setupPublishedVenueContext(harness);
      const cancelled = withReservationTimestamps(
        makeCancelledVenueReservationStub({ id: 'already-cancelled' }),
      );

      prisma.venueSeatReservation.findUnique
        .mockResolvedValueOnce(cancelled)
        .mockResolvedValueOnce(withReservationTimestamps(cancelled));

      const result = await service.cancelAdminReservation('already-cancelled');

      expect(result.message).toBe('Reservation already cancelled.');
      expect(result.reservation.status).toBe(
        VenueSeatReservationStatus.CANCELLED,
      );
      expect(prisma.venueSeatReservation.update).not.toHaveBeenCalled();
      expect(
        harness.adminPaymentNotify.notifyPaymentOutcome,
      ).not.toHaveBeenCalled();
    });
  });

  describe('payment failure / expire / sold-out deep QA', () => {
    it('processStripeWebhookEvent rejects amount mismatch on paid completed session', async () => {
      const prisma = setupPublishedVenueContext(harness);
      prisma.venueSeatReservation.findUnique.mockResolvedValue(
        makeVenueSeatReservationLite({
          id: 'res-mismatch',
          amount: 100,
          currency: 'usd',
          stripeCheckoutSessionId: 'cs_mismatch',
        }),
      );

      await expect(
        service.processStripeWebhookEvent({
          id: 'evt_mismatch',
          type: 'checkout.session.completed',
          livemode: false,
          data: {
            object: makeAmountMismatchCheckoutSessionStub({
              id: 'cs_mismatch',
            }),
          },
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.venueSeatReservation.update).not.toHaveBeenCalled();
    });

    it('processStripeWebhookEvent unpaid completed still rejects (payment failure)', async () => {
      const prisma = setupPublishedVenueContext(harness);
      prisma.venueSeatReservation.findUnique.mockResolvedValue(
        makeVenueSeatReservationLite({
          stripeCheckoutSessionId: 'cs_unpaid_complete',
        }),
      );

      await expect(
        service.processStripeWebhookEvent({
          id: 'evt_unpaid',
          type: 'checkout.session.completed',
          livemode: false,
          data: {
            object: makeUnpaidCompletedCheckoutSessionStub(),
          },
        }),
      ).rejects.toThrow(/not paid/i);
      expect(prisma.venueSeatReservation.update).not.toHaveBeenCalled();
    });

    it('processStripeWebhookEvent already-PAID does not update again (idempotent)', async () => {
      const prisma = setupPublishedVenueContext(harness);
      prisma.venueSeatReservation.findUnique.mockResolvedValue(
        makePaidVenueReservationStub({
          id: 'res-dup',
          stripeCheckoutSessionId: 'cs_dup',
        }),
      );

      const result = await service.processStripeWebhookEvent({
        id: 'evt_dup',
        type: 'checkout.session.completed',
        livemode: false,
        data: {
          object: makePaidCheckoutSessionStub({ id: 'cs_dup' }),
        },
      });

      expect(result).toEqual({ received: true, handled: true });
      expect(prisma.venueSeatReservation.update).not.toHaveBeenCalled();
      expect(
        harness.adminPaymentNotify.notifyPaymentOutcome,
      ).not.toHaveBeenCalled();
    });

    it('getSessionStatus soft-reconcile failure still returns reservation status', async () => {
      const prisma = setupPublishedVenueContext(harness);
      const pending = makeVenueSeatReservationLite({
        id: 'res-soft-fail',
        stripeCheckoutSessionId: 'cs_soft_fail',
        amount: 100,
        currency: 'usd',
      });

      prisma.venueSeatReservation.findUnique.mockResolvedValue(pending);
      harness.stripe.client.checkout.sessions.retrieve.mockResolvedValue(
        makeAmountMismatchCheckoutSessionStub({ id: 'cs_soft_fail' }),
      );

      const result = await service.getSessionStatus('cs_soft_fail');

      expect(result.stripeStatus).toBe('complete');
      expect(result.reservation.status).toBe(
        VenueSeatReservationStatus.PENDING_PAYMENT,
      );
      expect(prisma.venueSeatReservation.update).not.toHaveBeenCalled();
    });

    it('checkout.session.expired is no-op when reservation already PAID', async () => {
      const prisma = setupPublishedVenueContext(harness);
      prisma.venueSeatReservation.findUnique.mockResolvedValue(
        makePaidVenueReservationStub({
          stripeCheckoutSessionId: 'cs_paid_expire',
        }),
      );

      const result = await service.processStripeWebhookEvent({
        id: 'evt_expire_paid',
        type: 'checkout.session.expired',
        livemode: false,
        data: {
          object: {
            id: 'cs_paid_expire',
            metadata: { flow: 'venue_seat' },
          },
        },
      });

      expect(result).toEqual({ received: true, handled: true });
      expect(prisma.venueSeatReservation.update).not.toHaveBeenCalled();
      expect(
        harness.adminPaymentNotify.notifyPaymentOutcome,
      ).not.toHaveBeenCalled();
    });

    it('checkout.session.expired is no-op when reservation is missing', async () => {
      const prisma = setupPublishedVenueContext(harness);
      prisma.venueSeatReservation.findUnique.mockResolvedValue(null);

      const result = await service.processStripeWebhookEvent({
        id: 'evt_expire_missing',
        type: 'checkout.session.expired',
        livemode: false,
        data: {
          object: {
            id: 'cs_missing_expire',
            metadata: { flow: 'venue_seat' },
          },
        },
      });

      expect(result).toEqual({ received: true, handled: true });
      expect(prisma.venueSeatReservation.update).not.toHaveBeenCalled();
    });

    it('resolvePayCheckoutClientSecret expires and rejects when Stripe session expired', async () => {
      const prisma = setupPublishedVenueContext(harness);
      const pending = makeVenueSeatReservationLite({
        id: 'res-stripe-expired',
        stripeCheckoutSessionId: 'cs_stripe_expired',
        expiresAt: new Date(Date.now() + 86_400_000),
      });
      prisma.venueSeatReservation.findFirst.mockResolvedValue(pending);
      prisma.venueSeatReservation.findUnique.mockResolvedValue(pending);
      prisma.venueSeatReservation.update.mockResolvedValue({
        ...pending,
        status: VenueSeatReservationStatus.EXPIRED,
      });
      prisma.event.findUnique.mockResolvedValue({
        eventType: { name: 'Gala' },
      });
      harness.stripe.client.checkout.sessions.retrieve.mockResolvedValue(
        makeExpiredCheckoutSessionStub({ id: 'cs_stripe_expired' }),
      );

      await expect(
        service.resolvePayCheckoutClientSecret('active-looking-token'),
      ).rejects.toThrow(/Payment link has expired/i);

      const updateCalls = prisma.venueSeatReservation.update.mock
        .calls as Array<[{ data: { status: VenueSeatReservationStatus } }]>;
      expect(updateCalls[0][0].data.status).toBe(
        VenueSeatReservationStatus.EXPIRED,
      );
    });

    it('resolvePayCheckoutClientSecret rejects when pay-token TTL elapsed', async () => {
      const prisma = setupPublishedVenueContext(harness);
      const expired = makeExpiredPayTokenReservationStub({
        payTokenHash: hashPayToken('stale-token'),
      });
      prisma.venueSeatReservation.findFirst.mockResolvedValue(expired);
      prisma.venueSeatReservation.findUnique.mockResolvedValue(expired);
      prisma.venueSeatReservation.update.mockResolvedValue({
        ...expired,
        status: VenueSeatReservationStatus.EXPIRED,
      });
      prisma.event.findUnique.mockResolvedValue({
        eventType: { name: 'Gala' },
      });

      await expect(
        service.resolvePayCheckoutClientSecret('stale-token'),
      ).rejects.toThrow(/Payment link has expired/i);
    });

    it('createCheckoutSession rejects when all seats are sold', async () => {
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

      await expect(
        service.createCheckoutSession(makeCheckoutDto()),
      ).rejects.toThrow(/All seats are sold/i);
    });

    it('createCheckoutSession rejects when reservation window has ended', async () => {
      setupPublishedVenueContext(harness, {
        configOverrides: {
          reservationOpensAt: new Date(Date.now() - 86_400_000 * 30),
          reservationClosesAt: new Date(Date.now() - 86_400_000),
        },
      });

      await expect(
        service.createCheckoutSession(makeCheckoutDto()),
      ).rejects.toThrow(/have closed/i);
    });

    it('getAvailability returns sold_out when every layout seat is paid', async () => {
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
            customerName: 'Sold Guest',
          }),
        ],
      });

      const result = await service.getAvailability({
        upcomingEventId: EVENT_ID,
      });

      expect(result.reservationsOpen).toBe(false);
      expect(result.salesClosedReason).toBe('sold_out');
      expect(result.reservedLayoutItemIds).toContain(LAYOUT_ITEM_ID);
    });

    it('createAdminCheckoutSession rejects when floor layout is missing', async () => {
      setupPublishedVenueContext(harness, {
        configOverrides: { floorLayoutId: null },
        eventOverrides: {
          venueConfig: makeVenueConfigStub({ floorLayoutId: null }),
        },
      });
      harness.floorLayout.getActiveFloorLayoutId.mockResolvedValue(null);

      await expect(
        service.createAdminCheckoutSession('admin-1', makeCheckoutDto()),
      ).rejects.toThrow(/Floor layout is not configured/i);
    });

    it('getSessionStatus unpaid open session leaves reservation PENDING', async () => {
      const prisma = setupPublishedVenueContext(harness);
      const pending = makeVenueSeatReservationLite({
        id: 'res-unpaid-status',
        stripeCheckoutSessionId: 'cs_open_unpaid',
      });
      prisma.venueSeatReservation.findUnique.mockResolvedValue(pending);
      harness.stripe.client.checkout.sessions.retrieve.mockResolvedValue(
        makeCheckoutSessionStub({
          id: 'cs_open_unpaid',
          status: 'open',
          payment_status: 'unpaid',
        }),
      );

      const result = await service.getSessionStatus('cs_open_unpaid');

      expect(result.stripeStatus).toBe('open');
      expect(result.reservation.status).toBe(
        VenueSeatReservationStatus.PENDING_PAYMENT,
      );
      expect(prisma.venueSeatReservation.update).not.toHaveBeenCalled();
    });

    it('getAdminAvailability returns paid and pending layout ids', async () => {
      setupPublishedVenueContext(harness, {
        paidReservations: [
          makePaidVenueReservationStub({
            layoutItemId: LAYOUT_ITEM_ID,
            venueTableConfigId: TABLE_CONFIG_ID,
            customerName: 'Paid Guest',
          }),
        ],
        blockingReservations: [
          makeVenueSeatReservationLite({
            id: 'pending-block',
            layoutItemId: 'item-pending',
            status: VenueSeatReservationStatus.PENDING_PAYMENT,
          }),
        ],
      });

      const result = await service.getAdminAvailability({
        upcomingEventId: EVENT_ID,
      });

      expect(result.upcomingEventId).toBe(EVENT_ID);
      expect(result.reservedLayoutItemIds).toContain(LAYOUT_ITEM_ID);
      expect(result.pendingLayoutItemIds).toContain('item-pending');
      expect(result.paidSeatHolders[0]?.customerName).toBe('Paid Guest');
    });

    it('listAdminReservations returns paginated admin rows', async () => {
      const prisma = setupPublishedVenueContext(harness);
      const row = withReservationTimestamps(
        makeVenueSeatReservationLite({
          id: 'list-1',
          venueTableConfig: { tableName: 'T1', size: 'LARGE' },
        }),
      );
      prisma.venueSeatReservation.count.mockResolvedValue(1);
      prisma.venueSeatReservation.findMany.mockResolvedValue([row]);

      const result = await service.listAdminReservations({
        page: 1,
        perPage: 10,
        status: VenueSeatReservationStatus.PENDING_PAYMENT,
        layoutItemId: LAYOUT_ITEM_ID,
        upcomingEventId: EVENT_ID,
      } as never);

      expect(result.meta.totalItems).toBe(1);
      expect(result.reservations).toHaveLength(1);
      expect(result.reservations[0].id).toBe('list-1');
    });

    it('resendAdminPaidConfirmationEmail rejects non-PAID reservation', async () => {
      const prisma = setupPublishedVenueContext(harness);
      prisma.venueSeatReservation.findUnique.mockResolvedValue(
        makeVenueSeatReservationLite({ id: 'resend-pending' }),
      );

      await expect(
        service.resendAdminPaidConfirmationEmail('resend-pending'),
      ).rejects.toThrow(/Only paid reservations/i);
    });

    it('resendAdminPaidConfirmationEmail sends for PAID reservation', async () => {
      const prisma = setupPublishedVenueContext(harness);
      const paid = withReservationTimestamps(
        makePaidVenueReservationStub({
          id: 'resend-paid',
          customerEmailSentAt: null,
          venueTableConfig: { tableName: 'T1', size: 'LARGE' },
        }),
      );
      prisma.venueSeatReservation.findUnique.mockResolvedValue(paid);
      prisma.venueSeatReservation.update.mockResolvedValue(paid);
      prisma.event.findUnique.mockResolvedValue({
        eventType: { name: 'Gala' },
      });
      prisma.upcomingVenueConfig.findUnique.mockResolvedValue(
        makeVenueConfigStub(),
      );

      const result =
        await service.resendAdminPaidConfirmationEmail('resend-paid');

      expect(result.message).toBe('Confirmation email sent.');
      expect(result.reservationId).toBe('resend-paid');
      expect(harness.mail.sendTransactional).toHaveBeenCalled();
    });

    it('resendAdminPaidConfirmationForCustomers reports missing names', async () => {
      const prisma = setupPublishedVenueContext(harness);
      prisma.venueSeatReservation.findFirst.mockResolvedValue(null);

      const result = await service.resendAdminPaidConfirmationForCustomers([
        'Missing Guest',
      ]);

      expect(result.message).toBe('Confirmation resend finished.');
      expect(result.results[0]).toEqual(
        expect.objectContaining({
          customerName: 'Missing Guest',
          sent: false,
          error: 'Paid reservation not found.',
        }),
      );
    });

    it('resendAdminPaidConfirmationForCustomers rejects empty names', async () => {
      setupPublishedVenueContext(harness);

      await expect(
        service.resendAdminPaidConfirmationForCustomers(['  ', '']),
      ).rejects.toThrow(/At least one customer name/i);
    });

    it('getConfirmationPdfDownload rejects invalid token', async () => {
      setupPublishedVenueContext(harness);

      await expect(
        service.getConfirmationPdfDownload('not-a-valid-token'),
      ).rejects.toThrow(/Invalid confirmation download link/i);
    });

    it('getConfirmationPdfDownload returns buffer for valid PAID share token', async () => {
      const prisma = setupPublishedVenueContext(harness);
      const paidAt = new Date('2026-08-01T12:00:00.000Z');
      const paid = withReservationTimestamps(
        makePaidVenueReservationStub({
          id: 'pdf-res-1',
          paidAt,
          kind: VenueSeatKind.CATALOG_TABLE,
          venueTableConfig: { tableName: 'T1', size: 'LARGE' },
        }),
      );
      prisma.venueSeatReservation.findUnique.mockResolvedValue(paid);
      prisma.upcomingVenueConfig.findUnique.mockResolvedValue(
        makeVenueConfigStub(),
      );
      harness.config.get.mockImplementation((key: string) => {
        if (key === 'JWT_SECRET') return 'test-share-secret';
        return undefined;
      });

      const token = signConfirmationShareToken(
        'pdf-res-1',
        paidAt.toISOString(),
        'test-share-secret',
      );

      const result = await service.getConfirmationPdfDownload(token);

      expect(result.filename).toBe('shamell-reservation-confirmation.pdf');
      expect(Buffer.isBuffer(result.buffer)).toBe(true);
      expect(result.buffer.length).toBeGreaterThan(0);
    });

    it('getSessionStatus throws when Stripe retrieve fails', async () => {
      const prisma = setupPublishedVenueContext(harness);
      prisma.venueSeatReservation.findUnique.mockResolvedValue(
        makeVenueSeatReservationLite({
          stripeCheckoutSessionId: 'cs_missing_stripe',
        }),
      );
      harness.stripe.client.checkout.sessions.retrieve.mockRejectedValue(
        new Error('stripe down'),
      );

      await expect(
        service.getSessionStatus('cs_missing_stripe'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('resolvePayCheckoutClientSecret rejects missing client_secret', async () => {
      const prisma = setupPublishedVenueContext(harness);
      prisma.venueSeatReservation.findFirst.mockResolvedValue(
        makeVenueSeatReservationLite({
          stripeCheckoutSessionId: 'cs_no_secret',
          expiresAt: new Date(Date.now() + 86_400_000),
        }),
      );
      harness.stripe.client.checkout.sessions.retrieve.mockResolvedValue(
        makeCheckoutSessionStub({
          id: 'cs_no_secret',
          status: 'open',
          payment_status: 'unpaid',
          client_secret: null,
        }),
      );

      await expect(
        service.resolvePayCheckoutClientSecret('token-no-secret'),
      ).rejects.toThrow(/Could not start checkout/i);
    });

    it('handleWebhookEvent rejects missing stripe-signature', async () => {
      setupPublishedVenueContext(harness);

      await expect(
        service.handleWebhookEvent(Buffer.from('{}'), undefined),
      ).rejects.toThrow(/Missing stripe-signature/i);
    });

    it('handleWebhookEvent constructs event and processes venue_seat paid', async () => {
      const prisma = setupPublishedVenueContext(harness);
      const pending = makeVenueSeatReservationLite({
        id: 'wh-res',
        amount: 100,
        currency: 'usd',
        customerEmailSentAt: null,
      });
      const paid = makePaidVenueReservationStub({ id: 'wh-res', amount: 100 });
      prisma.venueSeatReservation.findUnique.mockResolvedValue(pending);
      prisma.venueSeatReservation.update.mockResolvedValue(paid);
      prisma.event.findUnique.mockResolvedValue({
        eventType: { name: 'Gala' },
      });
      harness.stripe.client.webhooks.constructEvent.mockReturnValue({
        id: 'evt_wh',
        type: 'checkout.session.completed',
        livemode: false,
        data: {
          object: makePaidCheckoutSessionStub({
            id: 'cs_test_1',
            amount_total: 10_000,
            currency: 'usd',
            payment_intent: 'pi_test_1',
          }),
        },
      });
      harness.stripe.client.paymentIntents.retrieve.mockResolvedValue({
        payment_method: {
          type: 'card',
          card: { brand: 'visa', last4: '4242' },
        },
      });

      const result = await service.handleWebhookEvent(
        Buffer.from('{}'),
        'sig_test',
      );

      expect(result).toEqual({ received: true, handled: true });
    });

    it('createCheckoutSession supports standalone_chair seats', async () => {
      const prisma = setupPublishedVenueContext(harness, {
        layoutItems: [
          {
            id: LAYOUT_ITEM_ID,
            kind: 'standalone_chair',
            venueTableConfigId: null,
            venueStandaloneChairId: 'chair-1',
          },
        ],
      });
      prisma.venueStandaloneChair.findFirst.mockResolvedValue({
        id: 'chair-1',
        isActive: true,
        unitPrice: 25,
        chairName: 'Chair A',
        sortOrder: 0,
      });
      prisma.venueStandaloneChair.findMany.mockResolvedValue([
        { id: 'chair-1' },
      ]);
      prisma.venueSeatReservation.create.mockResolvedValue(
        makeVenueSeatReservationLite({
          id: 'chair-res',
          kind: VenueSeatKind.STANDALONE_CHAIR,
          venueTableConfigId: null,
        }),
      );

      const result = await service.createCheckoutSession(
        makeCheckoutDto({
          kind: 'standalone_chair',
          venueTableConfigId: undefined,
        }),
      );

      expect(result.reservationId).toBe('chair-res');
      expect(result.clientSecret).toBe('cs_test_secret');
    });

    it('processStripeWebhookEvent ignores expired events for non venue_seat flows', async () => {
      setupPublishedVenueContext(harness);

      await expect(
        service.processStripeWebhookEvent({
          id: 'evt_exp_other',
          type: 'checkout.session.expired',
          livemode: false,
          data: {
            object: {
              id: 'cs_other',
              metadata: { flow: 'class_session' },
            },
          },
        }),
      ).resolves.toEqual({ received: true, handled: false });
    });

    it('processStripeWebhookEvent rejects expired payload without session id', async () => {
      setupPublishedVenueContext(harness);

      await expect(
        service.processStripeWebhookEvent({
          id: 'evt_exp_bad',
          type: 'checkout.session.expired',
          livemode: false,
          data: {
            object: {
              metadata: { flow: 'venue_seat' },
            },
          },
        }),
      ).rejects.toThrow(/Invalid checkout.session.expired/i);
    });

    it('createAdminCheckoutSession rejects when venue event is missing', async () => {
      const prisma = setupPublishedVenueContext(harness);
      prisma.event.findFirst.mockResolvedValue(null);

      await expect(
        service.createAdminCheckoutSession('admin-1', makeCheckoutDto()),
      ).rejects.toThrow(/Venue upcoming event not found/i);
    });
  });
});
