import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import {
  ReservationEventScheduleMode,
  UpcomingExperienceType,
} from '@prisma/client';
import {
  makeCheckoutClassSessionStub,
  makeClassesPublicEventStub,
  makeFixedPublicCheckoutVenueStub,
  makeFixedTicketEventStub,
  makeMonthPackageVenueEnabledStub,
} from '../__mocks__/upcoming-events.fixtures';
import {
  createUpcomingEventsCheckoutServiceTestModule,
  type UpcomingEventsCheckoutServiceTestHarness,
} from '../testing/upcoming-events-checkout-service.test-module';
import * as classMonthPackageUtil from '../utils/class-month-package.util';
import * as fixedTicketUtil from '../utils/upcoming-fixed-ticket.util';
import type { CreateClassCheckoutDto } from '../dto/create-class-checkout.dto';
import type { CreateClassBundleCheckoutDto } from '../dto/create-class-bundle-checkout.dto';
import type { CreateClassPackageCheckoutDto } from '../dto/create-class-package-checkout.dto';
import type { CreateFixedEventCheckoutDto } from '../dto/create-fixed-event-checkout.dto';

describe('UpcomingEventsCheckoutService (money matrix)', () => {
  let harness: UpcomingEventsCheckoutServiceTestHarness;
  let service: UpcomingEventsCheckoutServiceTestHarness['service'];
  let repository: UpcomingEventsCheckoutServiceTestHarness['repository'];
  let packagesRepository: UpcomingEventsCheckoutServiceTestHarness['packagesRepository'];
  let stripe: UpcomingEventsCheckoutServiceTestHarness['stripe'];

  const classDto: CreateClassCheckoutDto = {
    sessionId: 'session-1',
    customerName: 'Ada Lovelace',
    customerEmail: 'ada@example.com',
  };

  const bundleDto: CreateClassBundleCheckoutDto = {
    sessionIds: ['session-1', 'session-2'],
    customerName: 'Ada Lovelace',
    customerEmail: 'ada@example.com',
  };

  const packageDto: CreateClassPackageCheckoutDto = {
    monthIso: '2026-08',
    customerName: 'Ada Lovelace',
    customerEmail: 'ada@example.com',
  };

  const fixedDto: CreateFixedEventCheckoutDto = {
    customerName: 'Ada Lovelace',
    customerEmail: 'ada@example.com',
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    harness = await createUpcomingEventsCheckoutServiceTestModule();
    service = harness.service;
    repository = harness.repository;
    packagesRepository = harness.packagesRepository;
    stripe = harness.stripe;
    repository.seatsRemaining.mockResolvedValue(10);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('createClassCheckout', () => {
    it('creates PENDING enrollment and returns clientSecret', async () => {
      repository.findPublicUpcomingBySlug.mockResolvedValue(
        makeClassesPublicEventStub(),
      );
      repository.findActiveClassSessionForEvent.mockResolvedValue(
        makeCheckoutClassSessionStub(),
      );
      repository.createClassEnrollment.mockResolvedValue({ id: 'enroll-1' });

      await expect(
        service.createClassCheckout('salsa-night', classDto),
      ).resolves.toEqual({
        clientSecret: 'sec_1',
        enrollmentId: 'enroll-1',
      });
      expect(repository.createClassEnrollment).toHaveBeenCalled();

      const createCalls = stripe.client.checkout.sessions.create.mock.calls as [
        [
          {
            metadata: { flow?: string; correlationId?: string };
            payment_intent_data?: {
              description?: string;
              receipt_email?: string;
              metadata?: { flow?: string; correlationId?: string };
            };
            expand?: string[];
          },
        ],
      ];
      expect(createCalls[0][0].metadata.flow).toBe('class_session');
      expect(createCalls[0][0].metadata.correlationId).toMatch(
        /^[0-9a-f-]{36}$/i,
      );
      expect(createCalls[0][0].payment_intent_data?.metadata?.flow).toBe(
        'class_session',
      );
      expect(
        createCalls[0][0].payment_intent_data?.metadata?.correlationId,
      ).toBe(createCalls[0][0].metadata.correlationId);
      expect(createCalls[0][0].payment_intent_data?.receipt_email).toBe(
        'ada@example.com',
      );
      expect(createCalls[0][0].payment_intent_data?.description).toContain(
        'class',
      );
      expect(createCalls[0][0].expand).toEqual(['payment_intent']);

      expect(stripe.client.paymentIntents.update).toHaveBeenCalled();
      const piUpdateCalls = stripe.client.paymentIntents.update.mock.calls as [
        [string, { metadata?: Record<string, string> }],
      ];
      expect(piUpdateCalls.some((c) => c[0] === 'pi_1')).toBe(true);
      expect(
        piUpdateCalls.some((c) => c[1]?.metadata?.checkoutSessionId === 'cs_1'),
      ).toBe(true);

      expect(stripe.client.checkout.sessions.update).toHaveBeenCalled();
      const updateArgs = stripe.client.checkout.sessions.update.mock
        .calls[0] as [
        string,
        {
          metadata?: {
            flow?: string;
            correlationId?: string;
            enrollmentId?: string;
          };
        },
      ];
      expect(updateArgs[0]).toBe('cs_1');
      expect(updateArgs[1]?.metadata?.flow).toBe('class_session');
      expect(updateArgs[1]?.metadata?.enrollmentId).toBe('enroll-1');
      expect(updateArgs[1]?.metadata?.correlationId).toBe(
        createCalls[0][0].metadata.correlationId,
      );
    });

    it('rejects non-CLASSES experience', async () => {
      repository.findPublicUpcomingBySlug.mockResolvedValue(
        makeClassesPublicEventStub({
          experienceType: UpcomingExperienceType.VENUE_SEATING,
        }),
      );
      await expect(
        service.createClassCheckout('gala', classDto),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('throws NotFound when session missing', async () => {
      repository.findPublicUpcomingBySlug.mockResolvedValue(
        makeClassesPublicEventStub(),
      );
      repository.findActiveClassSessionForEvent.mockResolvedValue(null);
      await expect(
        service.createClassCheckout('salsa-night', classDto),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('rejects ended session', async () => {
      repository.findPublicUpcomingBySlug.mockResolvedValue(
        makeClassesPublicEventStub(),
      );
      repository.findActiveClassSessionForEvent.mockResolvedValue(
        makeCheckoutClassSessionStub({
          endsAt: new Date('2020-01-01T00:00:00.000Z'),
        }),
      );
      await expect(
        service.createClassCheckout('salsa-night', classDto),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects sold-out session', async () => {
      repository.findPublicUpcomingBySlug.mockResolvedValue(
        makeClassesPublicEventStub(),
      );
      repository.findActiveClassSessionForEvent.mockResolvedValue(
        makeCheckoutClassSessionStub(),
      );
      repository.seatsRemaining.mockResolvedValue(0);
      await expect(
        service.createClassCheckout('salsa-night', classDto),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('rejects invalid session price', async () => {
      repository.findPublicUpcomingBySlug.mockResolvedValue(
        makeClassesPublicEventStub(),
      );
      repository.findActiveClassSessionForEvent.mockResolvedValue(
        makeCheckoutClassSessionStub({ price: 0.2 }),
      );
      await expect(
        service.createClassCheckout('salsa-night', classDto),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects missing Stripe client_secret', async () => {
      repository.findPublicUpcomingBySlug.mockResolvedValue(
        makeClassesPublicEventStub(),
      );
      repository.findActiveClassSessionForEvent.mockResolvedValue(
        makeCheckoutClassSessionStub(),
      );
      stripe.client.checkout.sessions.create = jest.fn().mockResolvedValue({
        id: 'cs_1',
        client_secret: null,
      });
      await expect(
        service.createClassCheckout('salsa-night', classDto),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('createClassBundleCheckout', () => {
    function twoSameDaySessions() {
      const dayStart = Date.now() + 7 * 86_400_000;
      const startsAt = new Date(dayStart);
      const endsAt = new Date(dayStart + 3_600_000);
      return [
        makeCheckoutClassSessionStub({
          id: 'session-1',
          startsAt,
          endsAt,
          price: 40,
        }),
        makeCheckoutClassSessionStub({
          id: 'session-2',
          startsAt: new Date(dayStart + 2 * 3_600_000),
          endsAt: new Date(dayStart + 3 * 3_600_000),
          price: 40,
          weekday: 1,
        }),
      ];
    }

    it('creates package enrollment for multi-session same day', async () => {
      repository.findPublicUpcomingBySlug.mockResolvedValue(
        makeClassesPublicEventStub(),
      );
      repository.findActiveClassSessionsByIdsForEvent.mockResolvedValue(
        twoSameDaySessions(),
      );
      repository.createClassPackageEnrollment.mockResolvedValue({
        id: 'pkg-1',
      });
      repository.createClassEnrollment.mockResolvedValue({ id: 'child-1' });
      repository.createClassPackageEnrollmentItem.mockResolvedValue({});

      await expect(
        service.createClassBundleCheckout('salsa-night', bundleDto),
      ).resolves.toEqual({
        clientSecret: 'sec_1',
        packageEnrollmentId: 'pkg-1',
      });
      expect(repository.createClassEnrollment).toHaveBeenCalledTimes(2);
    });

    it('rejects duplicate session ids', async () => {
      repository.findPublicUpcomingBySlug.mockResolvedValue(
        makeClassesPublicEventStub(),
      );
      await expect(
        service.createClassBundleCheckout('salsa-night', {
          ...bundleDto,
          sessionIds: ['session-1', 'session-1'],
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('throws NotFound when a session id is missing', async () => {
      repository.findPublicUpcomingBySlug.mockResolvedValue(
        makeClassesPublicEventStub(),
      );
      repository.findActiveClassSessionsByIdsForEvent.mockResolvedValue([
        makeCheckoutClassSessionStub({ id: 'session-1' }),
      ]);
      await expect(
        service.createClassBundleCheckout('salsa-night', bundleDto),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('rejects ended sessions', async () => {
      repository.findPublicUpcomingBySlug.mockResolvedValue(
        makeClassesPublicEventStub(),
      );
      repository.findActiveClassSessionsByIdsForEvent.mockResolvedValue([
        makeCheckoutClassSessionStub({
          id: 'session-1',
          endsAt: new Date('2020-01-01T00:00:00.000Z'),
        }),
        makeCheckoutClassSessionStub({ id: 'session-2' }),
      ]);
      await expect(
        service.createClassBundleCheckout('salsa-night', bundleDto),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects sold-out sessions', async () => {
      repository.findPublicUpcomingBySlug.mockResolvedValue(
        makeClassesPublicEventStub(),
      );
      repository.findActiveClassSessionsByIdsForEvent.mockResolvedValue(
        twoSameDaySessions(),
      );
      repository.seatsRemaining.mockResolvedValue(0);
      await expect(
        service.createClassBundleCheckout('salsa-night', bundleDto),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('rejects sessions on different calendar days', async () => {
      const day1 = Date.now() + 7 * 86_400_000;
      const day2 = day1 + 86_400_000;
      repository.findPublicUpcomingBySlug.mockResolvedValue(
        makeClassesPublicEventStub(),
      );
      repository.findActiveClassSessionsByIdsForEvent.mockResolvedValue([
        makeCheckoutClassSessionStub({
          id: 'session-1',
          startsAt: new Date(day1),
          endsAt: new Date(day1 + 3_600_000),
        }),
        makeCheckoutClassSessionStub({
          id: 'session-2',
          startsAt: new Date(day2),
          endsAt: new Date(day2 + 3_600_000),
        }),
      ]);
      await expect(
        service.createClassBundleCheckout('salsa-night', bundleDto),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects invalid bundle total', async () => {
      const dayStart = Date.now() + 7 * 86_400_000;
      repository.findPublicUpcomingBySlug.mockResolvedValue(
        makeClassesPublicEventStub(),
      );
      repository.findActiveClassSessionsByIdsForEvent.mockResolvedValue([
        makeCheckoutClassSessionStub({
          id: 'session-1',
          price: 0.1,
          startsAt: new Date(dayStart),
          endsAt: new Date(dayStart + 3_600_000),
        }),
        makeCheckoutClassSessionStub({
          id: 'session-2',
          price: 0.1,
          startsAt: new Date(dayStart + 2 * 3_600_000),
          endsAt: new Date(dayStart + 3 * 3_600_000),
        }),
      ]);
      await expect(
        service.createClassBundleCheckout('salsa-night', bundleDto),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects missing Stripe client_secret', async () => {
      repository.findPublicUpcomingBySlug.mockResolvedValue(
        makeClassesPublicEventStub(),
      );
      repository.findActiveClassSessionsByIdsForEvent.mockResolvedValue(
        twoSameDaySessions(),
      );
      stripe.client.checkout.sessions.create = jest.fn().mockResolvedValue({
        id: 'cs_1',
        client_secret: null,
      });
      await expect(
        service.createClassBundleCheckout('salsa-night', bundleDto),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('createClassCartCheckout', () => {
    const cartDto = {
      sessionIds: ['session-1', 'session-2'],
      customerName: 'Ada Lovelace',
      customerEmail: 'ada@example.com',
    };

    function twoDifferentDaySessions() {
      const day1 = Date.now() + 7 * 86_400_000;
      const day2 = day1 + 86_400_000;
      return [
        makeCheckoutClassSessionStub({
          id: 'session-1',
          startsAt: new Date(day1),
          endsAt: new Date(day1 + 3_600_000),
          price: 25,
          weekday: 2,
        }),
        makeCheckoutClassSessionStub({
          id: 'session-2',
          startsAt: new Date(day2),
          endsAt: new Date(day2 + 3_600_000),
          price: 25,
          weekday: 3,
        }),
      ];
    }

    it('creates package enrollment across multiple calendar days', async () => {
      repository.findPublicUpcomingBySlug.mockResolvedValue(
        makeClassesPublicEventStub(),
      );
      repository.findActiveClassSessionsByIdsForEvent.mockResolvedValue(
        twoDifferentDaySessions(),
      );
      repository.createClassPackageEnrollment.mockResolvedValue({
        id: 'pkg-cart-1',
      });
      repository.createClassEnrollment.mockResolvedValue({ id: 'child-1' });
      repository.createClassPackageEnrollmentItem.mockResolvedValue({});

      await expect(
        service.createClassCartCheckout('salsa-night', cartDto),
      ).resolves.toEqual({
        clientSecret: 'sec_1',
        packageEnrollmentId: 'pkg-cart-1',
      });

      const createCalls = stripe.client.checkout.sessions.create.mock.calls as [
        [
          {
            metadata: { flow?: string };
            payment_intent_data?: { metadata?: { flow?: string } };
          },
        ],
      ];
      expect(createCalls[0][0].metadata.flow).toBe('class_session_cart');
      expect(createCalls[0][0].payment_intent_data?.metadata?.flow).toBe(
        'class_session_cart',
      );
      expect(repository.createClassEnrollment).toHaveBeenCalledTimes(2);
      const packageCreateCalls = repository.createClassPackageEnrollment.mock
        .calls as Array<[{ selections: { kind: string } }]>;
      const pkgCreate = packageCreateCalls[0][0];
      expect(pkgCreate.selections.kind).toBe('class_session_cart');
    });

    it('rejects duplicate session ids', async () => {
      repository.findPublicUpcomingBySlug.mockResolvedValue(
        makeClassesPublicEventStub(),
      );
      await expect(
        service.createClassCartCheckout('salsa-night', {
          ...cartDto,
          sessionIds: ['session-1', 'session-1'],
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('createClassPackageCheckout', () => {
    it('creates month package enrollment when enabled', async () => {
      const monthIso =
        classMonthPackageUtil.currentCalendarMonthIso('America/New_York');
      repository.findPublicUpcomingBySlug.mockResolvedValue(
        makeClassesPublicEventStub(),
      );
      repository.findVenueConfigForMonthPackage.mockResolvedValue(
        makeMonthPackageVenueEnabledStub(),
      );
      jest
        .spyOn(classMonthPackageUtil, 'resolveMonthSessions')
        .mockResolvedValue([
          makeCheckoutClassSessionStub({ id: 'session-1', price: 40 }),
          makeCheckoutClassSessionStub({ id: 'session-2', price: 40 }),
        ] as never);
      jest
        .spyOn(classMonthPackageUtil, 'assertMonthSessionsAvailable')
        .mockResolvedValue(undefined);
      repository.createClassPackageEnrollment.mockResolvedValue({
        id: 'pkg-month-1',
      });
      repository.createClassEnrollment.mockResolvedValue({ id: 'child-1' });
      repository.createClassPackageEnrollmentItem.mockResolvedValue({});

      await expect(
        service.createClassPackageCheckout('salsa-night', {
          ...packageDto,
          monthIso,
        }),
      ).resolves.toEqual({
        clientSecret: 'sec_1',
        packageEnrollmentId: 'pkg-month-1',
      });

      const createCalls = stripe.client.checkout.sessions.create.mock.calls as [
        [
          {
            metadata: { flow?: string; correlationId?: string };
            payment_intent_data?: {
              description?: string;
              receipt_email?: string;
              metadata?: { flow?: string; correlationId?: string };
            };
          },
        ],
      ];
      expect(createCalls[0][0].metadata.flow).toBe('class_month_package');
      expect(createCalls[0][0].metadata.correlationId).toMatch(
        /^[0-9a-f-]{36}$/i,
      );
      expect(createCalls[0][0].payment_intent_data?.metadata?.flow).toBe(
        'class_month_package',
      );
      expect(
        createCalls[0][0].payment_intent_data?.metadata?.correlationId,
      ).toBe(createCalls[0][0].metadata.correlationId);
      expect(createCalls[0][0].payment_intent_data?.receipt_email).toBe(
        'ada@example.com',
      );
      expect(createCalls[0][0].payment_intent_data?.description).toContain(
        monthIso,
      );

      const updateArgs = stripe.client.checkout.sessions.update.mock
        .calls[0] as [
        string,
        {
          metadata?: {
            flow?: string;
            correlationId?: string;
            packageEnrollmentId?: string;
          };
        },
      ];
      expect(updateArgs[1]?.metadata?.flow).toBe('class_month_package');
      expect(updateArgs[1]?.metadata?.packageEnrollmentId).toBe('pkg-month-1');
      expect(updateArgs[1]?.metadata?.correlationId).toBe(
        createCalls[0][0].metadata.correlationId,
      );
      expect(stripe.client.paymentIntents.update).toHaveBeenCalled();
    });

    it('rejects disabled package', async () => {
      repository.findPublicUpcomingBySlug.mockResolvedValue(
        makeClassesPublicEventStub(),
      );
      repository.findVenueConfigForMonthPackage.mockResolvedValue(
        makeMonthPackageVenueEnabledStub({ classPackageEnabled: false }),
      );
      await expect(
        service.createClassPackageCheckout('salsa-night', packageDto),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects non-recurring schedule', async () => {
      repository.findPublicUpcomingBySlug.mockResolvedValue(
        makeClassesPublicEventStub(),
      );
      repository.findVenueConfigForMonthPackage.mockResolvedValue(
        makeMonthPackageVenueEnabledStub({
          reservationEventTemplate: {
            scheduleMode: ReservationEventScheduleMode.FIXED_EVENT,
            timezone: 'America/New_York',
            weekdays: [],
          },
        }),
      );
      await expect(
        service.createClassPackageCheckout('salsa-night', packageDto),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects invalid package price', async () => {
      repository.findPublicUpcomingBySlug.mockResolvedValue(
        makeClassesPublicEventStub(),
      );
      repository.findVenueConfigForMonthPackage.mockResolvedValue(
        makeMonthPackageVenueEnabledStub({ classPackagePrice: 0.1 }),
      );
      await expect(
        service.createClassPackageCheckout('salsa-night', packageDto),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects wrong monthIso', async () => {
      repository.findPublicUpcomingBySlug.mockResolvedValue(
        makeClassesPublicEventStub(),
      );
      repository.findVenueConfigForMonthPackage.mockResolvedValue(
        makeMonthPackageVenueEnabledStub(),
      );
      await expect(
        service.createClassPackageCheckout('salsa-night', {
          ...packageDto,
          monthIso: '2099-01',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects when month sessions are full', async () => {
      const monthIso =
        classMonthPackageUtil.currentCalendarMonthIso('America/New_York');
      repository.findPublicUpcomingBySlug.mockResolvedValue(
        makeClassesPublicEventStub(),
      );
      repository.findVenueConfigForMonthPackage.mockResolvedValue(
        makeMonthPackageVenueEnabledStub(),
      );
      jest
        .spyOn(classMonthPackageUtil, 'resolveMonthSessions')
        .mockResolvedValue([makeCheckoutClassSessionStub()] as never);
      jest
        .spyOn(classMonthPackageUtil, 'assertMonthSessionsAvailable')
        .mockRejectedValue(new ConflictException('full'));
      await expect(
        service.createClassPackageCheckout('salsa-night', {
          ...packageDto,
          monthIso,
        }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('rejects missing Stripe client_secret', async () => {
      const monthIso =
        classMonthPackageUtil.currentCalendarMonthIso('America/New_York');
      repository.findPublicUpcomingBySlug.mockResolvedValue(
        makeClassesPublicEventStub(),
      );
      repository.findVenueConfigForMonthPackage.mockResolvedValue(
        makeMonthPackageVenueEnabledStub(),
      );
      jest
        .spyOn(classMonthPackageUtil, 'resolveMonthSessions')
        .mockResolvedValue([makeCheckoutClassSessionStub()] as never);
      jest
        .spyOn(classMonthPackageUtil, 'assertMonthSessionsAvailable')
        .mockResolvedValue(undefined);
      stripe.client.checkout.sessions.create = jest.fn().mockResolvedValue({
        id: 'cs_1',
        client_secret: null,
      });
      await expect(
        service.createClassPackageCheckout('salsa-night', {
          ...packageDto,
          monthIso,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('createFixedEventCheckout', () => {
    function stubFixedOpen() {
      const event = makeFixedTicketEventStub({
        id: 'fixed-event-1',
        slug: 'gala-night',
        price: 75,
        eventType: { name: 'Gala Night' },
      });
      repository.findPublicUpcomingBySlug.mockResolvedValue(event);
      repository.findVenueConfigWithReservationTemplate.mockResolvedValue(
        makeFixedPublicCheckoutVenueStub(),
      );
      jest
        .spyOn(fixedTicketUtil, 'fixedTicketsRemaining')
        .mockResolvedValue(10);
    }

    it('creates PENDING fixed enrollment', async () => {
      stubFixedOpen();
      repository.createPendingFixedEventEnrollmentLocked.mockResolvedValue({
        id: 'fixed-enroll-1',
      });

      await expect(
        service.createFixedEventCheckout('gala-night', fixedDto),
      ).resolves.toEqual({
        clientSecret: 'sec_1',
        enrollmentId: 'fixed-enroll-1',
      });

      const createCalls = stripe.client.checkout.sessions.create.mock.calls as [
        [
          {
            metadata: { flow?: string; correlationId?: string };
            payment_intent_data?: {
              description?: string;
              receipt_email?: string;
              metadata?: { flow?: string; correlationId?: string };
            };
          },
        ],
      ];
      expect(createCalls[0][0].metadata.flow).toBe('fixed_event_ticket');
      expect(createCalls[0][0].metadata.correlationId).toMatch(
        /^[0-9a-f-]{36}$/i,
      );
      expect(createCalls[0][0].payment_intent_data?.metadata?.flow).toBe(
        'fixed_event_ticket',
      );
      expect(createCalls[0][0].payment_intent_data?.receipt_email).toBe(
        'ada@example.com',
      );
      expect(createCalls[0][0].payment_intent_data?.description).toContain(
        'ticket',
      );

      const updateArgs = stripe.client.checkout.sessions.update.mock
        .calls[0] as [
        string,
        {
          metadata?: {
            flow?: string;
            correlationId?: string;
            enrollmentId?: string;
          };
        },
      ];
      expect(updateArgs[1]?.metadata?.enrollmentId).toBe('fixed-enroll-1');
      expect(updateArgs[1]?.metadata?.correlationId).toBe(
        createCalls[0][0].metadata.correlationId,
      );
    });

    it('rejects when ticket capacity is not configured', async () => {
      stubFixedOpen();
      repository.findVenueConfigWithReservationTemplate.mockResolvedValue(
        makeFixedPublicCheckoutVenueStub({ fixedTicketCapacity: null }),
      );
      await expect(
        service.createFixedEventCheckout('gala-night', fixedDto),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects sold out tickets', async () => {
      stubFixedOpen();
      jest.spyOn(fixedTicketUtil, 'fixedTicketsRemaining').mockResolvedValue(0);
      await expect(
        service.createFixedEventCheckout('gala-night', fixedDto),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('rejects when event does not offer ticket sales', async () => {
      repository.findPublicUpcomingBySlug.mockResolvedValue(
        makeFixedTicketEventStub(),
      );
      repository.findVenueConfigWithReservationTemplate.mockResolvedValue(
        makeFixedPublicCheckoutVenueStub({ clientEnabled: true }),
      );
      await expect(
        service.createFixedEventCheckout('gala-night', fixedDto),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects when sales window is closed', async () => {
      stubFixedOpen();
      repository.findVenueConfigWithReservationTemplate.mockResolvedValue(
        makeFixedPublicCheckoutVenueStub({
          reservationOpensAt: new Date('2090-01-01T00:00:00.000Z'),
          reservationClosesAt: new Date('2099-01-01T00:00:00.000Z'),
        }),
      );
      await expect(
        service.createFixedEventCheckout('gala-night', fixedDto),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects missing Stripe client_secret', async () => {
      stubFixedOpen();
      stripe.client.checkout.sessions.create = jest.fn().mockResolvedValue({
        id: 'cs_1',
        client_secret: null,
      });
      await expect(
        service.createFixedEventCheckout('gala-night', fixedDto),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('creates PENDING enrollment for PACKAGES with packageId', async () => {
      const event = makeFixedTicketEventStub({
        id: 'fixed-event-1',
        slug: 'gala-night',
        price: 75,
        eventType: { name: 'Gala Night' },
      });
      repository.findPublicUpcomingBySlug.mockResolvedValue(event);
      repository.findVenueConfigWithReservationTemplate.mockResolvedValue(
        makeFixedPublicCheckoutVenueStub({
          fixedTicketMode: 'PACKAGES',
          fixedTicketCapacity: null,
        }),
      );
      packagesRepository.findPackageById.mockResolvedValue({
        id: 'pkg-1',
        eventId: 'fixed-event-1',
        title: 'VIP Early Entry',
        description: null,
        badge: null,
        priceCents: 8500,
        capacity: 40,
        arrivalStartTime: new Date(Date.UTC(1970, 0, 1, 18, 0)),
        arrivalEndTime: null,
        displayOrder: 0,
        isActive: true,
        activityLinks: [
          {
            activity: {
              id: 'act-1',
              title: 'Welcome drink',
              description: null,
              showText: true,
              mediaType: null,
              mediaUrl: null,
              mediaPublicId: null,
              displayOrder: 0,
            },
          },
        ],
      });
      jest.spyOn(fixedTicketUtil, 'getFixedTicketInventory').mockResolvedValue({
        total: { capacity: 40, blocking: 0, remaining: 40, sold: 0 },
        byPackage: new Map([
          ['pkg-1', { capacity: 40, blocking: 0, remaining: 40, sold: 0 }],
        ]),
      } as Awaited<ReturnType<typeof fixedTicketUtil.getFixedTicketInventory>>);
      repository.createPendingFixedEventEnrollmentLocked.mockResolvedValue({
        id: 'fixed-enroll-pkg-1',
      });

      await expect(
        service.createFixedEventCheckout('gala-night', {
          ...fixedDto,
          packageId: 'pkg-1',
        }),
      ).resolves.toEqual({
        clientSecret: 'sec_1',
        enrollmentId: 'fixed-enroll-pkg-1',
      });

      expect(packagesRepository.findPackageById).toHaveBeenCalledWith(
        'pkg-1',
        'fixed-event-1',
      );
      expect(
        repository.createPendingFixedEventEnrollmentLocked,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          packageId: 'pkg-1',
          packageTitle: 'VIP Early Entry',
          packagePriceCents: 8500,
          amount: 85,
        }),
        expect.objectContaining({
          mode: 'PACKAGES',
          packageId: 'pkg-1',
          packageCapacity: 40,
        }),
      );
      const createCalls = stripe.client.checkout.sessions.create.mock.calls as [
        [{ metadata?: { package_id?: string; flow?: string } }],
      ];
      expect(createCalls[0][0].metadata?.package_id).toBe('pkg-1');
      expect(createCalls[0][0].metadata?.flow).toBe('fixed_event_ticket');
    });
  });
});
