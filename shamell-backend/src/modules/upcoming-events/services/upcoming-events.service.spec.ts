import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import {
  EventPublicSection,
  ReservationEventScheduleMode,
  UpcomingClassEnrollmentStatus,
  UpcomingExperienceType,
} from '@prisma/client';
import { createPrismaMock, type PrismaMock } from '../../../testing';
import {
  makeClassEnrollmentStub,
  makeClassPackageWebhookInclude,
  makeClassesEventStub,
  makeFixedEnrollmentWebhookInclude,
  makePublicEventStub,
  makeRecurringTemplateStub,
  makeStripeCheckoutSessionLite,
  makeUpcomingClassSessionStub,
  makeVenueConfigStub,
} from '../__mocks__/upcoming-events.fixtures';
import * as classSessionGenerator from '../utils/class-session-generator.util';
import { currentCalendarMonthIso } from '../utils/class-month-package.util';
import {
  createUpcomingEventsServiceTestModule,
  type UpcomingEventsServiceTestHarness,
} from '../testing/upcoming-events-service.test-module';

describe('UpcomingEventsService', () => {
  let harness: UpcomingEventsServiceTestHarness;
  let service: UpcomingEventsServiceTestHarness['service'];
  let repository: UpcomingEventsServiceTestHarness['repository'];
  let prisma: PrismaMock;

  const checkoutDto = {
    sessionId: 'session-1',
    customerName: 'Guest User',
    customerEmail: 'guest@example.com',
    customerPhone: '+15551234567',
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    harness = await createUpcomingEventsServiceTestModule();
    service = harness.service;
    repository = harness.repository;
    prisma = createPrismaMock();
    harness.repository.asPrisma.mockReturnValue(prisma);
  });

  function mockPublicClassesEvent(overrides: Record<string, unknown> = {}) {
    const event = {
      ...makeClassesEventStub(),
      slug: 'salsa-night',
      publicSection: EventPublicSection.UPCOMING_EVENTS,
      eventType: { name: 'Salsa Night' },
      galleryPhotos: [],
      ...overrides,
    };
    prisma.event.findFirst.mockResolvedValue(event);
    return event;
  }

  function mockFutureClassSession(
    eventId: string,
    overrides: Record<string, unknown> = {},
  ) {
    const session = makeUpcomingClassSessionStub({
      eventId,
      endsAt: new Date(Date.now() + 86_400_000),
      ...overrides,
    });
    return session;
  }

  function mockSeatsAvailable(remaining = 0) {
    prisma.upcomingClassEnrollment.count.mockImplementation(
      ({ where }: { where: { sessionId: string } }) => {
        const sessionId = where.sessionId;
        const capacity =
          sessionId === 'session-1' ? 20 : sessionId === 'session-2' ? 20 : 20;
        return Promise.resolve(Math.max(0, capacity - remaining));
      },
    );
  }

  function mockFixedTicketContext(options?: {
    price?: number;
    capacity?: number;
    blockingCount?: number;
  }) {
    const capacity = options?.capacity ?? 50;
    const blockingCount = options?.blockingCount ?? 0;
    const opensAt = new Date(Date.now() - 86_400_000);
    const closesAt = new Date(Date.now() + 86_400_000 * 30);
    const event = {
      id: 'event-fixed-1',
      slug: 'fixed-gala',
      price: options?.price ?? 25,
      experienceType: null,
      publicSection: EventPublicSection.UPCOMING_EVENTS,
      isActive: true,
      eventType: { name: 'Gala Night' },
      galleryPhotos: [],
    };
    const venueConfig = {
      eventId: event.id,
      clientEnabled: false,
      fixedTicketCapacity: capacity,
      reservationOpensAt: opensAt,
      reservationClosesAt: closesAt,
      reservationEventDate: new Date('2026-12-01T00:00:00.000Z'),
      reservationTimezone: 'America/New_York',
      reservationEventLabel: 'Gala Night',
      reservationEventTemplate: {
        scheduleMode: ReservationEventScheduleMode.FIXED_EVENT,
      },
    };
    prisma.event.findFirst.mockResolvedValue(event);
    prisma.upcomingVenueConfig.findUnique.mockResolvedValue(venueConfig);
    prisma.upcomingFixedEventEnrollment.count.mockResolvedValue(blockingCount);
    return { event, venueConfig, capacity };
  }

  function pendingClassEnrollmentInclude(
    overrides: Record<string, unknown> = {},
  ) {
    return {
      ...makeClassEnrollmentStub({
        status: UpcomingClassEnrollmentStatus.PENDING_PAYMENT,
        amount: 50,
        currency: 'usd',
        customerEmailSentAt: null,
      }),
      session: {
        startsAt: new Date('2026-08-15T15:00:00.000Z'),
        endsAt: new Date('2026-08-15T16:00:00.000Z'),
        timezone: 'America/New_York',
        section: null,
        event: {
          slug: 'salsa-night',
          eventType: { name: 'Salsa Night' },
        },
      },
      ...overrides,
    };
  }

  describe('createClassCheckout', () => {
    it('throws NotFound when upcoming event is missing', async () => {
      prisma.event.findFirst.mockResolvedValue(null);
      await expect(
        service.createClassCheckout('missing-slug', checkoutDto),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws NotFound when class session is missing', async () => {
      mockPublicClassesEvent();
      prisma.upcomingClassSession.findFirst.mockResolvedValue(null);
      await expect(
        service.createClassCheckout('salsa-night', checkoutDto),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws ConflictException when session capacity is full', async () => {
      const event = mockPublicClassesEvent();
      const session = mockFutureClassSession(event.id);
      prisma.upcomingClassSession.findFirst.mockResolvedValue(session);
      prisma.upcomingClassEnrollment.count.mockResolvedValue(session.capacity);

      await expect(
        service.createClassCheckout('salsa-night', checkoutDto),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('creates PENDING enrollment and updates Stripe session metadata', async () => {
      const event = mockPublicClassesEvent();
      const session = mockFutureClassSession(event.id);
      prisma.upcomingClassSession.findFirst.mockResolvedValue(session);
      mockSeatsAvailable(session.capacity);
      prisma.upcomingClassEnrollment.create.mockResolvedValue({
        id: 'enroll-new',
      });

      const result = await service.createClassCheckout(
        'salsa-night',
        checkoutDto,
      );

      expect(result).toEqual({
        clientSecret: 'cs_test_secret',
        enrollmentId: 'enroll-new',
      });
      expect(
        harness.stripe.client.checkout.sessions.create,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: { flow: 'class_session' },
        }),
      );
      expect(prisma.upcomingClassEnrollment.create).toHaveBeenCalled();
      const createCalls = prisma.upcomingClassEnrollment.create.mock
        .calls as Array<
        [
          {
            data: {
              sessionId: string;
              status: UpcomingClassEnrollmentStatus;
              stripeCheckoutSessionId: string;
            };
          },
        ]
      >;
      expect(createCalls[0][0].data.sessionId).toBe(session.id);
      expect(createCalls[0][0].data.status).toBe(
        UpcomingClassEnrollmentStatus.PENDING_PAYMENT,
      );
      expect(createCalls[0][0].data.stripeCheckoutSessionId).toBe(
        'cs_test_created',
      );
      expect(
        harness.stripe.client.checkout.sessions.update,
      ).toHaveBeenCalledWith('cs_test_created', {
        metadata: { flow: 'class_session', enrollmentId: 'enroll-new' },
      });
    });
  });

  describe('createClassBundleCheckout', () => {
    const bundleDto = {
      sessionIds: ['session-1', 'session-2'],
      customerName: 'Bundle Guest',
      customerEmail: 'bundle@example.com',
    };

    it('throws BadRequestException when session ids are duplicated', async () => {
      mockPublicClassesEvent();
      await expect(
        service.createClassBundleCheckout('salsa-night', {
          ...bundleDto,
          sessionIds: ['session-1', 'session-1'],
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('throws ConflictException when one bundle session is full', async () => {
      const event = mockPublicClassesEvent();
      const session1 = mockFutureClassSession(event.id, { id: 'session-1' });
      const session2 = mockFutureClassSession(event.id, {
        id: 'session-2',
        startsAt: session1.startsAt,
      });
      prisma.upcomingClassSession.findMany.mockResolvedValue([
        session1,
        session2,
      ]);
      prisma.upcomingClassEnrollment.count
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(session2.capacity);

      await expect(
        service.createClassBundleCheckout('salsa-night', bundleDto),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('creates package enrollment and Stripe bundle checkout on success', async () => {
      const event = mockPublicClassesEvent();
      const session1 = mockFutureClassSession(event.id, { id: 'session-1' });
      const session2 = mockFutureClassSession(event.id, {
        id: 'session-2',
        startsAt: session1.startsAt,
      });
      prisma.upcomingClassSession.findMany.mockResolvedValue([
        session1,
        session2,
      ]);
      mockSeatsAvailable(session1.capacity);
      prisma.upcomingClassPackageEnrollment.create.mockResolvedValue({
        id: 'pkg-enroll-1',
      });
      prisma.upcomingClassEnrollment.create
        .mockResolvedValueOnce({ id: 'child-enroll-1' })
        .mockResolvedValueOnce({ id: 'child-enroll-2' });

      const result = await service.createClassBundleCheckout(
        'salsa-night',
        bundleDto,
      );

      expect(result).toEqual({
        clientSecret: 'cs_test_secret',
        packageEnrollmentId: 'pkg-enroll-1',
      });
      expect(
        harness.stripe.client.checkout.sessions.create,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: { flow: 'class_session_bundle' },
        }),
      );
      expect(
        harness.stripe.client.checkout.sessions.update,
      ).toHaveBeenCalledWith('cs_test_created', {
        metadata: {
          flow: 'class_session_bundle',
          packageEnrollmentId: 'pkg-enroll-1',
        },
      });
    });
  });

  describe('createClassPackageCheckout', () => {
    const packageDto = {
      monthIso: '2026-08',
      customerName: 'Package Guest',
      customerEmail: 'package@example.com',
    };

    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2026-08-10T12:00:00.000Z'));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('throws BadRequestException when month package is disabled', async () => {
      const event = mockPublicClassesEvent();
      prisma.upcomingVenueConfig.findUnique.mockResolvedValue({
        ...makeVenueConfigStub({
          eventId: event.id,
          classPackageEnabled: false,
        }),
        reservationEventTemplate: {
          ...makeRecurringTemplateStub(),
          scheduleMode: ReservationEventScheduleMode.RECURRING_WEEKLY,
        },
      });

      await expect(
        service.createClassPackageCheckout('salsa-night', packageDto),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('creates month package checkout when package is enabled', async () => {
      const event = mockPublicClassesEvent();
      const session = mockFutureClassSession(event.id, {
        startsAt: new Date('2026-08-15T15:00:00.000Z'),
        endsAt: new Date('2026-08-15T16:00:00.000Z'),
      });
      prisma.upcomingVenueConfig.findUnique.mockResolvedValue({
        ...makeVenueConfigStub({
          eventId: event.id,
          classPackageEnabled: true,
          classPackagePrice: 120,
        }),
        reservationEventTemplate: {
          ...makeRecurringTemplateStub(),
          scheduleMode: ReservationEventScheduleMode.RECURRING_WEEKLY,
          timezone: 'America/New_York',
        },
      });
      prisma.upcomingClassSession.findMany.mockResolvedValue([session]);
      mockSeatsAvailable(session.capacity);
      prisma.upcomingClassPackageEnrollment.create.mockResolvedValue({
        id: 'month-pkg-1',
      });
      prisma.upcomingClassEnrollment.create.mockResolvedValue({
        id: 'month-child-1',
      });

      const monthIso = currentCalendarMonthIso('America/New_York');
      const result = await service.createClassPackageCheckout('salsa-night', {
        ...packageDto,
        monthIso,
      });

      expect(result).toEqual({
        clientSecret: 'cs_test_secret',
        packageEnrollmentId: 'month-pkg-1',
      });
      expect(
        harness.stripe.client.checkout.sessions.create,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: { flow: 'class_month_package' },
        }),
      );
    });
  });

  describe('createFixedEventCheckout', () => {
    const fixedDto = {
      customerName: 'Ticket Guest',
      customerEmail: 'ticket@example.com',
    };

    it('throws ConflictException when fixed tickets are sold out', async () => {
      mockFixedTicketContext({ capacity: 10, blockingCount: 9 });
      prisma.upcomingFixedEventEnrollment.count
        .mockResolvedValueOnce(9)
        .mockResolvedValueOnce(10);
      await expect(
        service.createFixedEventCheckout('fixed-gala', fixedDto),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('throws BadRequestException when ticket price is invalid', async () => {
      mockFixedTicketContext({ price: 0.01 });
      await expect(
        service.createFixedEventCheckout('fixed-gala', fixedDto),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('processClassStripeWebhookEvent', () => {
    it('ignores non class_session flow', async () => {
      await expect(
        service.processClassStripeWebhookEvent({
          id: 'evt_1',
          type: 'checkout.session.completed',
          livemode: false,
          data: {
            object: {
              id: 'cs_1',
              metadata: { flow: 'fixed_event_ticket' },
            },
          },
        }),
      ).resolves.toEqual({ handled: false });
    });

    it('marks PENDING enrollment as PAID on completed checkout', async () => {
      const enrollment = pendingClassEnrollmentInclude();
      repository.findClassEnrollmentForCheckoutSession.mockResolvedValue(
        enrollment,
      );
      repository.markClassEnrollmentPaid.mockResolvedValue({
        ...enrollment,
        status: UpcomingClassEnrollmentStatus.PAID,
      });

      await expect(
        service.processClassStripeWebhookEvent({
          id: 'evt_paid_new',
          type: 'checkout.session.completed',
          livemode: false,
          data: {
            object: makeStripeCheckoutSessionLite({
              id: 'cs_class_new',
              amount_total: 5000,
              currency: 'usd',
              metadata: { flow: 'class_session' },
            }),
          },
        }),
      ).resolves.toEqual({ handled: true });

      expect(repository.markClassEnrollmentPaid).toHaveBeenCalledWith(
        enrollment.id,
        expect.objectContaining({
          paymentIntentId: expect.any(String) as string,
        }),
      );
      expect(harness.mail.sendTransactional).toHaveBeenCalled();
      expect(
        harness.adminPaymentNotify.notifyPaymentOutcome,
      ).toHaveBeenCalledWith(
        expect.objectContaining({ outcome: 'PAID', flow: 'CLASS_SESSION' }),
      );
    });

    it('handles already-paid enrollment without destructive re-update', async () => {
      repository.findClassEnrollmentForCheckoutSession.mockResolvedValue({
        id: 'enr-1',
        status: UpcomingClassEnrollmentStatus.PAID,
        amount: 40,
        currency: 'usd',
        session: { section: null, event: { eventType: null } },
      });

      await expect(
        service.processClassStripeWebhookEvent({
          id: 'evt_paid',
          type: 'checkout.session.completed',
          livemode: false,
          data: {
            object: {
              id: 'cs_class',
              metadata: { flow: 'class_session' },
              payment_status: 'paid',
              amount_total: 4000,
              currency: 'usd',
            },
          },
        }),
      ).resolves.toEqual({ handled: true });

      expect(repository.markClassEnrollmentPaid).not.toHaveBeenCalled();
    });

    it('throws BadRequestException when checkout payment_status is unpaid', async () => {
      repository.findClassEnrollmentForCheckoutSession.mockResolvedValue(
        pendingClassEnrollmentInclude(),
      );

      await expect(
        service.processClassStripeWebhookEvent({
          id: 'evt_unpaid',
          type: 'checkout.session.completed',
          livemode: false,
          data: {
            object: {
              id: 'cs_unpaid',
              metadata: { flow: 'class_session' },
              payment_status: 'unpaid',
              amount_total: 5000,
              currency: 'usd',
            },
          },
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('throws NotFoundException when enrollment is missing', async () => {
      repository.findClassEnrollmentForCheckoutSession.mockResolvedValue(null);
      await expect(
        service.processClassStripeWebhookEvent({
          id: 'evt_miss',
          type: 'checkout.session.completed',
          livemode: false,
          data: {
            object: {
              id: 'cs_miss',
              metadata: { flow: 'class_session' },
              payment_status: 'paid',
            },
          },
        }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('processClassPackageStripeWebhookEvent', () => {
    it('ignores unrelated flow', async () => {
      await expect(
        service.processClassPackageStripeWebhookEvent({
          id: 'evt_pkg',
          type: 'checkout.session.completed',
          livemode: false,
          data: {
            object: {
              id: 'cs_pkg',
              metadata: { flow: 'venue_seat' },
            },
          },
        }),
      ).resolves.toEqual({ handled: false });
    });

    it('marks package enrollment and child enrollments as PAID', async () => {
      const pkg = makeClassPackageWebhookInclude({ itemCount: 2 });
      repository.findPackageEnrollmentForCheckoutSession.mockResolvedValue(pkg);
      repository.findPackageEnrollmentById.mockResolvedValue({
        ...pkg,
        status: UpcomingClassEnrollmentStatus.PAID,
      });

      await expect(
        service.processClassPackageStripeWebhookEvent({
          id: 'evt_pkg_paid',
          type: 'checkout.session.completed',
          livemode: false,
          data: {
            object: makeStripeCheckoutSessionLite({
              id: 'cs_pkg_paid',
              amount_total: 10_000,
              metadata: { flow: 'class_session_bundle' },
            }),
          },
        }),
      ).resolves.toEqual({ handled: true });

      expect(repository.markPackageEnrollmentPaid).toHaveBeenCalledWith(
        'pkg-1',
      );
      expect(repository.markPackageChildEnrollmentPaid).toHaveBeenCalledWith(
        'child-1',
      );
      expect(repository.markPackageChildEnrollmentPaid).toHaveBeenCalledWith(
        'child-2',
      );
    });
  });

  describe('processFixedStripeWebhookEvent', () => {
    it('ignores non fixed_event_ticket flow', async () => {
      await expect(
        service.processFixedStripeWebhookEvent({
          id: 'evt_fix',
          type: 'checkout.session.completed',
          livemode: false,
          data: {
            object: {
              id: 'cs_fix',
              metadata: { flow: 'class_session' },
            },
          },
        }),
      ).resolves.toEqual({ handled: false });
    });

    it('marks fixed ticket enrollment as PAID on completed checkout', async () => {
      const enrollment = makeFixedEnrollmentWebhookInclude({
        id: 'fixed-enroll-1',
        stripeCheckoutSessionId: 'cs_fixed_paid',
        event: { slug: 'fixed-gala', eventType: { name: 'Gala Night' } },
      });
      repository.findFixedEnrollmentForCheckoutSession.mockResolvedValue(
        enrollment,
      );
      repository.findFixedEnrollmentRecordById.mockResolvedValue({
        ...enrollment,
        status: UpcomingClassEnrollmentStatus.PAID,
        ticketNumber: 1,
      });
      repository.findFixedEnrollmentById.mockResolvedValue({
        ...enrollment,
        status: UpcomingClassEnrollmentStatus.PAID,
        ticketNumber: 1,
        customerEmailSentAt: null,
        adminNotifySentAt: null,
      });
      repository.findVenueConfigByEventId.mockResolvedValue(
        makeVenueConfigStub({ eventId: enrollment.eventId }),
      );
      repository.finalizeFixedEnrollmentPayment.mockResolvedValue({
        ...enrollment,
        status: UpcomingClassEnrollmentStatus.PAID,
        ticketNumber: 1,
      });
      harness.stripe.client.paymentIntents.retrieve.mockResolvedValue({
        payment_method: {
          type: 'card',
          card: { brand: 'visa', last4: '4242' },
        },
      });

      await expect(
        service.processFixedStripeWebhookEvent({
          id: 'evt_fixed_paid',
          type: 'checkout.session.completed',
          livemode: false,
          data: {
            object: makeStripeCheckoutSessionLite({
              id: 'cs_fixed_paid',
              amount_total: 2500,
              metadata: { flow: 'fixed_event_ticket' },
            }),
          },
        }),
      ).resolves.toEqual({ handled: true });

      expect(
        harness.adminPaymentNotify.notifyPaymentOutcome,
      ).toHaveBeenCalledWith(
        expect.objectContaining({ outcome: 'PAID', flow: 'FIXED_TICKET' }),
      );
    });
  });

  describe('reconcileClassSessionFromStripeSession', () => {
    it('rejects unpaid session', async () => {
      await expect(
        service.reconcileClassSessionFromStripeSession('cs_1', {
          status: 'open',
          payment_status: 'unpaid',
          metadata: { flow: 'class_session' },
          id: 'cs_1',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('returns reconciled true for paid class session', async () => {
      const enrollment = pendingClassEnrollmentInclude();
      repository.findClassEnrollmentForCheckoutSession.mockResolvedValue(
        enrollment,
      );
      repository.markClassEnrollmentPaid.mockResolvedValue({
        ...enrollment,
        status: UpcomingClassEnrollmentStatus.PAID,
      });

      await expect(
        service.reconcileClassSessionFromStripeSession(
          'cs_reconcile',
          makeStripeCheckoutSessionLite({
            id: 'cs_reconcile',
            amount_total: 5000,
          }),
        ),
      ).resolves.toEqual({ reconciled: true });
    });

    it('throws when Stripe session retrieve fails', async () => {
      harness.stripe.client.checkout.sessions.retrieve.mockRejectedValue(
        new Error('stripe down'),
      );

      await expect(
        service.reconcileClassSessionFromStripeSession('cs_missing'),
      ).rejects.toThrow('stripe down');
    });
  });

  describe('reconcileFixedTicketFromStripeSession', () => {
    it('rejects wrong flow', async () => {
      await expect(
        service.reconcileFixedTicketFromStripeSession('cs_2', {
          status: 'complete',
          payment_status: 'paid',
          metadata: { flow: 'class_session' },
          id: 'cs_2',
        }),
      ).rejects.toThrow(/Not a fixed ticket/i);
    });
  });

  describe('reconcileClassFromStripeSession', () => {
    it('routes package enrollments to package reconcile', async () => {
      repository.findPackageEnrollmentByCheckoutSessionId.mockResolvedValue({
        id: 'pkg-1',
      });
      harness.stripe.client.checkout.sessions.retrieve.mockResolvedValue({
        status: 'open',
        payment_status: 'unpaid',
        metadata: { flow: 'class_package' },
        id: 'cs_pkg',
      });

      await expect(
        service.reconcileClassFromStripeSession('cs_pkg'),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(
        repository.findPackageEnrollmentByCheckoutSessionId,
      ).toHaveBeenCalledWith('cs_pkg');
    });
  });

  describe('getClassSessionStatus', () => {
    it('throws NotFoundException when enrollment is missing', async () => {
      prisma.upcomingClassPackageEnrollment.findUnique.mockResolvedValue(null);
      prisma.upcomingClassEnrollment.findUnique.mockResolvedValue(null);

      await expect(
        service.getClassSessionStatus('cs_missing'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('soft-reconciles paid checkout and returns enrollment status', async () => {
      const pending = pendingClassEnrollmentInclude();
      const paid = {
        ...pending,
        status: UpcomingClassEnrollmentStatus.PAID,
      };
      repository.findPackageEnrollmentForCheckoutSession.mockResolvedValue(
        null,
      );
      repository.findClassEnrollmentForCheckoutSession
        .mockResolvedValueOnce(pending)
        .mockResolvedValueOnce(pending)
        .mockResolvedValueOnce(paid);
      repository.markClassEnrollmentPaid.mockResolvedValue(paid);
      harness.stripe.client.checkout.sessions.retrieve.mockResolvedValue(
        makeStripeCheckoutSessionLite({ id: 'cs_status' }),
      );

      const result = await service.getClassSessionStatus('cs_status');

      expect(result.stripeStatus).toBe('complete');
      expect(result.enrollment).toEqual(
        expect.objectContaining({
          status: UpcomingClassEnrollmentStatus.PAID,
          eventSlug: 'salsa-night',
        }),
      );
    });

    it('throws NotFoundException when Stripe checkout session cannot be retrieved', async () => {
      prisma.upcomingClassEnrollment.findUnique.mockResolvedValue(
        pendingClassEnrollmentInclude(),
      );
      harness.stripe.client.checkout.sessions.retrieve.mockRejectedValue(
        new Error('not found'),
      );

      await expect(
        service.getClassSessionStatus('cs_stripe_missing'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('regenerateAdminClassSessions', () => {
    it('throws NotFoundException when admin upcoming event is missing', async () => {
      prisma.event.findFirst.mockResolvedValue(null);
      await expect(
        service.regenerateAdminClassSessions('missing-event'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('returns regeneration counts from class session generator', async () => {
      prisma.event.findFirst.mockResolvedValue({
        ...makePublicEventStub(),
        publicSection: EventPublicSection.UPCOMING_EVENTS,
      });
      const spy = jest
        .spyOn(classSessionGenerator, 'regenerateClassSessionsForEvent')
        .mockResolvedValue({ upserted: 3, deactivated: 1 });

      await expect(
        service.regenerateAdminClassSessions('event-1'),
      ).resolves.toEqual({ upserted: 3, deactivated: 1 });

      expect(spy).toHaveBeenCalledWith(prisma, 'event-1');
      spy.mockRestore();
    });
  });

  describe('createAdminSession', () => {
    const upsertDto = {
      startsAt: '2026-09-01T15:00:00.000Z',
      endsAt: '2026-09-01T16:00:00.000Z',
      capacity: 20,
      price: 50,
    };

    it('throws NotFoundException when admin upcoming event is missing', async () => {
      prisma.event.findFirst.mockResolvedValue(null);
      await expect(
        service.createAdminSession('missing-event', upsertDto),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('creates admin class session for classes event', async () => {
      prisma.event.findFirst.mockResolvedValue({
        ...makeClassesEventStub(),
        publicSection: EventPublicSection.UPCOMING_EVENTS,
      });
      const created = mockFutureClassSession('event-1', {
        currency: 'usd',
        isActive: true,
        sortOrder: 0,
      });
      prisma.upcomingClassSession.create.mockResolvedValue(created);

      const result = await service.createAdminSession('event-1', upsertDto);

      expect(prisma.upcomingClassSession.create).toHaveBeenCalled();
      expect(result.id).toBe(created.id);
    });
  });

  describe('deleteAdminSession', () => {
    it('throws NotFoundException when session is missing', async () => {
      prisma.event.findFirst.mockResolvedValue({
        ...makeClassesEventStub(),
        publicSection: EventPublicSection.UPCOMING_EVENTS,
      });
      prisma.upcomingClassSession.findFirst.mockResolvedValue(null);

      await expect(
        service.deleteAdminSession('event-1', 'missing-session'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('deletes existing admin session', async () => {
      prisma.event.findFirst.mockResolvedValue({
        ...makeClassesEventStub(),
        publicSection: EventPublicSection.UPCOMING_EVENTS,
      });
      prisma.upcomingClassSession.findFirst.mockResolvedValue(
        mockFutureClassSession('event-1'),
      );

      await expect(
        service.deleteAdminSession('event-1', 'session-1'),
      ).resolves.toEqual({ message: 'Session deleted.' });

      expect(prisma.upcomingClassSession.delete).toHaveBeenCalledWith({
        where: { id: 'session-1' },
      });
    });
  });

  describe('admin class enrollment delegation', () => {
    it('delegates booking context / list / cash / checkout / pay token', async () => {
      harness.adminClassEnrollment.getAdminClassBookingContext.mockResolvedValue(
        { event: { id: 'event-1' } },
      );
      harness.adminClassEnrollment.listAdminBookableClassEvents.mockResolvedValue(
        { events: [] },
      );
      harness.adminClassEnrollment.createAdminClassCashEnrollment.mockResolvedValue(
        { enrollmentId: 'cash-1', message: 'ok' },
      );
      harness.adminClassEnrollment.createAdminClassCheckoutSession.mockResolvedValue(
        { enrollmentId: 'co-1', message: 'ok', payUrl: 'https://x' },
      );
      harness.adminClassEnrollment.resolveClassPayCheckoutClientSecret.mockResolvedValue(
        { clientSecret: 'sec' },
      );

      await expect(
        service.getAdminClassBookingContext('event-1'),
      ).resolves.toEqual({ event: { id: 'event-1' } });
      await expect(service.listAdminBookableClassEvents()).resolves.toEqual({
        events: [],
      });
      await expect(
        service.createAdminClassCashEnrollment('admin-1', {
          upcomingEventId: 'event-1',
          purchaseKind: 'session',
          sessionId: 'session-1',
          customerName: 'A',
          customerEmail: 'a@b.com',
        }),
      ).resolves.toEqual({ enrollmentId: 'cash-1', message: 'ok' });
      await expect(
        service.createAdminClassCheckoutSession('admin-1', {
          upcomingEventId: 'event-1',
          purchaseKind: 'session',
          sessionId: 'session-1',
          customerName: 'A',
          customerEmail: 'a@b.com',
        }),
      ).resolves.toMatchObject({ enrollmentId: 'co-1' });
      await expect(
        service.resolveClassPayCheckoutClientSecret('token'),
      ).resolves.toEqual({ clientSecret: 'sec' });
    });
  });

  describe('getPublicBySlug / listPublicSessions', () => {
    it('returns public class event with sessions and seats', async () => {
      mockPublicClassesEvent();
      prisma.upcomingVenueConfig.findUnique.mockResolvedValue({
        ...makeVenueConfigStub({ classPackageEnabled: false }),
        reservationEventTemplate: makeRecurringTemplateStub(),
        clientEnabled: false,
        reservationOpensAt: null,
        reservationClosesAt: null,
        reservationEventDate: null,
        reservationTimezone: 'America/New_York',
        fixedTicketCapacity: null,
      });
      prisma.upcomingClassSession.findMany.mockResolvedValue([
        {
          ...mockFutureClassSession('event-1'),
          section: null,
          currency: 'usd',
          weekday: 1,
          sectionId: null,
        },
      ]);
      prisma.upcomingClassEnrollment.count.mockResolvedValue(2);

      const result = await service.getPublicBySlug('salsa-night');

      expect(result.slug).toBe('salsa-night');
      expect(result.hasActiveSessions).toBe(true);
      expect(result.sessions).toHaveLength(1);
      expect(result.sessions[0]?.seatsRemaining).toBe(18);
    });

    it('listPublicSessions returns event summary and seat counts', async () => {
      mockPublicClassesEvent();
      prisma.upcomingClassSession.findMany.mockResolvedValue([
        {
          ...mockFutureClassSession('event-1'),
          section: null,
          currency: 'usd',
        },
      ]);
      prisma.upcomingClassEnrollment.findMany.mockResolvedValue([]);

      const result = await service.listPublicSessions('salsa-night');

      expect(result.event.slug).toBe('salsa-night');
      expect(result.sessions[0]?.seatsRemaining).toBe(20);
    });
  });

  describe('processClassStripeWebhookEvent expired', () => {
    it('marks PENDING enrollment as EXPIRED', async () => {
      const enrollment = pendingClassEnrollmentInclude();
      repository.findClassEnrollmentForExpire.mockResolvedValue(enrollment);
      repository.markClassEnrollmentExpired.mockResolvedValue({
        ...enrollment,
        status: UpcomingClassEnrollmentStatus.EXPIRED,
      });

      await expect(
        service.processClassStripeWebhookEvent({
          id: 'evt_expired',
          type: 'checkout.session.expired',
          livemode: false,
          data: {
            object: {
              id: 'cs_expired',
              metadata: { flow: 'class_session' },
              payment_status: 'unpaid',
            },
          },
        }),
      ).resolves.toEqual({ handled: true });

      expect(repository.markClassEnrollmentExpired).toHaveBeenCalledWith(
        enrollment.id,
      );
    });
  });

  describe('listAdminSessions / updateAdminSession / getAdminVenueConfig', () => {
    it('listAdminSessions maps rows for admin event', async () => {
      prisma.event.findFirst.mockResolvedValue({
        ...makeClassesEventStub(),
        publicSection: EventPublicSection.UPCOMING_EVENTS,
      });
      prisma.upcomingClassSession.findMany.mockResolvedValue([
        mockFutureClassSession('event-1', {
          currency: 'usd',
          isActive: true,
          sortOrder: 0,
        }),
      ]);

      const rows = await service.listAdminSessions('event-1');
      expect(rows).toHaveLength(1);
      expect(rows[0]?.id).toBe('session-1');
    });

    it('updateAdminSession updates existing session', async () => {
      prisma.event.findFirst.mockResolvedValue({
        ...makeClassesEventStub(),
        publicSection: EventPublicSection.UPCOMING_EVENTS,
      });
      const existing = mockFutureClassSession('event-1', {
        timezone: 'America/New_York',
        isActive: true,
        sortOrder: 0,
      });
      prisma.upcomingClassSession.findFirst.mockResolvedValue(existing);
      prisma.upcomingClassSession.update.mockResolvedValue({
        ...existing,
        capacity: 25,
      });

      const result = await service.updateAdminSession('event-1', 'session-1', {
        startsAt: '2026-09-01T15:00:00.000Z',
        endsAt: '2026-09-01T16:00:00.000Z',
        capacity: 25,
        price: 55,
      });

      expect(result.capacity).toBe(25);
    });

    it('updateAdminSession throws when session missing', async () => {
      prisma.event.findFirst.mockResolvedValue({
        ...makeClassesEventStub(),
        publicSection: EventPublicSection.UPCOMING_EVENTS,
      });
      prisma.upcomingClassSession.findFirst.mockResolvedValue(null);

      await expect(
        service.updateAdminSession('event-1', 'missing', {
          startsAt: '2026-09-01T15:00:00.000Z',
          endsAt: '2026-09-01T16:00:00.000Z',
          capacity: 10,
          price: 40,
        }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('getAdminVenueConfig returns null when missing', async () => {
      prisma.event.findFirst.mockResolvedValue({
        ...makeClassesEventStub(),
        publicSection: EventPublicSection.UPCOMING_EVENTS,
      });
      prisma.upcomingVenueConfig.findUnique.mockResolvedValue(null);

      await expect(service.getAdminVenueConfig('event-1')).resolves.toBeNull();
    });
  });

  describe('createClassCheckout edge cases', () => {
    it('throws BadRequest when session already ended', async () => {
      mockPublicClassesEvent();
      prisma.upcomingClassSession.findFirst.mockResolvedValue(
        makeUpcomingClassSessionStub({
          endsAt: new Date('2020-01-01T00:00:00.000Z'),
        }),
      );

      await expect(
        service.createClassCheckout('salsa-night', checkoutDto),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('throws BadRequest when session price is below Stripe minimum', async () => {
      mockPublicClassesEvent();
      prisma.upcomingClassSession.findFirst.mockResolvedValue(
        mockFutureClassSession('event-1', { price: 0.1 }),
      );
      mockSeatsAvailable(20);

      await expect(
        service.createClassCheckout('salsa-night', checkoutDto),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  function makeFixedEventTemplateStub() {
    return {
      id: 'tpl-fixed-1',
      name: 'Gala Fixed',
      timezone: 'America/New_York',
      scheduleMode: ReservationEventScheduleMode.FIXED_EVENT,
      salesStartDate: new Date('2026-01-01T00:00:00.000Z'),
      salesEndDate: new Date('2026-12-31T00:00:00.000Z'),
      eventDate: new Date('2026-09-01T00:00:00.000Z'),
      eventStartTime: '19:00',
      eventEndTime: '23:00',
      weekdays: [],
      classSections: [],
    };
  }

  function mockVenueSeatingPublicEvent(
    overrides: Record<string, unknown> = {},
  ) {
    const event = {
      id: 'venue-event-1',
      slug: 'venue-gala',
      description: 'Venue seating gala',
      items: [] as string[],
      price: null,
      classVariant: null,
      experienceType: UpcomingExperienceType.VENUE_SEATING,
      publicSection: EventPublicSection.UPCOMING_EVENTS,
      isActive: true,
      eventType: { name: 'Gala Night' },
      galleryPhotos: [],
      ...overrides,
    };
    prisma.event.findFirst.mockResolvedValue(event);
    return event;
  }

  describe('upsertAdminVenueConfig', () => {
    it('links FIXED_EVENT template and sets fixed ticket capacity', async () => {
      prisma.event.findFirst.mockResolvedValue({
        ...makePublicEventStub(),
        publicSection: EventPublicSection.UPCOMING_EVENTS,
        experienceType: null,
      });
      prisma.upcomingVenueConfig.findUnique.mockResolvedValue(null);
      harness.reservationTemplates.findByIdOrThrow.mockResolvedValue(
        makeFixedEventTemplateStub(),
      );
      prisma.upcomingFixedEventEnrollment.count.mockResolvedValue(0);
      const savedConfig = {
        id: 'config-1',
        eventId: 'event-1',
        clientEnabled: false,
        promoTitle: null,
        promoDescription: null,
        promoImageUrl: null,
        reservationEventDate: new Date('2026-09-01T19:00:00.000Z'),
        reservationOpensAt: new Date('2026-01-01T00:00:00.000Z'),
        reservationClosesAt: new Date('2026-12-31T23:59:59.999Z'),
        reservationEventLabel: 'Gala Fixed',
        reservationTimezone: 'America/New_York',
        floorLayoutId: null,
        fixedTicketCapacity: 100,
        classPackageEnabled: false,
        classPackagePrice: null,
        classPackageLabel: null,
        reservationEventTemplateId: 'tpl-fixed-1',
        reservationEventTemplate: makeFixedEventTemplateStub(),
      };
      prisma.upcomingVenueConfig.upsert.mockResolvedValue(savedConfig);

      const result = await service.upsertAdminVenueConfig('event-1', {
        reservationEventTemplateId: 'tpl-fixed-1',
        fixedTicketCapacity: 100,
        clientEnabled: false,
      });

      expect(harness.reservationTemplates.findByIdOrThrow).toHaveBeenCalledWith(
        'tpl-fixed-1',
      );
      expect(prisma.event.update).toHaveBeenCalledWith({
        where: { id: 'event-1' },
        data: { experienceType: null, classVariant: null },
      });
      expect(result.fixedTicketCapacity).toBe(100);
      expect(result.reservationEventTemplateId).toBe('tpl-fixed-1');
    });

    it('updates existing venue config promo fields', async () => {
      prisma.event.findFirst.mockResolvedValue({
        ...makeClassesEventStub(),
        id: 'event-1',
        experienceType: UpcomingExperienceType.VENUE_SEATING,
        publicSection: EventPublicSection.UPCOMING_EVENTS,
      });
      prisma.upcomingVenueConfig.findUnique.mockResolvedValue({
        ...makeVenueConfigStub({ clientEnabled: true }),
        id: 'config-1',
        reservationEventTemplate: null,
      });
      prisma.upcomingVenueConfig.upsert.mockResolvedValue({
        id: 'config-1',
        eventId: 'event-1',
        clientEnabled: true,
        promoTitle: 'Summer Gala',
        promoDescription: 'Reserve your table',
        promoImageUrl: null,
        reservationEventDate: new Date('2026-09-01T00:00:00.000Z'),
        reservationOpensAt: new Date('2026-01-01T00:00:00.000Z'),
        reservationClosesAt: new Date('2026-12-31T00:00:00.000Z'),
        reservationEventLabel: 'Gala Night',
        reservationTimezone: 'America/New_York',
        floorLayoutId: 'layout-1',
        fixedTicketCapacity: null,
        classPackageEnabled: false,
        classPackagePrice: null,
        classPackageLabel: null,
        reservationEventTemplateId: null,
        reservationEventTemplate: null,
      });

      const result = await service.upsertAdminVenueConfig('event-1', {
        promoTitle: 'Summer Gala',
        promoDescription: 'Reserve your table',
      });

      expect(result.promoTitle).toBe('Summer Gala');
      expect(result.promoDescription).toBe('Reserve your table');
      expect(prisma.upcomingVenueConfig.upsert).toHaveBeenCalled();
    });

    it('throws BadRequest when event is not venue seating and patch is invalid', async () => {
      prisma.event.findFirst.mockResolvedValue({
        ...makePublicEventStub(),
        experienceType: null,
        publicSection: EventPublicSection.UPCOMING_EVENTS,
      });
      prisma.upcomingVenueConfig.findUnique.mockResolvedValue(null);

      await expect(
        service.upsertAdminVenueConfig('event-1', { promoTitle: 'Nope' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('throws Conflict when fixed ticket capacity is below sold count', async () => {
      prisma.event.findFirst.mockResolvedValue({
        ...makePublicEventStub(),
        publicSection: EventPublicSection.UPCOMING_EVENTS,
        experienceType: null,
      });
      prisma.upcomingVenueConfig.findUnique.mockResolvedValue({
        ...makeVenueConfigStub({
          clientEnabled: false,
          fixedTicketCapacity: 50,
        }),
        reservationEventTemplate: makeFixedEventTemplateStub(),
      });
      prisma.upcomingFixedEventEnrollment.count.mockResolvedValue(10);

      await expect(
        service.upsertAdminVenueConfig('event-1', { fixedTicketCapacity: 5 }),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('getPublicVenueBundle', () => {
    it('returns published venue bundle for seating event', async () => {
      mockVenueSeatingPublicEvent();
      prisma.upcomingVenueConfig.findUnique.mockResolvedValue({
        clientEnabled: true,
        reservationOpensAt: new Date('2026-01-01T00:00:00.000Z'),
        reservationClosesAt: new Date('2026-12-31T00:00:00.000Z'),
        reservationEventDate: new Date('2026-09-01T00:00:00.000Z'),
        reservationEventLabel: 'Gala Night',
        reservationTimezone: 'America/New_York',
        floorLayoutId: 'layout-1',
        promoTitle: null,
        promoDescription: null,
        promoImageUrl: null,
      });

      const result = await service.getPublicVenueBundle('venue-gala');

      expect(result.event.slug).toBe('venue-gala');
      expect(result.config.floorLayoutId).toBe('layout-1');
      expect(result.config.reservationEventLabel).toBe('Gala Night');
    });

    it('throws BadRequest when event is not venue seating', async () => {
      mockPublicClassesEvent();

      await expect(
        service.getPublicVenueBundle('salsa-night'),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('throws NotFound when seat reservations are unpublished', async () => {
      mockVenueSeatingPublicEvent();
      prisma.upcomingVenueConfig.findUnique.mockResolvedValue({
        clientEnabled: false,
        reservationOpensAt: null,
        reservationClosesAt: null,
        reservationEventDate: null,
        reservationEventLabel: null,
        reservationTimezone: 'America/New_York',
        floorLayoutId: null,
        promoTitle: null,
        promoDescription: null,
        promoImageUrl: null,
      });

      await expect(
        service.getPublicVenueBundle('venue-gala'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('getPublicClassOptions', () => {
    it('groups sessions by weekday from recurring schedule', async () => {
      const event = mockPublicClassesEvent();
      prisma.upcomingVenueConfig.findUnique.mockResolvedValue({
        ...makeVenueConfigStub({ classPackageEnabled: false }),
        reservationEventTemplate: makeRecurringTemplateStub(),
        clientEnabled: false,
        reservationOpensAt: null,
        reservationClosesAt: null,
        reservationEventDate: null,
        reservationTimezone: 'America/New_York',
        fixedTicketCapacity: null,
      });
      prisma.upcomingClassSession.findMany.mockResolvedValue([
        {
          ...mockFutureClassSession(event.id, { weekday: 1 }),
          section: null,
          currency: 'usd',
        },
        {
          ...mockFutureClassSession(event.id, {
            id: 'session-3',
            weekday: 3,
            startsAt: new Date('2026-08-03T15:00:00.000Z'),
            endsAt: new Date('2026-08-03T16:00:00.000Z'),
          }),
          section: null,
          currency: 'usd',
        },
      ]);
      prisma.upcomingClassEnrollment.count.mockResolvedValue(0);

      const result = await service.getPublicClassOptions('salsa-night');

      expect(result.eventSlug).toBe('salsa-night');
      expect(result.timezone).toBe('America/New_York');
      expect(result.days).toHaveLength(2);
      expect(result.days[0]?.sessions).toHaveLength(1);
      expect(result.days[1]?.sessions).toHaveLength(1);
    });

    it('throws BadRequest when purchase mode is not classes', async () => {
      mockFixedTicketContext();

      await expect(
        service.getPublicClassOptions('fixed-gala'),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('getFixedEventSessionStatus', () => {
    it('returns enrollment status and masks customer email', async () => {
      const enrollment = makeFixedEnrollmentWebhookInclude({
        id: 'fixed-enroll-1',
        status: UpcomingClassEnrollmentStatus.PAID,
        customerEmail: 'ticket@example.com',
        ticketNumber: 3,
        stripeCheckoutSessionId: 'cs_fixed_status',
        event: {
          slug: 'fixed-gala',
          eventType: { name: 'Gala Night' },
        },
      });
      repository.findFixedEnrollmentForCheckoutSession.mockResolvedValue(
        enrollment,
      );
      harness.stripe.client.checkout.sessions.retrieve.mockResolvedValue(
        makeStripeCheckoutSessionLite({
          id: 'cs_fixed_status',
          metadata: { flow: 'fixed_event_ticket' },
        }),
      );

      const result =
        await service.getFixedEventSessionStatus('cs_fixed_status');

      expect(result.stripeStatus).toBe('complete');
      expect(result.enrollment.status).toBe(UpcomingClassEnrollmentStatus.PAID);
      expect(result.enrollment.eventSlug).toBe('fixed-gala');
      expect(result.enrollment.ticketNumber).toBe(3);
      expect(result.enrollment.customerEmail).not.toBe('ticket@example.com');
    });

    it('throws NotFound when fixed enrollment is missing', async () => {
      repository.findFixedEnrollmentForCheckoutSession.mockResolvedValue(null);

      await expect(
        service.getFixedEventSessionStatus('cs_missing'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('getClassSessionStatus package branch', () => {
    it('returns day_bundle package status with session labels', async () => {
      const childSession = {
        startsAt: new Date('2026-08-15T15:00:00.000Z'),
        endsAt: new Date('2026-08-15T16:00:00.000Z'),
        timezone: 'America/New_York',
        section: null,
        event: { eventType: { name: 'Salsa Night' }, slug: 'salsa-night' },
      };
      const pkg = {
        id: 'pkg-status-1',
        status: UpcomingClassEnrollmentStatus.PAID,
        customerEmail: 'bundle@example.com',
        event: { eventType: { name: 'Salsa Night' }, slug: 'salsa-night' },
        items: [
          {
            weekday: 1,
            enrollmentId: 'child-1',
            enrollment: { id: 'child-1', session: childSession },
          },
        ],
      };
      repository.findPackageEnrollmentForCheckoutSession.mockResolvedValue(pkg);
      harness.stripe.client.checkout.sessions.retrieve.mockResolvedValue(
        makeStripeCheckoutSessionLite({
          id: 'cs_pkg_status',
          metadata: { flow: 'class_session_bundle' },
        }),
      );

      const result = await service.getClassSessionStatus('cs_pkg_status');

      expect(result.package).toBe(true);
      expect(result.purchaseKind).toBe('day_bundle');
      expect(result.enrollment.sessions).toHaveLength(1);
      expect(result.enrollment.eventSlug).toBe('salsa-night');
    });

    it('returns package purchaseKind for month package flow', async () => {
      const childSession = {
        startsAt: new Date('2026-08-15T15:00:00.000Z'),
        endsAt: new Date('2026-08-15T16:00:00.000Z'),
        timezone: 'America/New_York',
        section: null,
        event: { eventType: { name: 'Salsa Night' }, slug: 'salsa-night' },
      };
      const pkg = {
        id: 'pkg-month-1',
        status: UpcomingClassEnrollmentStatus.PENDING_PAYMENT,
        customerEmail: 'month@example.com',
        event: { eventType: { name: 'Salsa Night' }, slug: 'salsa-night' },
        items: [
          {
            weekday: 1,
            enrollmentId: 'child-m1',
            enrollment: { id: 'child-m1', session: childSession },
          },
        ],
      };
      repository.findPackageEnrollmentForCheckoutSession.mockResolvedValue(pkg);
      harness.stripe.client.checkout.sessions.retrieve.mockResolvedValue({
        status: 'open',
        payment_status: 'unpaid',
        metadata: { flow: 'class_month_package' },
      });

      const result = await service.getClassSessionStatus('cs_month_status');

      expect(result.package).toBe(true);
      expect(result.purchaseKind).toBe('package');
      expect(result.stripeStatus).toBe('open');
    });
  });

  describe('createFixedEventCheckout success', () => {
    it('creates pending enrollment and Stripe checkout on success', async () => {
      mockFixedTicketContext({ price: 25, capacity: 50, blockingCount: 0 });
      prisma.upcomingFixedEventEnrollment.create.mockResolvedValue({
        id: 'fixed-enroll-new',
      });

      const result = await service.createFixedEventCheckout('fixed-gala', {
        customerName: 'Ticket Guest',
        customerEmail: 'ticket@example.com',
      });

      expect(result).toEqual({
        clientSecret: 'cs_test_secret',
        enrollmentId: 'fixed-enroll-new',
      });
      expect(
        harness.stripe.client.checkout.sessions.create,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: { flow: 'fixed_event_ticket' },
        }),
      );
      expect(prisma.upcomingFixedEventEnrollment.create).toHaveBeenCalled();
      expect(
        harness.stripe.client.checkout.sessions.update,
      ).toHaveBeenCalledWith('cs_test_created', {
        metadata: {
          flow: 'fixed_event_ticket',
          enrollmentId: 'fixed-enroll-new',
        },
      });
    });
  });
});
