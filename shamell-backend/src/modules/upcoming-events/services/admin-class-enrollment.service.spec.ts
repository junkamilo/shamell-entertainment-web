import { createHash } from 'crypto';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import {
  ReservationEventScheduleMode,
  UpcomingClassEnrollmentStatus,
  UpcomingExperienceType,
} from '@prisma/client';
import { createPrismaMock, type PrismaMock } from '../../../testing';
import {
  makeClassEnrollmentStub,
  makeEndedClassSessionStub,
  makeFutureClassSessionStub,
  makeMonthPackageVenueConfigStub,
  makeUpcomingClassSessionStub,
} from '../__mocks__/upcoming-events.fixtures';
import { currentCalendarMonthIso } from '../utils/class-month-package.util';
import {
  createAdminClassEnrollmentServiceTestModule,
  type AdminClassEnrollmentServiceTestHarness,
} from '../testing/admin-class-enrollment-service.test-module';
import { AdminClassEnrollmentService } from './admin-class-enrollment.service';

describe('AdminClassEnrollmentService', () => {
  let harness: AdminClassEnrollmentServiceTestHarness;
  let service: AdminClassEnrollmentService;
  let prisma: PrismaMock;

  const classesEvent = {
    id: 'event-1',
    slug: 'salsa-classes',
    experienceType: UpcomingExperienceType.CLASSES,
    publicSection: 'UPCOMING_EVENTS',
    eventType: { name: 'Salsa Classes' },
  };

  const NY_TIMEZONE = 'America/New_York';

  beforeEach(async () => {
    harness = await createAdminClassEnrollmentServiceTestModule();
    service = harness.service;
    prisma = createPrismaMock();
    harness.repository.asPrisma.mockReturnValue(prisma);
    jest.clearAllMocks();
    harness.repository.asPrisma.mockReturnValue(prisma);
    harness.stripe.client.checkout.sessions.create = jest
      .fn()
      .mockResolvedValue({
        id: 'cs_admin',
        client_secret: 'cs_admin_secret',
      });
    harness.stripe.client.checkout.sessions.update = jest
      .fn()
      .mockResolvedValue({ id: 'cs_admin' });
  });

  function mockSessionCashCreate(
    session: ReturnType<typeof makeFutureClassSessionStub>,
  ) {
    prisma.upcomingClassEnrollment.create.mockResolvedValue({
      id: 'enroll-cash',
      amount: session.price,
      currency: session.currency,
      customerName: 'Cash Guest',
      customerEmail: 'cash@example.com',
      customerEmailSentAt: new Date(),
      session: {
        ...session,
        section: null,
        event: { ...classesEvent, eventType: classesEvent.eventType },
      },
    });
  }

  function makeSameDayBundleSessions() {
    const session1 = makeFutureClassSessionStub({
      id: 'session-a',
      startsAt: new Date('2026-08-15T14:00:00.000Z'),
      endsAt: new Date('2026-08-15T15:00:00.000Z'),
      section: null,
      weekday: 5,
      price: 50,
      currency: 'usd',
      timezone: NY_TIMEZONE,
    });
    const session2 = makeFutureClassSessionStub({
      id: 'session-b',
      startsAt: new Date('2026-08-15T18:00:00.000Z'),
      endsAt: new Date('2026-08-15T19:00:00.000Z'),
      section: null,
      weekday: 5,
      price: 50,
      currency: 'usd',
      timezone: NY_TIMEZONE,
    });
    return { session1, session2 };
  }

  function mockPaidPackageEnrollmentFlow(
    sessions: Array<ReturnType<typeof makeFutureClassSessionStub>>,
    packageId = 'pkg-enrollment',
  ) {
    const enrollments = sessions.map((session, index) => {
      const sessionRow = session as {
        price: unknown;
        currency: unknown;
        section?: unknown;
      };
      return {
        id: `enroll-${index + 1}`,
        amount: sessionRow.price,
        currency: sessionRow.currency,
        session: {
          ...session,
          section: sessionRow.section ?? null,
          event: { ...classesEvent, eventType: classesEvent.eventType },
        },
      };
    });

    const packageEnrollment = {
      id: packageId,
      amount: sessions.reduce((sum, s) => sum + Number(s.price), 0),
      currency: 'usd',
      customerName: 'Package Guest',
      customerEmail: 'package@example.com',
      event: { ...classesEvent, eventType: classesEvent.eventType },
      items: [] as Array<{ enrollment: (typeof enrollments)[0] }>,
    };

    prisma.upcomingClassPackageEnrollment.create.mockResolvedValue(
      packageEnrollment,
    );

    for (const enrollment of enrollments) {
      prisma.upcomingClassEnrollment.create.mockResolvedValueOnce(enrollment);
    }

    prisma.upcomingClassPackageEnrollmentItem.create.mockResolvedValue({});

    const refreshedPackage = {
      ...packageEnrollment,
      items: enrollments.map((enrollment) => ({ enrollment })),
    };
    prisma.upcomingClassPackageEnrollment.findUnique.mockResolvedValue(
      refreshedPackage,
    );
    prisma.upcomingClassPackageEnrollment.update.mockResolvedValue(
      refreshedPackage,
    );

    return { packageEnrollment: refreshedPackage, enrollments };
  }

  describe('getAdminClassBookingContext', () => {
    it('getAdminClassBookingContext rejects non-class events', async () => {
      prisma.event.findFirst.mockResolvedValue({
        id: 'event-1',
        slug: 'x',
        experienceType: UpcomingExperienceType.VENUE_SEATING,
        eventType: { name: 'Venue' },
      });
      await expect(
        service.getAdminClassBookingContext('event-1'),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('getAdminClassBookingContext returns typed context for CLASSES', async () => {
      prisma.event.findFirst.mockResolvedValue(classesEvent);
      prisma.upcomingVenueConfig.findUnique.mockResolvedValue({
        classPackageEnabled: false,
        classPackagePrice: null,
        classPackageLabel: null,
        reservationEventTemplate: null,
      });
      prisma.upcomingClassSession.findMany.mockResolvedValue([
        {
          ...makeUpcomingClassSessionStub({
            endsAt: new Date(Date.now() + 86_400_000),
            section: null,
          }),
        },
      ]);
      prisma.upcomingClassEnrollment.findMany.mockResolvedValue([]);

      const ctx = await service.getAdminClassBookingContext('event-1');
      expect(ctx.event.id).toBe('event-1');
      expect(ctx.event.slug).toBe('salsa-classes');
      expect(ctx.event.name).toBe('Salsa Classes');
      expect(Array.isArray(ctx.sessions)).toBe(true);
      expect(ctx.sessions[0]?.seatsRemaining).toBe(20);
    });

    it('getAdminClassBookingContext throws NotFound when event missing', async () => {
      prisma.event.findFirst.mockResolvedValue(null);
      await expect(
        service.getAdminClassBookingContext('missing'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('getAdminClassBookingContext throws BadRequest when slug is missing', async () => {
      prisma.event.findFirst.mockResolvedValue({
        ...classesEvent,
        slug: '   ',
      });
      await expect(
        service.getAdminClassBookingContext('event-1'),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('listAdminBookableClassEvents', () => {
    it('listAdminBookableClassEvents returns bookable event shape', async () => {
      prisma.event.findMany.mockResolvedValue([
        {
          ...classesEvent,
          createdAt: new Date(),
          venueConfig: {
            reservationTimezone: NY_TIMEZONE,
            reservationEventTemplate: {
              weekdays: [{ weekday: 1, isActive: true }],
              classSections: [{ id: 's1', isActive: true }],
              scheduleMode: ReservationEventScheduleMode.RECURRING_WEEKLY,
              timezone: NY_TIMEZONE,
            },
          },
        },
      ]);
      prisma.upcomingClassSession.findMany.mockResolvedValue([
        { id: 'session-1', capacity: 20, eventId: 'event-1' },
      ]);
      prisma.upcomingClassEnrollment.findMany.mockResolvedValue([]);

      const result = await service.listAdminBookableClassEvents();
      expect(result.events).toHaveLength(1);
      expect(result.events[0]?.id).toBe('event-1');
      expect(result.events[0]?.slug).toBe('salsa-classes');
      expect(result.events[0]?.name).toBe('Salsa Classes');
    });
  });

  describe('session cash enrollment', () => {
    it('createAdminClassCashEnrollment throws ConflictException when session is full', async () => {
      prisma.event.findFirst.mockResolvedValue(classesEvent);
      prisma.upcomingClassSession.findFirst.mockResolvedValue(
        makeFutureClassSessionStub({
          capacity: 1,
          price: 50,
          currency: 'usd',
        }),
      );
      prisma.upcomingClassEnrollment.count.mockResolvedValue(1);

      await expect(
        service.createAdminClassCashEnrollment('admin-1', {
          upcomingEventId: 'event-1',
          purchaseKind: 'session',
          sessionId: 'session-1',
          customerName: 'Cash Guest',
          customerEmail: 'cash@example.com',
        }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('createAdminClassCashEnrollment creates PAID enrollment when seats remain', async () => {
      prisma.event.findFirst.mockResolvedValue(classesEvent);
      const session = makeFutureClassSessionStub({
        capacity: 10,
        price: 50,
        currency: 'usd',
      });
      prisma.upcomingClassSession.findFirst.mockResolvedValue(session);
      prisma.upcomingClassEnrollment.count.mockResolvedValue(0);
      mockSessionCashCreate(session);

      const result = await service.createAdminClassCashEnrollment('admin-1', {
        upcomingEventId: 'event-1',
        purchaseKind: 'session',
        sessionId: 'session-1',
        customerName: 'Cash Guest',
        customerEmail: 'cash@example.com',
      });

      expect(result).toEqual({
        enrollmentId: 'enroll-cash',
        message: 'Class reservation confirmed.',
      });
      expect(prisma.upcomingClassEnrollment.create).toHaveBeenCalled();
      const createCalls = prisma.upcomingClassEnrollment.create.mock.calls as [
        [{ data: { status: UpcomingClassEnrollmentStatus } }],
      ];
      expect(createCalls[0][0].data.status).toBe(
        UpcomingClassEnrollmentStatus.PAID,
      );
    });

    it('createAdminClassCashEnrollment rejects non-class events', async () => {
      prisma.event.findFirst.mockResolvedValue({
        ...classesEvent,
        experienceType: UpcomingExperienceType.VENUE_SEATING,
      });

      await expect(
        service.createAdminClassCashEnrollment('admin-1', {
          upcomingEventId: 'event-1',
          purchaseKind: 'session',
          sessionId: 'session-1',
          customerName: 'X',
          customerEmail: 'x@example.com',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('createAdminClassCashEnrollment throws BadRequest when session has ended', async () => {
      prisma.event.findFirst.mockResolvedValue(classesEvent);
      prisma.upcomingClassSession.findFirst.mockResolvedValue(
        makeEndedClassSessionStub(),
      );

      await expect(
        service.createAdminClassCashEnrollment('admin-1', {
          upcomingEventId: 'event-1',
          purchaseKind: 'session',
          sessionId: 'session-1',
          customerName: 'Guest',
          customerEmail: 'guest@example.com',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('createAdminClassCashEnrollment throws BadRequest when sessionId is missing', async () => {
      prisma.event.findFirst.mockResolvedValue(classesEvent);

      await expect(
        service.createAdminClassCashEnrollment('admin-1', {
          upcomingEventId: 'event-1',
          purchaseKind: 'session',
          customerName: 'Guest',
          customerEmail: 'guest@example.com',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('createAdminClassCashEnrollment throws NotFound when session is missing', async () => {
      prisma.event.findFirst.mockResolvedValue(classesEvent);
      prisma.upcomingClassSession.findFirst.mockResolvedValue(null);

      await expect(
        service.createAdminClassCashEnrollment('admin-1', {
          upcomingEventId: 'event-1',
          purchaseKind: 'session',
          sessionId: 'missing-session',
          customerName: 'Guest',
          customerEmail: 'guest@example.com',
        }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('createAdminClassCashEnrollment sets createdByAdminId and notifies CLASS_SESSION on success', async () => {
      prisma.event.findFirst.mockResolvedValue(classesEvent);
      const session = makeFutureClassSessionStub({
        capacity: 10,
        price: 50,
        currency: 'usd',
      });
      prisma.upcomingClassSession.findFirst.mockResolvedValue(session);
      prisma.upcomingClassEnrollment.count.mockResolvedValue(0);
      mockSessionCashCreate(session);

      await service.createAdminClassCashEnrollment('admin-42', {
        upcomingEventId: 'event-1',
        purchaseKind: 'session',
        sessionId: 'session-1',
        customerName: 'Cash Guest',
        customerEmail: 'cash@example.com',
      });

      const createCalls = prisma.upcomingClassEnrollment.create.mock.calls as [
        [{ data: { createdByAdminId: string } }],
      ];
      expect(createCalls[0][0].data.createdByAdminId).toBe('admin-42');

      const notifyCalls = harness.adminPaymentNotify.notifyPaymentOutcome.mock
        .calls as [[{ outcome: string; flow: string }]];
      expect(notifyCalls[0][0].outcome).toBe('PAID');
      expect(notifyCalls[0][0].flow).toBe('CLASS_SESSION');
    });
  });

  describe('session checkout enrollment', () => {
    it('createAdminClassCheckoutSession delegates to Stripe and creates PENDING enrollment', async () => {
      prisma.event.findFirst.mockResolvedValue(classesEvent);
      prisma.upcomingClassSession.findFirst.mockResolvedValue(
        makeFutureClassSessionStub({
          capacity: 10,
          price: 50,
          currency: 'usd',
        }),
      );
      prisma.upcomingClassEnrollment.count.mockResolvedValue(0);
      prisma.upcomingClassEnrollment.create.mockResolvedValue({
        id: 'enroll-stripe',
      });

      const result = await service.createAdminClassCheckoutSession('admin-1', {
        upcomingEventId: 'event-1',
        purchaseKind: 'session',
        sessionId: 'session-1',
        customerName: 'Stripe Guest',
        customerEmail: 'stripe@example.com',
      });

      expect(harness.stripe.client.checkout.sessions.create).toHaveBeenCalled();
      const createCalls = harness.stripe.client.checkout.sessions.create.mock
        .calls as [
        [
          {
            metadata: {
              flow: string;
              correlationId?: string;
              adminUserId?: string;
            };
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
        'stripe@example.com',
      );
      expect(createCalls[0][0].expand).toEqual(['payment_intent']);
      expect(harness.stripe.client.paymentIntents.update).toHaveBeenCalled();
      const updateArgs = harness.stripe.client.checkout.sessions.update.mock
        .calls[0] as [
        string,
        {
          metadata?: {
            enrollmentId?: string;
            correlationId?: string;
          };
        },
      ];
      expect(updateArgs[1]?.metadata?.enrollmentId).toBe('enroll-stripe');
      expect(updateArgs[1]?.metadata?.correlationId).toBe(
        createCalls[0][0].metadata.correlationId,
      );
      expect(result.enrollmentId).toBe('enroll-stripe');
      expect(result.message).toBe('Payment link sent to customer.');
      expect(result.payUrl).toContain('/pay/class?token=');
    });

    it('createAdminClassCheckoutSession throws ConflictException when session is full', async () => {
      prisma.event.findFirst.mockResolvedValue(classesEvent);
      prisma.upcomingClassSession.findFirst.mockResolvedValue(
        makeFutureClassSessionStub({ capacity: 1, price: 50, currency: 'usd' }),
      );
      prisma.upcomingClassEnrollment.count.mockResolvedValue(1);

      await expect(
        service.createAdminClassCheckoutSession('admin-1', {
          upcomingEventId: 'event-1',
          purchaseKind: 'session',
          sessionId: 'session-1',
          customerName: 'Stripe Guest',
          customerEmail: 'stripe@example.com',
        }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('createAdminClassCheckoutSession throws BadRequest when Stripe omits client_secret', async () => {
      prisma.event.findFirst.mockResolvedValue(classesEvent);
      prisma.upcomingClassSession.findFirst.mockResolvedValue(
        makeFutureClassSessionStub({
          capacity: 10,
          price: 50,
          currency: 'usd',
        }),
      );
      prisma.upcomingClassEnrollment.count.mockResolvedValue(0);
      harness.stripe.client.checkout.sessions.create = jest
        .fn()
        .mockResolvedValue({ id: 'cs_admin' });

      await expect(
        service.createAdminClassCheckoutSession('admin-1', {
          upcomingEventId: 'event-1',
          purchaseKind: 'session',
          sessionId: 'session-1',
          customerName: 'Stripe Guest',
          customerEmail: 'stripe@example.com',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('createAdminClassCheckoutSession day_bundle creates package PENDING enrollment', async () => {
      const { session1, session2 } = makeSameDayBundleSessions();
      prisma.event.findFirst.mockResolvedValue(classesEvent);
      prisma.upcomingClassSession.findMany.mockResolvedValue([
        session1,
        session2,
      ]);
      prisma.upcomingClassEnrollment.count.mockResolvedValue(0);
      prisma.upcomingClassPackageEnrollment.create.mockResolvedValue({
        id: 'pkg-stripe',
      });
      prisma.upcomingClassEnrollment.create
        .mockResolvedValueOnce({ id: 'enroll-a' })
        .mockResolvedValueOnce({ id: 'enroll-b' });
      prisma.upcomingClassPackageEnrollmentItem.create.mockResolvedValue({});

      const result = await service.createAdminClassCheckoutSession('admin-1', {
        upcomingEventId: 'event-1',
        purchaseKind: 'day_bundle',
        sessionIds: ['session-a', 'session-b'],
        customerName: 'Bundle Guest',
        customerEmail: 'bundle@example.com',
      });

      expect(result.enrollmentId).toBe('pkg-stripe');
      expect(result.payUrl).toContain('/pay/class?token=');
      expect(harness.stripe.client.checkout.sessions.create).toHaveBeenCalled();
      const createCalls = harness.stripe.client.checkout.sessions.create.mock
        .calls as [
        [
          {
            metadata: { flow?: string; correlationId?: string };
            payment_intent_data?: {
              metadata?: { flow?: string; correlationId?: string };
            };
          },
        ],
      ];
      expect(createCalls[0][0].metadata.flow).toBe('class_session_bundle');
      expect(createCalls[0][0].metadata.correlationId).toMatch(
        /^[0-9a-f-]{36}$/i,
      );
      expect(
        createCalls[0][0].payment_intent_data?.metadata?.correlationId,
      ).toBe(createCalls[0][0].metadata.correlationId);
      expect(harness.stripe.client.checkout.sessions.update).toHaveBeenCalled();
      const updateArgs = harness.stripe.client.checkout.sessions.update.mock
        .calls[0] as [
        string,
        {
          metadata?: {
            packageEnrollmentId?: string;
            correlationId?: string;
          };
        },
      ];
      expect(updateArgs[1]?.metadata?.packageEnrollmentId).toBe('pkg-stripe');
      expect(updateArgs[1]?.metadata?.correlationId).toBe(
        createCalls[0][0].metadata.correlationId,
      );
    });

    it('createAdminClassCheckoutSession day_bundle rejects missing client_secret', async () => {
      const { session1, session2 } = makeSameDayBundleSessions();
      prisma.event.findFirst.mockResolvedValue(classesEvent);
      prisma.upcomingClassSession.findMany.mockResolvedValue([
        session1,
        session2,
      ]);
      prisma.upcomingClassEnrollment.count.mockResolvedValue(0);
      harness.stripe.client.checkout.sessions.create = jest
        .fn()
        .mockResolvedValue({ id: 'cs_pkg' });

      await expect(
        service.createAdminClassCheckoutSession('admin-1', {
          upcomingEventId: 'event-1',
          purchaseKind: 'day_bundle',
          sessionIds: ['session-a', 'session-b'],
          customerName: 'Bundle Guest',
          customerEmail: 'bundle@example.com',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('day_bundle resolve validations', () => {
    it('rejects empty sessionIds', async () => {
      prisma.event.findFirst.mockResolvedValue(classesEvent);
      await expect(
        service.createAdminClassCashEnrollment('admin-1', {
          upcomingEventId: 'event-1',
          purchaseKind: 'day_bundle',
          sessionIds: [],
          customerName: 'Guest',
          customerEmail: 'g@example.com',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects when sessions are not found', async () => {
      prisma.event.findFirst.mockResolvedValue(classesEvent);
      prisma.upcomingClassSession.findMany.mockResolvedValue([]);
      await expect(
        service.createAdminClassCashEnrollment('admin-1', {
          upcomingEventId: 'event-1',
          purchaseKind: 'day_bundle',
          sessionIds: ['missing-a', 'missing-b'],
          customerName: 'Guest',
          customerEmail: 'g@example.com',
        }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('rejects when a session has already ended', async () => {
      const ended = makeEndedClassSessionStub({
        id: 'session-a',
        price: 50,
        currency: 'usd',
      });
      const future = makeFutureClassSessionStub({
        id: 'session-b',
        price: 50,
        currency: 'usd',
        startsAt: ended.startsAt,
      });
      prisma.event.findFirst.mockResolvedValue(classesEvent);
      prisma.upcomingClassSession.findMany.mockResolvedValue([ended, future]);
      await expect(
        service.createAdminClassCashEnrollment('admin-1', {
          upcomingEventId: 'event-1',
          purchaseKind: 'day_bundle',
          sessionIds: ['session-a', 'session-b'],
          customerName: 'Guest',
          customerEmail: 'g@example.com',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects when bundle total is under $0.50', async () => {
      const { session1, session2 } = makeSameDayBundleSessions();
      session1.price = 0.1;
      session2.price = 0.1;
      prisma.event.findFirst.mockResolvedValue(classesEvent);
      prisma.upcomingClassSession.findMany.mockResolvedValue([
        session1,
        session2,
      ]);
      prisma.upcomingClassEnrollment.count.mockResolvedValue(0);
      await expect(
        service.createAdminClassCashEnrollment('admin-1', {
          upcomingEventId: 'event-1',
          purchaseKind: 'day_bundle',
          sessionIds: ['session-a', 'session-b'],
          customerName: 'Guest',
          customerEmail: 'g@example.com',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('month_package resolve validations', () => {
    it('rejects non-recurring schedule mode', async () => {
      prisma.event.findFirst.mockResolvedValue(classesEvent);
      prisma.upcomingVenueConfig.findUnique.mockResolvedValue(
        makeMonthPackageVenueConfigStub({
          reservationEventTemplate: {
            scheduleMode: ReservationEventScheduleMode.FIXED_EVENT,
            timezone: NY_TIMEZONE,
            weekdays: [{ weekday: 1, isActive: true }],
          },
        }),
      );
      await expect(
        service.createAdminClassCashEnrollment('admin-1', {
          upcomingEventId: 'event-1',
          purchaseKind: 'month_package',
          monthIso: currentCalendarMonthIso(NY_TIMEZONE),
          customerName: 'Guest',
          customerEmail: 'g@example.com',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects invalid package price', async () => {
      prisma.event.findFirst.mockResolvedValue(classesEvent);
      prisma.upcomingVenueConfig.findUnique.mockResolvedValue(
        makeMonthPackageVenueConfigStub({
          classPackageEnabled: true,
          classPackagePrice: 0.1,
        }),
      );
      await expect(
        service.createAdminClassCashEnrollment('admin-1', {
          upcomingEventId: 'event-1',
          purchaseKind: 'month_package',
          monthIso: currentCalendarMonthIso(NY_TIMEZONE),
          customerName: 'Guest',
          customerEmail: 'g@example.com',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('day_bundle cash enrollment', () => {
    it('createAdminClassCashEnrollment creates PAID package for two same-day sessions', async () => {
      const { session1, session2 } = makeSameDayBundleSessions();
      prisma.event.findFirst.mockResolvedValue(classesEvent);
      prisma.upcomingClassSession.findMany.mockResolvedValue([
        session1,
        session2,
      ]);
      prisma.upcomingClassEnrollment.count.mockResolvedValue(0);
      const { packageEnrollment } = mockPaidPackageEnrollmentFlow([
        session1,
        session2,
      ]);

      const result = await service.createAdminClassCashEnrollment('admin-1', {
        upcomingEventId: 'event-1',
        purchaseKind: 'day_bundle',
        sessionIds: ['session-a', 'session-b'],
        customerName: 'Bundle Guest',
        customerEmail: 'bundle@example.com',
      });

      expect(result.enrollmentId).toBe(packageEnrollment.id);
      expect(result.message).toBe('Class reservation confirmed.');
      expect(prisma.upcomingClassPackageEnrollment.create).toHaveBeenCalled();
      expect(prisma.upcomingClassEnrollment.create).toHaveBeenCalledTimes(2);
      expect(
        prisma.upcomingClassPackageEnrollmentItem.create,
      ).toHaveBeenCalledTimes(2);
      expect(
        prisma.upcomingClassPackageEnrollment.findUnique,
      ).toHaveBeenCalled();

      const packageCreateCalls = prisma.upcomingClassPackageEnrollment.create
        .mock.calls as [[{ data: { status: UpcomingClassEnrollmentStatus } }]];
      expect(packageCreateCalls[0][0].data.status).toBe(
        UpcomingClassEnrollmentStatus.PAID,
      );

      const notifyCalls = harness.adminPaymentNotify.notifyPaymentOutcome.mock
        .calls as [[{ flow: string }]];
      expect(notifyCalls[0][0].flow).toBe('CLASS_DAY_BUNDLE');
    });

    it('createAdminClassCashEnrollment throws BadRequest for duplicate day_bundle session ids', async () => {
      prisma.event.findFirst.mockResolvedValue(classesEvent);

      await expect(
        service.createAdminClassCashEnrollment('admin-1', {
          upcomingEventId: 'event-1',
          purchaseKind: 'day_bundle',
          sessionIds: ['session-a', 'session-a'],
          customerName: 'Bundle Guest',
          customerEmail: 'bundle@example.com',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('createAdminClassCashEnrollment throws Conflict when one day_bundle session is full', async () => {
      const { session1, session2 } = makeSameDayBundleSessions();
      prisma.event.findFirst.mockResolvedValue(classesEvent);
      prisma.upcomingClassSession.findMany.mockResolvedValue([
        session1,
        session2,
      ]);
      prisma.upcomingClassEnrollment.count
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(20);

      await expect(
        service.createAdminClassCashEnrollment('admin-1', {
          upcomingEventId: 'event-1',
          purchaseKind: 'day_bundle',
          sessionIds: ['session-a', 'session-b'],
          customerName: 'Bundle Guest',
          customerEmail: 'bundle@example.com',
        }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('createAdminClassCashEnrollment throws BadRequest when day_bundle sessions span days', async () => {
      const session1 = makeFutureClassSessionStub({
        id: 'session-a',
        startsAt: new Date('2026-08-15T14:00:00.000Z'),
        endsAt: new Date('2026-08-15T15:00:00.000Z'),
        section: null,
        weekday: 5,
        price: 50,
        currency: 'usd',
        timezone: NY_TIMEZONE,
      });
      const session2 = makeFutureClassSessionStub({
        id: 'session-b',
        startsAt: new Date('2026-08-16T14:00:00.000Z'),
        endsAt: new Date('2026-08-16T15:00:00.000Z'),
        section: null,
        weekday: 6,
        price: 50,
        currency: 'usd',
        timezone: NY_TIMEZONE,
      });
      prisma.event.findFirst.mockResolvedValue(classesEvent);
      prisma.upcomingClassSession.findMany.mockResolvedValue([
        session1,
        session2,
      ]);
      prisma.upcomingClassEnrollment.count.mockResolvedValue(0);

      await expect(
        service.createAdminClassCashEnrollment('admin-1', {
          upcomingEventId: 'event-1',
          purchaseKind: 'day_bundle',
          sessionIds: ['session-a', 'session-b'],
          customerName: 'Bundle Guest',
          customerEmail: 'bundle@example.com',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('session_cart cash enrollment', () => {
    it('createAdminClassCashEnrollment allows sessions across multiple days', async () => {
      const session1 = makeFutureClassSessionStub({
        id: 'session-a',
        startsAt: new Date('2026-08-15T14:00:00.000Z'),
        endsAt: new Date('2026-08-15T15:00:00.000Z'),
        section: null,
        weekday: 5,
        price: 40,
        currency: 'usd',
        timezone: NY_TIMEZONE,
      });
      const session2 = makeFutureClassSessionStub({
        id: 'session-b',
        startsAt: new Date('2026-08-16T14:00:00.000Z'),
        endsAt: new Date('2026-08-16T15:00:00.000Z'),
        section: null,
        weekday: 6,
        price: 60,
        currency: 'usd',
        timezone: NY_TIMEZONE,
      });
      prisma.event.findFirst.mockResolvedValue(classesEvent);
      prisma.upcomingClassSession.findMany.mockResolvedValue([
        session1,
        session2,
      ]);
      prisma.upcomingClassEnrollment.count.mockResolvedValue(0);
      const { packageEnrollment } = mockPaidPackageEnrollmentFlow(
        [session1, session2],
        'pkg-cart-1',
      );

      const result = await service.createAdminClassCashEnrollment('admin-1', {
        upcomingEventId: 'event-1',
        purchaseKind: 'session_cart',
        sessionIds: ['session-a', 'session-b'],
        customerName: 'Cart Guest',
        customerEmail: 'cart@example.com',
      });

      expect(result.enrollmentId).toBe(packageEnrollment.id);
      expect(prisma.upcomingClassPackageEnrollment.create).toHaveBeenCalled();
      const packageCreateCalls = prisma.upcomingClassPackageEnrollment.create
        .mock.calls as [
        [{ data: { amount: number; selections: { kind: string } } }],
      ];
      expect(packageCreateCalls[0][0].data.amount).toBe(100);
      expect(packageCreateCalls[0][0].data.selections.kind).toBe(
        'class_session_cart',
      );
      const notifyCalls = harness.adminPaymentNotify.notifyPaymentOutcome.mock
        .calls as [[{ flow: string }]];
      expect(notifyCalls[0][0].flow).toBe('CLASS_SESSION_CART');
    });
  });

  describe('month_package cash enrollment', () => {
    it('createAdminClassCashEnrollment throws BadRequest when month package is disabled', async () => {
      prisma.event.findFirst.mockResolvedValue(classesEvent);
      prisma.upcomingVenueConfig.findUnique.mockResolvedValue(
        makeMonthPackageVenueConfigStub({ classPackageEnabled: false }),
      );

      await expect(
        service.createAdminClassCashEnrollment('admin-1', {
          upcomingEventId: 'event-1',
          purchaseKind: 'month_package',
          monthIso: currentCalendarMonthIso(NY_TIMEZONE),
          customerName: 'Month Guest',
          customerEmail: 'month@example.com',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('createAdminClassCashEnrollment throws BadRequest for invalid monthIso', async () => {
      prisma.event.findFirst.mockResolvedValue(classesEvent);
      prisma.upcomingVenueConfig.findUnique.mockResolvedValue(
        makeMonthPackageVenueConfigStub(),
      );

      await expect(
        service.createAdminClassCashEnrollment('admin-1', {
          upcomingEventId: 'event-1',
          purchaseKind: 'month_package',
          monthIso: 'not-a-month',
          customerName: 'Month Guest',
          customerEmail: 'month@example.com',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('createAdminClassCashEnrollment throws BadRequest when monthIso is not the current month', async () => {
      prisma.event.findFirst.mockResolvedValue(classesEvent);
      prisma.upcomingVenueConfig.findUnique.mockResolvedValue(
        makeMonthPackageVenueConfigStub(),
      );

      await expect(
        service.createAdminClassCashEnrollment('admin-1', {
          upcomingEventId: 'event-1',
          purchaseKind: 'month_package',
          monthIso: '2020-01',
          customerName: 'Month Guest',
          customerEmail: 'month@example.com',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('createAdminClassCashEnrollment creates PAID package for current month sessions', async () => {
      const currentMonthIso = currentCalendarMonthIso(NY_TIMEZONE);
      const monthSession1 = makeFutureClassSessionStub({
        id: 'month-s1',
        startsAt: new Date('2026-08-20T14:00:00.000Z'),
        endsAt: new Date('2026-08-20T16:00:00.000Z'),
        section: null,
        weekday: 4,
        price: 50,
        currency: 'usd',
        timezone: NY_TIMEZONE,
      });
      const monthSession2 = makeFutureClassSessionStub({
        id: 'month-s2',
        startsAt: new Date('2026-08-27T14:00:00.000Z'),
        endsAt: new Date('2026-08-27T16:00:00.000Z'),
        section: null,
        weekday: 4,
        price: 50,
        currency: 'usd',
        timezone: NY_TIMEZONE,
      });

      prisma.event.findFirst.mockResolvedValue(classesEvent);
      prisma.upcomingVenueConfig.findUnique.mockResolvedValue(
        makeMonthPackageVenueConfigStub({
          reservationEventTemplate: {
            scheduleMode: ReservationEventScheduleMode.RECURRING_WEEKLY,
            timezone: NY_TIMEZONE,
            weekdays: [{ weekday: 4, isActive: true }],
          },
        }),
      );
      prisma.upcomingClassSession.findMany.mockResolvedValue([
        monthSession1,
        monthSession2,
      ]);
      prisma.upcomingClassEnrollment.count.mockResolvedValue(0);
      const { packageEnrollment } = mockPaidPackageEnrollmentFlow(
        [monthSession1, monthSession2],
        'pkg-month',
      );

      const result = await service.createAdminClassCashEnrollment('admin-1', {
        upcomingEventId: 'event-1',
        purchaseKind: 'month_package',
        monthIso: currentMonthIso,
        customerName: 'Month Guest',
        customerEmail: 'month@example.com',
      });

      expect(result.enrollmentId).toBe(packageEnrollment.id);
      expect(prisma.upcomingClassSession.findMany).toHaveBeenCalled();
      expect(prisma.upcomingClassPackageEnrollment.create).toHaveBeenCalled();
      expect(prisma.upcomingClassEnrollment.create).toHaveBeenCalledTimes(2);

      const notifyCalls = harness.adminPaymentNotify.notifyPaymentOutcome.mock
        .calls as [[{ flow: string }]];
      expect(notifyCalls[0][0].flow).toBe('CLASS_PACKAGE');
    });
  });

  describe('resolveClassPayCheckoutClientSecret', () => {
    it('resolveClassPayCheckoutClientSecret throws NotFound when token is unknown', async () => {
      prisma.upcomingClassPackageEnrollment.findFirst.mockResolvedValue(null);
      prisma.upcomingClassEnrollment.findFirst.mockResolvedValue(null);

      await expect(
        service.resolveClassPayCheckoutClientSecret('unknown-token'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('resolveClassPayCheckoutClientSecret throws BadRequest when enrollment is expired', async () => {
      const rawToken = 'expired-token';
      const payTokenHash = createHash('sha256').update(rawToken).digest('hex');
      prisma.upcomingClassPackageEnrollment.findFirst.mockResolvedValue(null);
      prisma.upcomingClassEnrollment.findFirst.mockResolvedValue({
        ...makeClassEnrollmentStub(),
        payTokenHash,
        expiresAt: new Date(Date.now() - 60_000),
        stripeCheckoutSessionId: 'cs_expired',
      });

      await expect(
        service.resolveClassPayCheckoutClientSecret(rawToken),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('resolveClassPayCheckoutClientSecret throws BadRequest when Stripe session is already paid', async () => {
      const rawToken = 'paid-token';
      const payTokenHash = createHash('sha256').update(rawToken).digest('hex');
      prisma.upcomingClassPackageEnrollment.findFirst.mockResolvedValue(null);
      prisma.upcomingClassEnrollment.findFirst.mockResolvedValue({
        ...makeClassEnrollmentStub(),
        payTokenHash,
        expiresAt: new Date(Date.now() + 86_400_000),
        stripeCheckoutSessionId: 'cs_paid',
      });
      harness.stripe.client.checkout.sessions.retrieve = jest
        .fn()
        .mockResolvedValue({
          status: 'complete',
          payment_status: 'paid',
          client_secret: 'cs_secret',
        });

      await expect(
        service.resolveClassPayCheckoutClientSecret(rawToken),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('resolveClassPayCheckoutClientSecret returns client_secret for a valid pending enrollment', async () => {
      const rawToken = 'valid-token';
      const payTokenHash = createHash('sha256').update(rawToken).digest('hex');
      prisma.upcomingClassPackageEnrollment.findFirst.mockResolvedValue(null);
      prisma.upcomingClassEnrollment.findFirst.mockResolvedValue({
        ...makeClassEnrollmentStub(),
        payTokenHash,
        expiresAt: new Date(Date.now() + 86_400_000),
        stripeCheckoutSessionId: 'cs_open',
      });
      harness.stripe.client.checkout.sessions.retrieve = jest
        .fn()
        .mockResolvedValue({
          status: 'open',
          payment_status: 'unpaid',
          client_secret: 'cs_live_secret',
        });

      const secret =
        await service.resolveClassPayCheckoutClientSecret(rawToken);
      expect(secret).toBe('cs_live_secret');
    });

    it('resolveClassPayCheckoutClientSecret rejects missing stripeCheckoutSessionId', async () => {
      const rawToken = 'no-session-token';
      const payTokenHash = createHash('sha256').update(rawToken).digest('hex');
      prisma.upcomingClassPackageEnrollment.findFirst.mockResolvedValue(null);
      prisma.upcomingClassEnrollment.findFirst.mockResolvedValue({
        ...makeClassEnrollmentStub(),
        payTokenHash,
        expiresAt: new Date(Date.now() + 86_400_000),
        stripeCheckoutSessionId: null,
      });

      await expect(
        service.resolveClassPayCheckoutClientSecret(rawToken),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('resolveClassPayCheckoutClientSecret rejects expired Stripe session', async () => {
      const rawToken = 'stripe-expired-token';
      const payTokenHash = createHash('sha256').update(rawToken).digest('hex');
      prisma.upcomingClassPackageEnrollment.findFirst.mockResolvedValue(null);
      prisma.upcomingClassEnrollment.findFirst.mockResolvedValue({
        ...makeClassEnrollmentStub(),
        payTokenHash,
        expiresAt: new Date(Date.now() + 86_400_000),
        stripeCheckoutSessionId: 'cs_expired_status',
      });
      harness.stripe.client.checkout.sessions.retrieve = jest
        .fn()
        .mockResolvedValue({
          status: 'expired',
          payment_status: 'unpaid',
          client_secret: 'cs_secret',
        });

      await expect(
        service.resolveClassPayCheckoutClientSecret(rawToken),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('resolveClassPayCheckoutClientSecret rejects missing client_secret', async () => {
      const rawToken = 'no-secret-token';
      const payTokenHash = createHash('sha256').update(rawToken).digest('hex');
      prisma.upcomingClassPackageEnrollment.findFirst.mockResolvedValue(null);
      prisma.upcomingClassEnrollment.findFirst.mockResolvedValue({
        ...makeClassEnrollmentStub(),
        payTokenHash,
        expiresAt: new Date(Date.now() + 86_400_000),
        stripeCheckoutSessionId: 'cs_no_secret',
      });
      harness.stripe.client.checkout.sessions.retrieve = jest
        .fn()
        .mockResolvedValue({
          status: 'open',
          payment_status: 'unpaid',
          client_secret: null,
        });

      await expect(
        service.resolveClassPayCheckoutClientSecret(rawToken),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });
});
