import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ThrottlerGuard } from '@nestjs/throttler';
import type { AdminJwtPayload } from '../../auth/decorators/current-admin.decorator';
import { AdminJwtGuard } from '../../../common/auth/guards/admin-jwt.guard';
import { createAdminClassEnrollmentServiceMock } from '../__mocks__/admin-class-enrollment.service.mock';
import { createAdminFixedEventEnrollmentServiceMock } from '../__mocks__/admin-fixed-event-enrollment.service.mock';
import { makePublicEventStub } from '../__mocks__/upcoming-events.fixtures';
import { createUpcomingEventsServiceMock } from '../__mocks__/upcoming-events.service.mock';
import { AdminClassEnrollmentService } from '../services/admin-class-enrollment.service';
import { AdminFixedEventEnrollmentService } from '../services/admin-fixed-event-enrollment.service';
import { UpcomingEventsService } from '../services/upcoming-events.service';
import { UpcomingEventsController } from './upcoming-events.controller';

const EVENT_ID = '11111111-1111-4111-8111-111111111111';
const SESSION_ID = '22222222-2222-4222-8222-222222222222';
const admin: AdminJwtPayload = {
  id: 'admin-1',
  email: 'admin@example.com',
  role: 'ADMIN',
};

describe('UpcomingEventsController', () => {
  let controller: UpcomingEventsController;
  const upcoming = createUpcomingEventsServiceMock();
  const adminClass = createAdminClassEnrollmentServiceMock();
  const adminFixed = createAdminFixedEventEnrollmentServiceMock();

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      controllers: [UpcomingEventsController],
      providers: [
        { provide: UpcomingEventsService, useValue: upcoming },
        { provide: AdminClassEnrollmentService, useValue: adminClass },
        { provide: AdminFixedEventEnrollmentService, useValue: adminFixed },
      ],
    })
      .overrideGuard(AdminJwtGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(ThrottlerGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = moduleRef.get(UpcomingEventsController);
  });

  describe('query validation branches', () => {
    it('rejects missing session_id / token on status and reconcile routes', () => {
      expect(() => controller.getClassSessionStatus('')).toThrow(
        BadRequestException,
      );
      expect(() => controller.reconcileClassEnrollment('  ')).toThrow(
        BadRequestException,
      );
      expect(() => controller.resolveClassPayCheckout('')).toThrow(
        BadRequestException,
      );
      expect(() => controller.reconcileFixedTicketAdmin('')).toThrow(
        BadRequestException,
      );
      expect(() => controller.reconcileFixedTicket('')).toThrow(
        BadRequestException,
      );
      expect(() => controller.getFixedEventSessionStatus('')).toThrow(
        BadRequestException,
      );
    });
  });

  describe('public + payment status delegation', () => {
    it('getPublicBySlug / sessions / venue / class-options', async () => {
      const payload = makePublicEventStub();
      upcoming.getPublicBySlug.mockResolvedValue(payload);
      upcoming.listPublicSessions.mockResolvedValue([]);
      upcoming.getPublicVenueBundle.mockResolvedValue({ published: true });
      upcoming.getPublicClassOptions.mockResolvedValue({ mode: 'classes' });

      await expect(controller.getPublicBySlug('salsa-night')).resolves.toEqual(
        payload,
      );
      await expect(
        controller.listPublicSessions('salsa-night'),
      ).resolves.toEqual([]);
      await expect(controller.getPublicVenue('salsa-night')).resolves.toEqual({
        published: true,
      });
      await expect(
        controller.getPublicClassOptions('salsa-night'),
      ).resolves.toEqual({ mode: 'classes' });
    });

    it('class/fixed session-status and reconcile', async () => {
      upcoming.getClassSessionStatus.mockResolvedValue({
        stripeStatus: 'open',
        enrollment: { status: 'PENDING_PAYMENT' },
      });
      upcoming.reconcileClassFromStripeSession.mockResolvedValue({
        stripeStatus: 'complete',
      });
      upcoming.getFixedEventSessionStatus.mockResolvedValue({
        stripeStatus: 'open',
        enrollment: {
          status: 'PENDING_PAYMENT',
          customerEmail: null,
          eventName: 'Gala',
          eventSlug: 'gala',
        },
      });
      upcoming.reconcileFixedTicketFromStripeSession.mockResolvedValue({
        stripeStatus: 'complete',
      });

      await expect(controller.getClassSessionStatus('cs_1')).resolves.toEqual({
        stripeStatus: 'open',
        enrollment: { status: 'PENDING_PAYMENT' },
      });
      await expect(
        controller.reconcileClassEnrollment('cs_1'),
      ).resolves.toEqual({ stripeStatus: 'complete' });
      await expect(
        controller.getFixedEventSessionStatus('cs_fixed'),
      ).resolves.toMatchObject({ stripeStatus: 'open' });
      await expect(
        controller.reconcileFixedTicket('cs_fixed'),
      ).resolves.toEqual({ stripeStatus: 'complete' });
      await expect(
        controller.reconcileFixedTicketAdmin('cs_fixed'),
      ).resolves.toEqual({ stripeStatus: 'complete' });
    });

    it('resolveClassPayCheckout wraps clientSecret', async () => {
      adminClass.resolveClassPayCheckoutClientSecret.mockResolvedValue(
        'sec_class',
      );
      await expect(
        controller.resolveClassPayCheckout('token-1'),
      ).resolves.toEqual({ clientSecret: 'sec_class' });
    });

    it('checkout create handlers delegate', async () => {
      upcoming.createClassCheckout.mockResolvedValue({
        clientSecret: 'a',
        enrollmentId: 'e1',
      });
      upcoming.createClassPackageCheckout.mockResolvedValue({
        clientSecret: 'b',
        enrollmentId: 'e2',
      });
      upcoming.createClassBundleCheckout.mockResolvedValue({
        clientSecret: 'c',
        enrollmentId: 'e3',
      });
      upcoming.createFixedEventCheckout.mockResolvedValue({
        clientSecret: 'd',
        enrollmentId: 'e4',
      });

      await expect(
        controller.createClassCheckout('slug', {
          sessionId: SESSION_ID,
          customerName: 'A',
          customerEmail: 'a@b.com',
        }),
      ).resolves.toMatchObject({ enrollmentId: 'e1' });
      await expect(
        controller.createClassPackageCheckout('slug', {
          monthIso: '2026-08',
          customerName: 'A',
          customerEmail: 'a@b.com',
        }),
      ).resolves.toMatchObject({ enrollmentId: 'e2' });
      await expect(
        controller.createClassBundleCheckout('slug', {
          sessionIds: [SESSION_ID],
          customerName: 'A',
          customerEmail: 'a@b.com',
        }),
      ).resolves.toMatchObject({ enrollmentId: 'e3' });
      await expect(
        controller.createFixedEventCheckout('slug', {
          customerName: 'A',
          customerEmail: 'a@b.com',
        }),
      ).resolves.toMatchObject({ enrollmentId: 'e4' });
    });
  });

  describe('admin sessions + venue-config', () => {
    it('list/create/update/delete sessions and venue-config', async () => {
      upcoming.listAdminSessions.mockResolvedValue([]);
      upcoming.createAdminSession.mockResolvedValue({ id: SESSION_ID });
      upcoming.updateAdminSession.mockResolvedValue({ id: SESSION_ID });
      upcoming.deleteAdminSession.mockResolvedValue({
        message: 'Session deleted.',
      });
      upcoming.getAdminVenueConfig.mockResolvedValue({ eventId: EVENT_ID });
      upcoming.upsertAdminVenueConfig.mockResolvedValue({
        eventId: EVENT_ID,
        clientEnabled: true,
      });
      upcoming.regenerateAdminClassSessions.mockResolvedValue({
        created: 1,
        skipped: 0,
      });

      await expect(controller.listAdminSessions(EVENT_ID)).resolves.toEqual([]);
      await expect(
        controller.createAdminSession(EVENT_ID, {
          startsAt: '2026-08-15T18:00:00.000Z',
          endsAt: '2026-08-15T19:00:00.000Z',
          capacity: 10,
          price: 50,
        }),
      ).resolves.toEqual({ id: SESSION_ID });
      await expect(
        controller.updateAdminSession(EVENT_ID, SESSION_ID, {
          capacity: 12,
        }),
      ).resolves.toEqual({ id: SESSION_ID });
      await expect(
        controller.deleteAdminSession(EVENT_ID, SESSION_ID),
      ).resolves.toEqual({ message: 'Session deleted.' });
      await expect(controller.getAdminVenueConfig(EVENT_ID)).resolves.toEqual({
        eventId: EVENT_ID,
      });
      await expect(
        controller.upsertAdminVenueConfig(EVENT_ID, { clientEnabled: true }),
      ).resolves.toMatchObject({ clientEnabled: true });
      await expect(
        controller.regenerateAdminClassSessions(EVENT_ID),
      ).resolves.toEqual({ created: 1, skipped: 0 });
    });
  });

  describe('admin class + fixed enrollment', () => {
    it('delegates bookable list, context, cash, checkout, box-office', async () => {
      adminClass.listAdminBookableClassEvents.mockResolvedValue({ events: [] });
      adminClass.getAdminClassBookingContext.mockResolvedValue({
        event: { id: EVENT_ID },
      });
      adminClass.createAdminClassCashEnrollment.mockResolvedValue({
        enrollmentId: 'e-cash',
      });
      adminClass.createAdminClassCheckoutSession.mockResolvedValue({
        enrollmentId: 'e-chk',
        payUrl: 'https://pay',
      });
      adminFixed.listBoxOfficeFixedEvents.mockResolvedValue({ events: [] });
      adminFixed.createAdminCash.mockResolvedValue({
        enrollmentId: 'f-cash',
      });
      adminFixed.createAdminCheckoutSession.mockResolvedValue({
        enrollmentId: 'f-chk',
        payUrl: 'https://pay',
      });

      await expect(controller.listAdminBookableClassEvents()).resolves.toEqual({
        events: [],
      });
      await expect(
        controller.getAdminClassBookingContext(EVENT_ID),
      ).resolves.toMatchObject({ event: { id: EVENT_ID } });
      await expect(
        controller.createAdminClassCashEnrollment(admin, {
          upcomingEventId: EVENT_ID,
          purchaseKind: 'session',
          sessionId: SESSION_ID,
          customerName: 'A',
          customerEmail: 'a@b.com',
        }),
      ).resolves.toEqual({ enrollmentId: 'e-cash' });
      await expect(
        controller.createAdminClassCheckoutSession(admin, {
          upcomingEventId: EVENT_ID,
          purchaseKind: 'session',
          sessionId: SESSION_ID,
          customerName: 'A',
          customerEmail: 'a@b.com',
        }),
      ).resolves.toMatchObject({ payUrl: 'https://pay' });
      await expect(controller.listBoxOfficeFixedEvents()).resolves.toEqual({
        events: [],
      });
      await expect(
        controller.createAdminFixedEventCash(admin, {
          upcomingEventId: EVENT_ID,
          customerName: 'A',
          customerEmail: 'a@b.com',
          boxOfficeDetails: { channel: 'walk-in' },
        }),
      ).resolves.toEqual({ enrollmentId: 'f-cash' });
      await expect(
        controller.createAdminFixedEventCheckoutSession(admin, {
          upcomingEventId: EVENT_ID,
          customerName: 'A',
          customerEmail: 'a@b.com',
          boxOfficeDetails: { channel: 'walk-in' },
        }),
      ).resolves.toMatchObject({ payUrl: 'https://pay' });
    });
  });

  it('propagates service errors', async () => {
    upcoming.getPublicBySlug.mockRejectedValue(
      new NotFoundException('Event not found.'),
    );
    upcoming.createClassCheckout.mockRejectedValue(
      new BadRequestException('Session is full.'),
    );
    await expect(
      controller.getPublicBySlug('missing-slug'),
    ).rejects.toBeInstanceOf(NotFoundException);
    await expect(
      controller.createClassCheckout('salsa-night', {
        sessionId: SESSION_ID,
        customerName: 'A',
        customerEmail: 'a@b.com',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
