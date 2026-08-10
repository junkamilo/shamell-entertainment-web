/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/require-await */
import { UpcomingClassEnrollmentStatus } from '@prisma/client';

import {
  ADMIN_CLASS_ENROLLMENT_CREATE_INCLUDE,
  ADMIN_CLASS_PACKAGE_ENROLLMENT_INCLUDE,
  CLASS_ENROLLMENT_CHECKOUT_INCLUDE,
  CLASS_ENROLLMENT_EXPIRE_INCLUDE,
  FIXED_ENROLLMENT_WEBHOOK_INCLUDE,
  PACKAGE_ENROLLMENT_EXPIRE_INCLUDE,
  PACKAGE_ENROLLMENT_WEBHOOK_INCLUDE,
  UpcomingEventsRepository,
} from './upcoming-events.repository';

import { createUpcomingEventsRepositoryTestModule } from '../testing/upcoming-events-repository.test-module';

describe('UpcomingEventsRepository', () => {
  let repository: UpcomingEventsRepository;

  let prisma: Awaited<
    ReturnType<typeof createUpcomingEventsRepositoryTestModule>
  >['prisma'];

  beforeEach(async () => {
    jest.clearAllMocks();

    const harness = await createUpcomingEventsRepositoryTestModule();

    repository = harness.repository;

    prisma = harness.prisma;
  });

  it('asPrisma returns injected client', () => {
    expect(repository.asPrisma()).toBe(prisma);
  });

  it('findClassEnrollmentByCheckoutSessionId looks up by session id', async () => {
    prisma.upcomingClassEnrollment.findUnique.mockResolvedValue({
      id: 'enroll-1',
    });

    await expect(
      repository.findClassEnrollmentByCheckoutSessionId('cs_1'),
    ).resolves.toEqual({ id: 'enroll-1' });

    expect(prisma.upcomingClassEnrollment.findUnique).toHaveBeenCalledWith({
      where: { stripeCheckoutSessionId: 'cs_1' },
    });
  });

  it('findClassEnrollmentForCheckoutSession includes session.section and event.eventType', async () => {
    prisma.upcomingClassEnrollment.findUnique.mockResolvedValue({ id: 'e1' });

    await repository.findClassEnrollmentForCheckoutSession('cs_checkout');

    expect(prisma.upcomingClassEnrollment.findUnique).toHaveBeenCalledWith({
      where: { stripeCheckoutSessionId: 'cs_checkout' },

      include: CLASS_ENROLLMENT_CHECKOUT_INCLUDE,
    });
  });

  it('findClassEnrollmentForExpire includes session.event.eventType only', async () => {
    prisma.upcomingClassEnrollment.findUnique.mockResolvedValue({ id: 'e1' });

    await repository.findClassEnrollmentForExpire('cs_exp');

    expect(prisma.upcomingClassEnrollment.findUnique).toHaveBeenCalledWith({
      where: { stripeCheckoutSessionId: 'cs_exp' },

      include: CLASS_ENROLLMENT_EXPIRE_INCLUDE,
    });
  });

  it('markClassEnrollmentPaid sets PAID fields and clears expiresAt', async () => {
    prisma.upcomingClassEnrollment.update.mockResolvedValue({ id: 'e1' });

    await repository.markClassEnrollmentPaid('e1', {
      paymentIntentId: 'pi_1',
    });

    expect(prisma.upcomingClassEnrollment.update).toHaveBeenCalledWith({
      where: { id: 'e1' },

      data: expect.objectContaining({
        status: UpcomingClassEnrollmentStatus.PAID,

        stripePaymentIntentId: 'pi_1',

        expiresAt: null,

        paidAt: expect.any(Date),
      }),
    });
  });

  it('stampClassEnrollmentEmailSent sets customerEmailSentAt', async () => {
    prisma.upcomingClassEnrollment.update.mockResolvedValue({ id: 'e1' });

    await repository.stampClassEnrollmentEmailSent('e1');

    expect(prisma.upcomingClassEnrollment.update).toHaveBeenCalledWith({
      where: { id: 'e1' },

      data: { customerEmailSentAt: expect.any(Date) },
    });
  });

  it('markClassEnrollmentExpired sets EXPIRED status', async () => {
    prisma.upcomingClassEnrollment.update.mockResolvedValue({ id: 'e1' });

    await repository.markClassEnrollmentExpired('e1');

    expect(prisma.upcomingClassEnrollment.update).toHaveBeenCalledWith({
      where: { id: 'e1' },

      data: { status: UpcomingClassEnrollmentStatus.EXPIRED },
    });
  });

  it('findPackageEnrollmentForCheckoutSession uses webhook include shape', async () => {
    prisma.upcomingClassPackageEnrollment.findUnique.mockResolvedValue({
      id: 'pkg-1',
    });

    await repository.findPackageEnrollmentForCheckoutSession('cs_pkg');

    expect(
      prisma.upcomingClassPackageEnrollment.findUnique,
    ).toHaveBeenCalledWith({
      where: { stripeCheckoutSessionId: 'cs_pkg' },

      include: PACKAGE_ENROLLMENT_WEBHOOK_INCLUDE,
    });
  });

  it('markPackageEnrollmentPaid and markPackageChildEnrollmentPaid update statuses', async () => {
    prisma.upcomingClassPackageEnrollment.update.mockResolvedValue({
      id: 'pkg-1',
    });

    prisma.upcomingClassEnrollment.update.mockResolvedValue({ id: 'child-1' });

    await repository.markPackageEnrollmentPaid('pkg-1');

    await repository.markPackageChildEnrollmentPaid('child-1');

    expect(prisma.upcomingClassPackageEnrollment.update).toHaveBeenCalledWith({
      where: { id: 'pkg-1' },

      data: expect.objectContaining({
        status: UpcomingClassEnrollmentStatus.PAID,

        expiresAt: null,
      }),
    });

    expect(prisma.upcomingClassEnrollment.update).toHaveBeenCalledWith({
      where: { id: 'child-1' },

      data: expect.objectContaining({
        status: UpcomingClassEnrollmentStatus.PAID,

        expiresAt: null,
      }),
    });
  });

  it('markPackageEnrollmentExpired expires package and each child', async () => {
    prisma.upcomingClassPackageEnrollment.update.mockResolvedValue({
      id: 'pkg-1',
    });

    prisma.upcomingClassEnrollment.update.mockResolvedValue({ id: 'c1' });

    await repository.markPackageEnrollmentExpired('pkg-1', ['c1', 'c2']);

    expect(prisma.upcomingClassPackageEnrollment.update).toHaveBeenCalledWith({
      where: { id: 'pkg-1' },

      data: { status: UpcomingClassEnrollmentStatus.EXPIRED },
    });

    expect(prisma.upcomingClassEnrollment.update).toHaveBeenCalledTimes(2);
  });

  it('findPackageEnrollmentForExpire uses expire include', async () => {
    prisma.upcomingClassPackageEnrollment.findUnique.mockResolvedValue({
      id: 'pkg-1',
    });

    await repository.findPackageEnrollmentForExpire('cs_pkg_exp');

    expect(
      prisma.upcomingClassPackageEnrollment.findUnique,
    ).toHaveBeenCalledWith({
      where: { stripeCheckoutSessionId: 'cs_pkg_exp' },

      include: PACKAGE_ENROLLMENT_EXPIRE_INCLUDE,
    });
  });

  it('findFixedEnrollmentForCheckoutSession includes event.eventType', async () => {
    prisma.upcomingFixedEventEnrollment.findUnique.mockResolvedValue({
      id: 'fx-1',
    });

    await repository.findFixedEnrollmentForCheckoutSession('cs_fixed');

    expect(prisma.upcomingFixedEventEnrollment.findUnique).toHaveBeenCalledWith(
      {
        where: { stripeCheckoutSessionId: 'cs_fixed' },

        include: FIXED_ENROLLMENT_WEBHOOK_INCLUDE,
      },
    );
  });

  it('finalizeFixedEnrollmentPayment runs transaction and assigns ticket', async () => {
    const enrollment = {
      id: 'fx-1',

      eventId: 'ev-1',

      ticketNumber: null,

      event: { eventType: { name: 'Gala' } },
    };

    prisma.$transaction.mockImplementation(
      async (fn: (tx: unknown) => unknown) => {
        const tx = {
          upcomingFixedEventEnrollment: {
            findUnique: jest.fn().mockResolvedValue({
              id: 'fx-1',

              status: UpcomingClassEnrollmentStatus.PENDING_PAYMENT,

              ticketNumber: null,
            }),

            updateMany: jest.fn().mockResolvedValue({ count: 1 }),

            aggregate: jest
              .fn()
              .mockResolvedValue({ _max: { ticketNumber: 0 } }),

            update: jest.fn().mockResolvedValue({ ticketNumber: 1 }),
          },
        };

        return fn(tx);
      },
    );

    const result = await repository.finalizeFixedEnrollmentPayment(enrollment, {
      paymentIntentId: 'pi_fx',

      paymentMethodType: 'card',

      paymentMethodBrand: 'visa',

      paymentMethodLast4: '4242',

      fixedTicketCapacity: 50,
    });

    expect(prisma.$transaction).toHaveBeenCalled();

    expect(result).toEqual(
      expect.objectContaining({ id: 'fx-1', ticketNumber: 1 }),
    );
  });

  it('markFixedEnrollmentPaidWithoutTicket uses updateMany on PENDING only', async () => {
    prisma.upcomingFixedEventEnrollment.updateMany.mockResolvedValue({
      count: 1,
    });

    await repository.markFixedEnrollmentPaidWithoutTicket('fx-1', {
      paymentIntentId: 'pi_fx',

      paymentMethodType: 'card',

      paymentMethodBrand: 'visa',

      paymentMethodLast4: '4242',
    });

    expect(prisma.upcomingFixedEventEnrollment.updateMany).toHaveBeenCalledWith(
      {
        where: {
          id: 'fx-1',

          status: UpcomingClassEnrollmentStatus.PENDING_PAYMENT,
        },

        data: expect.objectContaining({
          status: UpcomingClassEnrollmentStatus.PAID,

          stripePaymentIntentId: 'pi_fx',
        }),
      },
    );
  });

  it('findVenueConfigByEventId looks up by eventId', async () => {
    prisma.upcomingVenueConfig.findUnique.mockResolvedValue({
      eventId: 'event-1',
    });

    await expect(
      repository.findVenueConfigByEventId('event-1'),
    ).resolves.toEqual({ eventId: 'event-1' });
  });

  it('listActiveClassEventsWithVenueConfig filters CLASSES upcoming events', async () => {
    prisma.event.findMany.mockResolvedValue([{ id: 'ev-1' }]);
    await expect(
      repository.listActiveClassEventsWithVenueConfig(),
    ).resolves.toEqual([{ id: 'ev-1' }]);
    expect(prisma.event.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          experienceType: 'CLASSES',
        }),
      }),
    );
  });

  it('createClassEnrollment uses admin create include by default', async () => {
    prisma.upcomingClassEnrollment.create.mockResolvedValue({ id: 'en-1' });
    await repository.createClassEnrollment({
      sessionId: 's1',
      amount: 50,
      currency: 'usd',
    } as never);
    expect(prisma.upcomingClassEnrollment.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ sessionId: 's1' }),
      include: ADMIN_CLASS_ENROLLMENT_CREATE_INCLUDE,
    });
  });

  it('findPendingClassEnrollmentByPayToken filters pending by hash', async () => {
    prisma.upcomingClassEnrollment.findFirst.mockResolvedValue({ id: 'en-1' });
    await repository.findPendingClassEnrollmentByPayToken('hash-1');
    expect(prisma.upcomingClassEnrollment.findFirst).toHaveBeenCalledWith({
      where: {
        payTokenHash: 'hash-1',
        status: UpcomingClassEnrollmentStatus.PENDING_PAYMENT,
      },
      orderBy: { createdAt: 'desc' },
    });
  });

  it('findClassPackageEnrollmentWithAdminItems uses admin include', async () => {
    prisma.upcomingClassPackageEnrollment.findUnique.mockResolvedValue({
      id: 'pkg-1',
    });
    await repository.findClassPackageEnrollmentWithAdminItems('pkg-1');
    expect(
      prisma.upcomingClassPackageEnrollment.findUnique,
    ).toHaveBeenCalledWith({
      where: { id: 'pkg-1' },
      include: ADMIN_CLASS_PACKAGE_ENROLLMENT_INCLUDE,
    });
  });

  it('listClassSessionsForAdmin orders by startsAt and sortOrder', async () => {
    prisma.upcomingClassSession.findMany.mockResolvedValue([]);
    await repository.listClassSessionsForAdmin('event-1');
    expect(prisma.upcomingClassSession.findMany).toHaveBeenCalledWith({
      where: { eventId: 'event-1' },
      orderBy: [{ startsAt: 'asc' }, { sortOrder: 'asc' }],
    });
  });

  it('createPaidFixedEnrollmentWithTicket runs transaction', async () => {
    prisma.$transaction.mockImplementation(
      async (fn: (tx: unknown) => unknown) => {
        const tx = {
          upcomingFixedEventEnrollment: {
            create: jest.fn().mockResolvedValue({ id: 'fx-1' }),
            aggregate: jest
              .fn()
              .mockResolvedValue({ _max: { ticketNumber: 0 } }),
            update: jest.fn().mockResolvedValue({ ticketNumber: 1 }),
            findUniqueOrThrow: jest
              .fn()
              .mockResolvedValue({ id: 'fx-1', ticketNumber: 1 }),
          },
        };
        return fn(tx);
      },
    );
    await repository.createPaidFixedEnrollmentWithTicket(
      { eventId: 'ev-1' } as never,
      'ev-1',
      100,
    );
    expect(prisma.$transaction).toHaveBeenCalled();
  });

  it('upsertVenueConfigWithTemplate upserts with template include', async () => {
    prisma.upcomingVenueConfig.upsert.mockResolvedValue({ eventId: 'ev-1' });
    await repository.upsertVenueConfigWithTemplate(
      'ev-1',
      { eventId: 'ev-1', clientEnabled: false },
      { promoTitle: 'Promo' },
    );
    expect(prisma.upcomingVenueConfig.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { eventId: 'ev-1' },
        include: expect.objectContaining({
          reservationEventTemplate: expect.any(Object),
        }),
      }),
    );
  });

  it('findVenueConfigRecord looks up bare config row', async () => {
    prisma.upcomingVenueConfig.findUnique.mockResolvedValue({
      eventId: 'ev-1',
    });
    await expect(repository.findVenueConfigRecord('ev-1')).resolves.toEqual({
      eventId: 'ev-1',
    });
  });

  it('updateUpcomingEventExperience patches experience fields', async () => {
    prisma.event.update.mockResolvedValue({ id: 'ev-1' });
    await repository.updateUpcomingEventExperience('ev-1', {
      experienceType: 'CLASSES',
      classVariant: null,
    });
    expect(prisma.event.update).toHaveBeenCalledWith({
      where: { id: 'ev-1' },
      data: { experienceType: 'CLASSES', classVariant: null },
    });
  });

  it('runTransaction forwards to prisma.$transaction', async () => {
    prisma.$transaction.mockResolvedValue('ok');
    const fn = jest.fn().mockResolvedValue('ok');
    await expect(repository.runTransaction(fn)).resolves.toBe('ok');
    expect(prisma.$transaction).toHaveBeenCalledWith(fn, undefined);
  });

  it('findPackageEnrollmentByCheckoutSessionId and ById call shapes', async () => {
    prisma.upcomingClassPackageEnrollment.findUnique.mockResolvedValue({
      id: 'pkg-1',
    });
    await repository.findPackageEnrollmentByCheckoutSessionId('cs_pkg');
    await repository.findPackageEnrollmentById('pkg-1');
    expect(
      prisma.upcomingClassPackageEnrollment.findUnique,
    ).toHaveBeenCalledWith({
      where: { stripeCheckoutSessionId: 'cs_pkg' },
    });
    expect(
      prisma.upcomingClassPackageEnrollment.findUnique,
    ).toHaveBeenCalledWith({
      where: { id: 'pkg-1' },
      include: PACKAGE_ENROLLMENT_WEBHOOK_INCLUDE,
    });
  });

  it('stampPackageEnrollmentEmailSent and markPackageEnrollmentExpired', async () => {
    prisma.upcomingClassPackageEnrollment.update.mockResolvedValue({});
    prisma.upcomingClassEnrollment.update.mockResolvedValue({});
    const sentAt = new Date('2026-01-01T00:00:00.000Z');
    await repository.stampPackageEnrollmentEmailSent('pkg-1', sentAt);
    await repository.markPackageEnrollmentExpired('pkg-1', ['c1', 'c2']);
    expect(prisma.upcomingClassPackageEnrollment.update).toHaveBeenCalledWith({
      where: { id: 'pkg-1' },
      data: { customerEmailSentAt: sentAt },
    });
    expect(prisma.upcomingClassEnrollment.update).toHaveBeenCalledTimes(2);
  });

  it('fixed enrollment find/stamp/expire helpers', async () => {
    prisma.upcomingFixedEventEnrollment.findUnique.mockResolvedValue({
      id: 'fx-1',
    });
    prisma.upcomingFixedEventEnrollment.update.mockResolvedValue({});
    await repository.findFixedEnrollmentByCheckoutSessionId('cs_fx');
    await repository.findFixedEnrollmentById('fx-1');
    await repository.findFixedEnrollmentRecordById('fx-1');
    await repository.stampFixedEnrollmentEmailSent('fx-1');
    await repository.stampFixedEnrollmentAdminNotifySent('fx-1');
    await repository.markFixedEnrollmentExpired('fx-1');
    expect(prisma.upcomingFixedEventEnrollment.update).toHaveBeenCalledTimes(3);
  });

  it('findClassSessionById and countPaidClassEnrollmentsForSession', async () => {
    prisma.upcomingClassSession.findUnique.mockResolvedValue({ id: 's1' });
    prisma.upcomingClassEnrollment.count.mockResolvedValue(2);
    await expect(repository.findClassSessionById('s1')).resolves.toEqual({
      id: 's1',
    });
    await expect(
      repository.countPaidClassEnrollmentsForSession('s1'),
    ).resolves.toBe(2);
  });

  it('findPublicUpcomingBySlug throws when missing', async () => {
    prisma.event.findFirst.mockResolvedValue(null);
    await expect(
      repository.findPublicUpcomingBySlug('missing'),
    ).rejects.toThrow(/not found/i);
  });

  it('findPublicUpcomingBySlug returns event', async () => {
    prisma.event.findFirst.mockResolvedValue({
      id: 'ev-1',
      slug: 'salsa',
    });
    await expect(repository.findPublicUpcomingBySlug('Salsa')).resolves.toEqual(
      expect.objectContaining({ slug: 'salsa' }),
    );
  });

  it('findAdminUpcomingEventOrThrow throws when missing', async () => {
    prisma.event.findFirst.mockResolvedValue(null);
    await expect(
      repository.findAdminUpcomingEventOrThrow('missing'),
    ).rejects.toThrow(/not found/i);
  });

  it('batchSeatsRemaining empty and populated', async () => {
    await expect(repository.batchSeatsRemaining([])).resolves.toEqual(
      new Map(),
    );
    prisma.upcomingClassEnrollment.findMany.mockResolvedValue([
      { sessionId: 's1' },
      { sessionId: 's1' },
      { sessionId: 's2' },
    ]);
    const map = await repository.batchSeatsRemaining([
      { id: 's1', capacity: 10 },
      { id: 's2', capacity: 5 },
    ]);
    expect(map.get('s1')).toBe(2);
    expect(map.get('s2')).toBe(1);
  });

  it('seatsRemaining subtracts blocking count', async () => {
    prisma.upcomingClassEnrollment.count.mockResolvedValue(3);
    await expect(repository.seatsRemaining('s1', 10)).resolves.toBe(7);
  });

  it('findVenueConfigWithTemplate and findActiveClassSessionsForEvent', async () => {
    const now = new Date();
    prisma.upcomingVenueConfig.findUnique.mockResolvedValue({
      eventId: 'ev-1',
    });
    prisma.upcomingClassSession.findMany.mockResolvedValue([]);
    await repository.findVenueConfigWithTemplate('ev-1');
    await repository.findActiveClassSessionsForEvent('ev-1', now);
    expect(prisma.upcomingClassSession.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ eventId: 'ev-1', isActive: true }),
      }),
    );
  });

  it('listActiveClassSessionSummariesForEvents returns empty when no ids', async () => {
    await expect(
      repository.listActiveClassSessionSummariesForEvents([], new Date()),
    ).resolves.toEqual([]);
    expect(prisma.upcomingClassSession.findMany).not.toHaveBeenCalled();
  });

  it('listActiveClassSessionSummariesForEvents queries sessions', async () => {
    const now = new Date();
    prisma.upcomingClassSession.findMany.mockResolvedValue([{ id: 's1' }]);
    await expect(
      repository.listActiveClassSessionSummariesForEvents(['ev-1'], now),
    ).resolves.toEqual([{ id: 's1' }]);
  });

  it('createClassPackageEnrollment and Item and pending package pay token', async () => {
    prisma.upcomingClassPackageEnrollment.create.mockResolvedValue({
      id: 'pkg-1',
    });
    prisma.upcomingClassPackageEnrollmentItem.create.mockResolvedValue({
      id: 'item-1',
    });
    prisma.upcomingClassPackageEnrollment.findFirst.mockResolvedValue({
      id: 'pkg-1',
    });
    await repository.createClassPackageEnrollment({
      eventId: 'ev-1',
      amount: 100,
      currency: 'usd',
    } as never);
    await repository.createClassPackageEnrollmentItem({
      packageEnrollmentId: 'pkg-1',
      enrollmentId: 'en-1',
      weekday: 1,
    });
    await repository.findPendingClassPackageEnrollmentByPayToken('hash');
    expect(prisma.upcomingClassPackageEnrollment.create).toHaveBeenCalled();
    expect(prisma.upcomingClassPackageEnrollmentItem.create).toHaveBeenCalled();
  });

  it('findActiveClassSession(s) and month/box-office helpers', async () => {
    prisma.upcomingClassSession.findFirst.mockResolvedValue({ id: 's1' });
    prisma.upcomingClassSession.findMany.mockResolvedValue([{ id: 's1' }]);
    prisma.upcomingVenueConfig.findUnique.mockResolvedValue({
      eventId: 'ev-1',
    });
    prisma.event.findMany.mockResolvedValue([{ id: 'ev-1' }]);
    prisma.event.findFirst.mockResolvedValue({ id: 'ev-1' });
    await repository.findActiveClassSessionForEvent('s1', 'ev-1');
    await repository.findActiveClassSessionsByIdsForEvent(['s1'], 'ev-1');
    await repository.findVenueConfigForMonthPackage('ev-1');
    await repository.listBoxOfficeEligibleEvents();
    await repository.findActiveUpcomingEventWithVenueConfig('ev-1');
    await repository.findVenueConfigWithReservationTemplate('ev-1');
    expect(prisma.event.findMany).toHaveBeenCalled();
  });

  it('session CRUD and pending fixed create', async () => {
    prisma.upcomingClassSession.create.mockResolvedValue({ id: 's1' });
    prisma.upcomingClassSession.findFirst.mockResolvedValue({ id: 's1' });
    prisma.upcomingClassSession.update.mockResolvedValue({ id: 's1' });
    prisma.upcomingClassSession.delete.mockResolvedValue({ id: 's1' });
    prisma.upcomingFixedEventEnrollment.create.mockResolvedValue({
      id: 'fx-1',
    });
    await repository.createClassSession({
      eventId: 'ev-1',
      startsAt: new Date(),
      endsAt: new Date(),
    } as never);
    await repository.findClassSessionForEvent('s1', 'ev-1');
    await repository.updateClassSession('s1', { capacity: 10 });
    await repository.deleteClassSession('s1');
    await repository.createPendingFixedEventEnrollment({
      eventId: 'ev-1',
      amount: 25,
      currency: 'usd',
    } as never);
    expect(prisma.upcomingClassSession.delete).toHaveBeenCalledWith({
      where: { id: 's1' },
    });
  });

  it('finalizeFixedEnrollmentPayment happy path', async () => {
    const enrollment = {
      id: 'fx-1',
      eventId: 'ev-1',
      ticketNumber: null as number | null,
      event: { eventType: { name: 'Gala' } },
    };
    prisma.$transaction.mockImplementation(
      async (fn: (tx: unknown) => unknown) => {
        const tx = {
          upcomingFixedEventEnrollment: {
            findUnique: jest.fn().mockResolvedValue({
              ...enrollment,
              status: UpcomingClassEnrollmentStatus.PENDING_PAYMENT,
            }),
            updateMany: jest.fn().mockResolvedValue({ count: 1 }),
            aggregate: jest
              .fn()
              .mockResolvedValue({ _max: { ticketNumber: 0 } }),
            update: jest.fn(),
            count: jest.fn().mockResolvedValue(0),
          },
        };
        return fn(tx);
      },
    );
    await expect(
      repository.finalizeFixedEnrollmentPayment(enrollment, {
        paymentIntentId: 'pi_1',
        paymentMethodType: 'card',
        paymentMethodBrand: 'visa',
        paymentMethodLast4: '4242',
        fixedTicketCapacity: 50,
      }),
    ).resolves.toEqual(expect.objectContaining({ ticketNumber: 1 }));
  });

  it('finalizeFixedEnrollmentPayment returns null when missing or not pending', async () => {
    const enrollment = {
      id: 'fx-1',
      eventId: 'ev-1',
      ticketNumber: null as number | null,
      event: { eventType: { name: 'Gala' } },
    };
    prisma.$transaction.mockImplementation(
      async (fn: (tx: unknown) => unknown) => {
        const tx = {
          upcomingFixedEventEnrollment: {
            findUnique: jest.fn().mockResolvedValue(null),
          },
        };
        return fn(tx);
      },
    );
    await expect(
      repository.finalizeFixedEnrollmentPayment(enrollment, {
        paymentIntentId: null,
        paymentMethodType: null,
        paymentMethodBrand: null,
        paymentMethodLast4: null,
        fixedTicketCapacity: null,
      }),
    ).resolves.toBeNull();

    prisma.$transaction.mockImplementation(
      async (fn: (tx: unknown) => unknown) => {
        const tx = {
          upcomingFixedEventEnrollment: {
            findUnique: jest.fn().mockResolvedValue({
              status: UpcomingClassEnrollmentStatus.EXPIRED,
              ticketNumber: null,
            }),
          },
        };
        return fn(tx);
      },
    );
    await expect(
      repository.finalizeFixedEnrollmentPayment(enrollment, {
        paymentIntentId: null,
        paymentMethodType: null,
        paymentMethodBrand: null,
        paymentMethodLast4: null,
        fixedTicketCapacity: null,
      }),
    ).resolves.toBeNull();
  });

  it('finalizeFixedEnrollmentPayment returns existing ticket when already PAID', async () => {
    const enrollment = {
      id: 'fx-1',
      eventId: 'ev-1',
      ticketNumber: null as number | null,
      event: { eventType: { name: 'Gala' } },
    };
    prisma.$transaction.mockImplementation(
      async (fn: (tx: unknown) => unknown) => {
        const tx = {
          upcomingFixedEventEnrollment: {
            findUnique: jest.fn().mockResolvedValue({
              status: UpcomingClassEnrollmentStatus.PAID,
              ticketNumber: 9,
            }),
          },
        };
        return fn(tx);
      },
    );
    await expect(
      repository.finalizeFixedEnrollmentPayment(enrollment, {
        paymentIntentId: null,
        paymentMethodType: null,
        paymentMethodBrand: null,
        paymentMethodLast4: null,
        fixedTicketCapacity: null,
      }),
    ).resolves.toEqual(expect.objectContaining({ ticketNumber: 9 }));
  });

  it('findAdminUpcomingEventOrThrow returns event when present', async () => {
    prisma.event.findFirst.mockResolvedValue({
      id: 'ev-1',
      eventType: { name: 'Salsa' },
    });
    await expect(
      repository.findAdminUpcomingEventOrThrow('ev-1'),
    ).resolves.toEqual(expect.objectContaining({ id: 'ev-1' }));
  });

  it('seatsRemaining floors at zero when overbooked', async () => {
    prisma.upcomingClassEnrollment.count.mockResolvedValue(20);
    await expect(repository.seatsRemaining('s1', 10)).resolves.toBe(0);
  });
});
