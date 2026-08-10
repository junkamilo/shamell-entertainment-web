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
      expect(stripe.client.checkout.sessions.update).toHaveBeenCalled();
      const updateArgs = stripe.client.checkout.sessions.update.mock
        .calls[0] as [string, { metadata?: { flow?: string } }];
      expect(updateArgs[0]).toBe('cs_1');
      expect(updateArgs[1]?.metadata?.flow).toBe('class_session');
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
      const startsAt = new Date('2026-08-15T15:00:00.000Z');
      const endsAt = new Date('2026-08-15T16:00:00.000Z');
      return [
        makeCheckoutClassSessionStub({
          id: 'session-1',
          startsAt,
          endsAt,
          price: 40,
        }),
        makeCheckoutClassSessionStub({
          id: 'session-2',
          startsAt: new Date('2026-08-15T17:00:00.000Z'),
          endsAt: new Date('2026-08-15T18:00:00.000Z'),
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
      repository.findPublicUpcomingBySlug.mockResolvedValue(
        makeClassesPublicEventStub(),
      );
      repository.findActiveClassSessionsByIdsForEvent.mockResolvedValue([
        makeCheckoutClassSessionStub({
          id: 'session-1',
          startsAt: new Date('2026-08-15T15:00:00.000Z'),
          endsAt: new Date('2026-08-15T16:00:00.000Z'),
        }),
        makeCheckoutClassSessionStub({
          id: 'session-2',
          startsAt: new Date('2026-08-16T15:00:00.000Z'),
          endsAt: new Date('2026-08-16T16:00:00.000Z'),
        }),
      ]);
      await expect(
        service.createClassBundleCheckout('salsa-night', bundleDto),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects invalid bundle total', async () => {
      repository.findPublicUpcomingBySlug.mockResolvedValue(
        makeClassesPublicEventStub(),
      );
      repository.findActiveClassSessionsByIdsForEvent.mockResolvedValue([
        makeCheckoutClassSessionStub({
          id: 'session-1',
          price: 0.1,
          startsAt: new Date('2026-08-15T15:00:00.000Z'),
          endsAt: new Date('2026-08-15T16:00:00.000Z'),
        }),
        makeCheckoutClassSessionStub({
          id: 'session-2',
          price: 0.1,
          startsAt: new Date('2026-08-15T17:00:00.000Z'),
          endsAt: new Date('2026-08-15T18:00:00.000Z'),
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
      repository.createPendingFixedEventEnrollment.mockResolvedValue({
        id: 'fixed-enroll-1',
      });

      await expect(
        service.createFixedEventCheckout('gala-night', fixedDto),
      ).resolves.toEqual({
        clientSecret: 'sec_1',
        enrollmentId: 'fixed-enroll-1',
      });
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
      jest
        .spyOn(fixedTicketUtil, 'fixedTicketsRemaining')
        .mockResolvedValueOnce(10)
        .mockResolvedValueOnce(0);
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
  });
});
