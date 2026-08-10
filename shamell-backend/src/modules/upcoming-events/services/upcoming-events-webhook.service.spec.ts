import {
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { UpcomingClassEnrollmentStatus } from '@prisma/client';
import {
  makeClassEnrollmentWebhookInclude,
  makeClassPackageWebhookInclude,
  makeFixedEnrollmentWebhookInclude,
  makeStripeCheckoutSessionLite,
  makeVenueConfigStub,
} from '../__mocks__/upcoming-events.fixtures';
import {
  createUpcomingEventsWebhookServiceTestModule,
  type UpcomingEventsWebhookServiceTestHarness,
} from '../testing/upcoming-events-webhook-service.test-module';
describe('UpcomingEventsWebhookService (money matrix)', () => {
  let harness: UpcomingEventsWebhookServiceTestHarness;
  let service: UpcomingEventsWebhookServiceTestHarness['service'];
  let repository: UpcomingEventsWebhookServiceTestHarness['repository'];
  beforeEach(async () => {
    jest.clearAllMocks();
    harness = await createUpcomingEventsWebhookServiceTestModule();
    service = harness.service;
    repository = harness.repository;
  });
  function classCompletedEvent(sessionOverrides: Record<string, unknown> = {}) {
    return {
      id: 'evt_class_1',
      type: 'checkout.session.completed' as const,
      livemode: false,
      data: {
        object: makeStripeCheckoutSessionLite({
          id: 'cs_class_1',
          amount_total: 5000,
          metadata: { flow: 'class_session' },
          ...sessionOverrides,
        }),
      },
    };
  }
  function packageCompletedEvent(
    sessionOverrides: Record<string, unknown> = {},
  ) {
    return {
      id: 'evt_pkg_1',
      type: 'checkout.session.completed' as const,
      livemode: false,
      data: {
        object: makeStripeCheckoutSessionLite({
          id: 'cs_pkg_1',
          amount_total: 10_000,
          metadata: { flow: 'class_session_bundle' },
          ...sessionOverrides,
        }),
      },
    };
  }
  function fixedCompletedEvent(sessionOverrides: Record<string, unknown> = {}) {
    return {
      id: 'evt_fixed_1',
      type: 'checkout.session.completed' as const,
      livemode: false,
      data: {
        object: makeStripeCheckoutSessionLite({
          id: 'cs_fixed_1',
          amount_total: 2500,
          metadata: { flow: 'fixed_event_ticket' },
          ...sessionOverrides,
        }),
      },
    };
  }
  function mockFixedPaidFinalize(enrollment: {
    id: string;
    eventId: string;
    ticketNumber: number | null;
    event: { eventType: { name: string } };
  }) {
    repository.finalizeFixedEnrollmentPayment.mockResolvedValue({
      ...enrollment,
      ticketNumber: enrollment.ticketNumber ?? 1,
    });
    harness.stripe.client.paymentIntents.retrieve.mockResolvedValue({
      payment_method: {
        type: 'card',
        card: { brand: 'visa', last4: '4242' },
      },
    });
  }
  describe('processClassStripeWebhookEvent', () => {
    it('ignores non class_session flow', async () => {
      await expect(
        service.processClassStripeWebhookEvent({
          id: 'evt_1',
          type: 'checkout.session.completed',
          livemode: false,
          data: {
            object: { metadata: { flow: 'booking_quote' } },
          },
        }),
      ).resolves.toEqual({ handled: false });
    });
    it('marks PENDING enrollment as PAID and sends mail + admin notify', async () => {
      const enrollment = makeClassEnrollmentWebhookInclude();
      repository.findClassEnrollmentForCheckoutSession.mockResolvedValue(
        enrollment,
      );
      repository.markClassEnrollmentPaid.mockResolvedValue({
        ...enrollment,
        status: UpcomingClassEnrollmentStatus.PAID,
      });
      await expect(
        service.processClassStripeWebhookEvent(classCompletedEvent()),
      ).resolves.toEqual({ handled: true });
      expect(repository.markClassEnrollmentPaid).toHaveBeenCalled();
      const markPaidArgs = repository.markClassEnrollmentPaid.mock.calls[0] as [
        string,
        { paymentIntentId?: string },
      ];
      expect(markPaidArgs[0]).toBe(enrollment.id);
      expect(typeof markPaidArgs[1]?.paymentIntentId).toBe('string');
      expect(harness.mail.sendTransactional).toHaveBeenCalled();
      expect(
        harness.adminPaymentNotify.notifyPaymentOutcome,
      ).toHaveBeenCalledWith(
        expect.objectContaining({ outcome: 'PAID', flow: 'CLASS_SESSION' }),
      );
    });
    it('is idempotent when enrollment already PAID', async () => {
      repository.findClassEnrollmentForCheckoutSession.mockResolvedValue(
        makeClassEnrollmentWebhookInclude({
          status: UpcomingClassEnrollmentStatus.PAID,
        }),
      );
      await expect(
        service.processClassStripeWebhookEvent(classCompletedEvent()),
      ).resolves.toEqual({ handled: true });
      expect(repository.markClassEnrollmentPaid).not.toHaveBeenCalled();
      expect(harness.mail.sendTransactional).not.toHaveBeenCalled();
    });
    it('throws BadRequestException when payment_status is unpaid', async () => {
      repository.findClassEnrollmentForCheckoutSession.mockResolvedValue(
        makeClassEnrollmentWebhookInclude(),
      );
      await expect(
        service.processClassStripeWebhookEvent(
          classCompletedEvent({ payment_status: 'unpaid' }),
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
    it('throws NotFoundException when enrollment is missing', async () => {
      repository.findClassEnrollmentForCheckoutSession.mockResolvedValue(null);
      await expect(
        service.processClassStripeWebhookEvent(classCompletedEvent()),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
    it('throws BadRequestException on amount mismatch', async () => {
      repository.findClassEnrollmentForCheckoutSession.mockResolvedValue(
        makeClassEnrollmentWebhookInclude({ amount: 50 }),
      );
      await expect(
        service.processClassStripeWebhookEvent(
          classCompletedEvent({ amount_total: 999 }),
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
    it('marks PENDING as EXPIRED and notifies on checkout.session.expired', async () => {
      const enrollment = makeClassEnrollmentWebhookInclude();
      repository.findClassEnrollmentForExpire.mockResolvedValue(enrollment);
      repository.markClassEnrollmentExpired.mockResolvedValue({
        ...enrollment,
        status: UpcomingClassEnrollmentStatus.EXPIRED,
      });
      await expect(
        service.processClassStripeWebhookEvent({
          id: 'evt_exp',
          type: 'checkout.session.expired',
          livemode: false,
          data: {
            object: {
              id: 'cs_class_1',
              metadata: { flow: 'class_session' },
            },
          },
        }),
      ).resolves.toEqual({ handled: true });
      expect(repository.markClassEnrollmentExpired).toHaveBeenCalledWith(
        enrollment.id,
      );
      expect(
        harness.adminPaymentNotify.notifyPaymentOutcome,
      ).toHaveBeenCalledWith(
        expect.objectContaining({ outcome: 'EXPIRED', flow: 'CLASS_SESSION' }),
      );
    });
    it('keeps PAID when confirmation mail returns ok: false', async () => {
      const enrollment = makeClassEnrollmentWebhookInclude();
      repository.findClassEnrollmentForCheckoutSession.mockResolvedValue(
        enrollment,
      );
      repository.markClassEnrollmentPaid.mockResolvedValue({
        ...enrollment,
        status: UpcomingClassEnrollmentStatus.PAID,
      });
      harness.mail.sendTransactional.mockResolvedValue({
        ok: false,
        errorText: 'smtp down',
      });
      await expect(
        service.processClassStripeWebhookEvent(classCompletedEvent()),
      ).resolves.toEqual({ handled: true });
      expect(repository.markClassEnrollmentPaid).toHaveBeenCalled();
      expect(repository.stampClassEnrollmentEmailSent).not.toHaveBeenCalled();
      expect(
        harness.adminPaymentNotify.notifyPaymentOutcome,
      ).toHaveBeenCalledWith(
        expect.objectContaining({ outcome: 'PAID', flow: 'CLASS_SESSION' }),
      );
    });
  });
  describe('processClassPackageStripeWebhookEvent', () => {
    it('ignores unrelated flow', async () => {
      await expect(
        service.processClassPackageStripeWebhookEvent({
          id: 'evt_1',
          type: 'checkout.session.completed',
          livemode: false,
          data: {
            object: { metadata: { flow: 'class_session' } },
          },
        }),
      ).resolves.toEqual({ handled: false });
    });
    it('marks multi-item package PAID and sends bundle confirmation', async () => {
      const pkg = makeClassPackageWebhookInclude({ itemCount: 2 });
      repository.findPackageEnrollmentForCheckoutSession.mockResolvedValue(pkg);
      repository.findPackageEnrollmentById.mockResolvedValue({
        ...pkg,
        status: UpcomingClassEnrollmentStatus.PAID,
      });
      await expect(
        service.processClassPackageStripeWebhookEvent(packageCompletedEvent()),
      ).resolves.toEqual({ handled: true });
      expect(repository.markPackageEnrollmentPaid).toHaveBeenCalledWith(pkg.id);
      expect(repository.markPackageChildEnrollmentPaid).toHaveBeenCalled();
      expect(harness.mail.sendTransactional).toHaveBeenCalled();
      expect(
        harness.adminPaymentNotify.notifyPaymentOutcome,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          outcome: 'PAID',
          flow: 'CLASS_DAY_BUNDLE',
        }),
      );
    });
    it('sends class confirmation for single-item package', async () => {
      const pkg = makeClassPackageWebhookInclude({
        itemCount: 1,
        overrides: { amount: 50 },
      });
      repository.findPackageEnrollmentForCheckoutSession.mockResolvedValue(pkg);
      repository.findPackageEnrollmentById.mockResolvedValue({
        ...pkg,
        status: UpcomingClassEnrollmentStatus.PAID,
      });
      await expect(
        service.processClassPackageStripeWebhookEvent(
          packageCompletedEvent({ amount_total: 5000 }),
        ),
      ).resolves.toEqual({ handled: true });
      expect(harness.mail.sendTransactional).toHaveBeenCalled();
      const mailArgs = harness.mail.sendTransactional.mock.calls[0] as [
        { subject: string },
      ];
      expect(mailArgs[0].subject).toMatch(/confirm|Salsa/i);
    });
    it('is idempotent when package already PAID', async () => {
      repository.findPackageEnrollmentForCheckoutSession.mockResolvedValue(
        makeClassPackageWebhookInclude({
          overrides: { status: UpcomingClassEnrollmentStatus.PAID },
        }),
      );
      await expect(
        service.processClassPackageStripeWebhookEvent(packageCompletedEvent()),
      ).resolves.toEqual({ handled: true });
      expect(repository.markPackageEnrollmentPaid).not.toHaveBeenCalled();
    });
    it('throws BadRequestException when unpaid', async () => {
      repository.findPackageEnrollmentForCheckoutSession.mockResolvedValue(
        makeClassPackageWebhookInclude(),
      );
      await expect(
        service.processClassPackageStripeWebhookEvent(
          packageCompletedEvent({ payment_status: 'unpaid' }),
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
    it('throws NotFoundException when package missing', async () => {
      repository.findPackageEnrollmentForCheckoutSession.mockResolvedValue(
        null,
      );
      await expect(
        service.processClassPackageStripeWebhookEvent(packageCompletedEvent()),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
    it('throws BadRequestException on amount mismatch', async () => {
      repository.findPackageEnrollmentForCheckoutSession.mockResolvedValue(
        makeClassPackageWebhookInclude({ itemCount: 2 }),
      );
      await expect(
        service.processClassPackageStripeWebhookEvent(
          packageCompletedEvent({ amount_total: 100 }),
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
    it('expires PENDING package and child enrollments', async () => {
      const pkg = makeClassPackageWebhookInclude({ itemCount: 2 });
      repository.findPackageEnrollmentForExpire.mockResolvedValue(pkg);
      await expect(
        service.processClassPackageStripeWebhookEvent({
          id: 'evt_pkg_exp',
          type: 'checkout.session.expired',
          livemode: false,
          data: {
            object: {
              id: 'cs_pkg_1',
              metadata: { flow: 'class_month_package' },
            },
          },
        }),
      ).resolves.toEqual({ handled: true });
      expect(repository.markPackageEnrollmentExpired).toHaveBeenCalledWith(
        pkg.id,
        pkg.items.map((item) => item.enrollmentId),
      );
    });
    it('keeps PAID when bundle mail returns ok: false', async () => {
      const pkg = makeClassPackageWebhookInclude({ itemCount: 2 });
      repository.findPackageEnrollmentForCheckoutSession.mockResolvedValue(pkg);
      repository.findPackageEnrollmentById.mockResolvedValue({
        ...pkg,
        status: UpcomingClassEnrollmentStatus.PAID,
      });
      harness.mail.sendTransactional.mockResolvedValue({
        ok: false,
        errorText: 'mail fail',
      });
      await expect(
        service.processClassPackageStripeWebhookEvent(packageCompletedEvent()),
      ).resolves.toEqual({ handled: true });
      expect(repository.stampPackageEnrollmentEmailSent).not.toHaveBeenCalled();
      expect(
        harness.adminPaymentNotify.notifyPaymentOutcome,
      ).toHaveBeenCalledWith(expect.objectContaining({ outcome: 'PAID' }));
    });
  });
  describe('processFixedStripeWebhookEvent', () => {
    it('ignores non fixed_event_ticket flow', async () => {
      await expect(
        service.processFixedStripeWebhookEvent({
          id: 'evt_1',
          type: 'checkout.session.completed',
          livemode: false,
          data: {
            object: { metadata: { flow: 'class_session' } },
          },
        }),
      ).resolves.toEqual({ handled: false });
    });
    it('marks fixed enrollment PAID with ticket and notifications', async () => {
      const enrollment = makeFixedEnrollmentWebhookInclude();
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
      mockFixedPaidFinalize(enrollment);
      await expect(
        service.processFixedStripeWebhookEvent(fixedCompletedEvent()),
      ).resolves.toEqual({ handled: true });
      expect(harness.mail.sendTransactional).toHaveBeenCalled();
      expect(
        harness.adminPaymentNotify.notifyPaymentOutcome,
      ).toHaveBeenCalledWith(
        expect.objectContaining({ outcome: 'PAID', flow: 'FIXED_TICKET' }),
      );
    });
    it('idempotent already PAID only re-runs post-payment notifications', async () => {
      const paid = makeFixedEnrollmentWebhookInclude({
        status: UpcomingClassEnrollmentStatus.PAID,
        ticketNumber: 7,
        customerEmailSentAt: new Date(),
        adminNotifySentAt: new Date(),
      });
      repository.findFixedEnrollmentForCheckoutSession.mockResolvedValue(paid);
      repository.findFixedEnrollmentById.mockResolvedValue(paid);
      repository.findVenueConfigByEventId.mockResolvedValue(
        makeVenueConfigStub({ eventId: paid.eventId }),
      );
      await expect(
        service.processFixedStripeWebhookEvent(fixedCompletedEvent()),
      ).resolves.toEqual({ handled: true });
      expect(repository.finalizeFixedEnrollmentPayment).not.toHaveBeenCalled();
    });
    it('throws BadRequestException when unpaid', async () => {
      repository.findFixedEnrollmentForCheckoutSession.mockResolvedValue(
        makeFixedEnrollmentWebhookInclude(),
      );
      await expect(
        service.processFixedStripeWebhookEvent(
          fixedCompletedEvent({ payment_status: 'unpaid' }),
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
    it('throws NotFoundException when enrollment missing', async () => {
      repository.findFixedEnrollmentForCheckoutSession.mockResolvedValue(null);
      await expect(
        service.processFixedStripeWebhookEvent(fixedCompletedEvent()),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
    it('throws BadRequestException on amount mismatch', async () => {
      repository.findFixedEnrollmentForCheckoutSession.mockResolvedValue(
        makeFixedEnrollmentWebhookInclude({ amount: 25 }),
      );
      await expect(
        service.processFixedStripeWebhookEvent(
          fixedCompletedEvent({ amount_total: 100 }),
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
    it('expires PENDING fixed enrollment', async () => {
      const enrollment = makeFixedEnrollmentWebhookInclude();
      repository.findFixedEnrollmentForCheckoutSession.mockResolvedValue(
        enrollment,
      );
      await expect(
        service.processFixedStripeWebhookEvent({
          id: 'evt_fixed_exp',
          type: 'checkout.session.expired',
          livemode: false,
          data: {
            object: {
              id: 'cs_fixed_1',
              metadata: { flow: 'fixed_event_ticket' },
            },
          },
        }),
      ).resolves.toEqual({ handled: true });
      expect(repository.markFixedEnrollmentExpired).toHaveBeenCalledWith(
        enrollment.id,
      );
      expect(
        harness.adminPaymentNotify.notifyPaymentOutcome,
      ).toHaveBeenCalledWith(
        expect.objectContaining({ outcome: 'EXPIRED', flow: 'FIXED_TICKET' }),
      );
    });
    it('recovers sold-out-after-pay ConflictException then throws 500', async () => {
      const errorSpy = jest
        .spyOn(Logger.prototype, 'error')
        .mockImplementation(() => undefined);
      const enrollment = makeFixedEnrollmentWebhookInclude();
      repository.findFixedEnrollmentForCheckoutSession.mockResolvedValue(
        enrollment,
      );
      repository.findVenueConfigByEventId.mockResolvedValue(
        makeVenueConfigStub({
          eventId: enrollment.eventId,
          fixedTicketCapacity: 1,
        }),
      );
      harness.stripe.client.paymentIntents.retrieve.mockResolvedValue({
        payment_method: null,
      });
      repository.finalizeFixedEnrollmentPayment.mockRejectedValue(
        new ConflictException('Tickets sold out.'),
      );
      repository.markFixedEnrollmentPaidWithoutTicket.mockResolvedValue({
        count: 1,
      });
      await expect(
        service.processFixedStripeWebhookEvent(fixedCompletedEvent()),
      ).rejects.toBeInstanceOf(InternalServerErrorException);
      expect(
        repository.markFixedEnrollmentPaidWithoutTicket,
      ).toHaveBeenCalled();
      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('fixed-ticket-sold-out-after-payment'),
      );
      const notifyCalls = harness.adminPaymentNotify.notifyPaymentOutcome.mock
        .calls as Array<
        [{ outcome: string; flow: string; contextLabel: string }]
      >;
      expect(notifyCalls[0][0].outcome).toBe('PAID');
      expect(notifyCalls[0][0].flow).toBe('FIXED_TICKET');
      expect(notifyCalls[0][0].contextLabel).toMatch(/sold out/i);
      errorSpy.mockRestore();
    });
    it('keeps PAID when fixed ticket mail returns ok: false', async () => {
      const enrollment = makeFixedEnrollmentWebhookInclude();
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
      mockFixedPaidFinalize(enrollment);
      harness.mail.sendTransactional.mockResolvedValue({
        ok: false,
        errorText: 'smtp',
      });
      await expect(
        service.processFixedStripeWebhookEvent(fixedCompletedEvent()),
      ).resolves.toEqual({ handled: true });
      expect(repository.stampFixedEnrollmentEmailSent).not.toHaveBeenCalled();
    });
  });
  describe('reconcile / status', () => {
    it('markEnrollmentExpired no-ops when enrollment missing', async () => {
      repository.findClassEnrollmentForExpire.mockResolvedValue(null);
      await expect(
        service.processClassStripeWebhookEvent({
          id: 'evt_exp_miss',
          type: 'checkout.session.expired',
          livemode: false,
          data: {
            object: {
              id: 'cs_miss',
              metadata: { flow: 'class_session' },
            },
          },
        }),
      ).resolves.toEqual({ handled: true });
      expect(repository.markClassEnrollmentExpired).not.toHaveBeenCalled();
    });
    it('markEnrollmentExpired no-ops when not PENDING', async () => {
      repository.findClassEnrollmentForExpire.mockResolvedValue(
        makeClassEnrollmentWebhookInclude({
          status: UpcomingClassEnrollmentStatus.PAID,
        }),
      );
      await expect(
        service.processClassStripeWebhookEvent({
          id: 'evt_exp_paid',
          type: 'checkout.session.expired',
          livemode: false,
          data: {
            object: {
              id: 'cs_paid',
              metadata: { flow: 'class_session' },
            },
          },
        }),
      ).resolves.toEqual({ handled: true });
      expect(repository.markClassEnrollmentExpired).not.toHaveBeenCalled();
    });
    it('markFixedEnrollmentExpired no-ops when enrollment missing', async () => {
      repository.findFixedEnrollmentForCheckoutSession.mockResolvedValue(null);
      await expect(
        service.processFixedStripeWebhookEvent({
          id: 'evt_fx_miss',
          type: 'checkout.session.expired',
          livemode: false,
          data: {
            object: {
              id: 'cs_fx_miss',
              metadata: { flow: 'fixed_event_ticket' },
            },
          },
        }),
      ).resolves.toEqual({ handled: true });
      expect(repository.markFixedEnrollmentExpired).not.toHaveBeenCalled();
    });
    it('reconcileFixedTicketFromStripeSession rejects unpaid', async () => {
      await expect(
        service.reconcileFixedTicketFromStripeSession('cs_2', {
          status: 'open',
          payment_status: 'unpaid',
          metadata: { flow: 'fixed_event_ticket' },
          id: 'cs_2',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
    it('reconcileClassFromStripeSession routes to class session when no package', async () => {
      repository.findPackageEnrollmentByCheckoutSessionId.mockResolvedValue(
        null,
      );
      const enrollment = makeClassEnrollmentWebhookInclude();
      repository.findClassEnrollmentForCheckoutSession.mockResolvedValue(
        enrollment,
      );
      repository.markClassEnrollmentPaid.mockResolvedValue({
        ...enrollment,
        status: UpcomingClassEnrollmentStatus.PAID,
      });
      harness.stripe.client.checkout.sessions.retrieve.mockResolvedValue(
        makeStripeCheckoutSessionLite({
          id: 'cs_class_route',
          amount_total: 5000,
          metadata: { flow: 'class_session' },
        }),
      );
      await expect(
        service.reconcileClassFromStripeSession('cs_class_route'),
      ).resolves.toEqual({ reconciled: true });
    });
    it('getClassSessionStatus soft-reconcile catch for single class', async () => {
      const pending = makeClassEnrollmentWebhookInclude();
      repository.findPackageEnrollmentForCheckoutSession.mockResolvedValue(
        null,
      );
      repository.findClassEnrollmentForCheckoutSession.mockResolvedValue(
        pending,
      );
      harness.stripe.client.checkout.sessions.retrieve.mockResolvedValue({
        status: 'complete',
        payment_status: 'paid',
        metadata: { flow: 'class_session' },
        id: 'cs_class_1',
        amount_total: 5000,
        currency: 'usd',
      });
      jest
        .spyOn(service, 'reconcileClassSessionFromStripeSession')
        .mockRejectedValue(new Error('class reconcile boom'));
      const result = await service.getClassSessionStatus('cs_class_1');
      expect(result.stripeStatus).toBe('complete');
      expect(result.enrollment.status).toBe(
        UpcomingClassEnrollmentStatus.PENDING_PAYMENT,
      );
    });
    it('getClassSessionStatus maps expired stripe status', async () => {
      const pending = makeClassEnrollmentWebhookInclude();
      repository.findPackageEnrollmentForCheckoutSession.mockResolvedValue(
        null,
      );
      repository.findClassEnrollmentForCheckoutSession.mockResolvedValue(
        pending,
      );
      harness.stripe.client.checkout.sessions.retrieve.mockResolvedValue({
        status: 'expired',
        payment_status: 'unpaid',
        metadata: { flow: 'class_session' },
        id: 'cs_class_1',
      });
      const result = await service.getClassSessionStatus('cs_class_1');
      expect(result.stripeStatus).toBe('expired');
    });
    it('fixed pay rethrows non-Conflict transaction errors', async () => {
      repository.findFixedEnrollmentForCheckoutSession.mockResolvedValue(
        makeFixedEnrollmentWebhookInclude(),
      );
      repository.findVenueConfigByEventId.mockResolvedValue(
        makeVenueConfigStub({ eventId: 'event-fixed-1' }),
      );
      harness.stripe.client.paymentIntents.retrieve.mockResolvedValue({
        payment_method: null,
      });
      repository.finalizeFixedEnrollmentPayment.mockRejectedValue(
        new Error('db boom'),
      );
      await expect(
        service.processFixedStripeWebhookEvent(fixedCompletedEvent()),
      ).rejects.toThrow('db boom');
    });
    it('fixed pay throws when afterPay status is not PAID', async () => {
      const enrollment = makeFixedEnrollmentWebhookInclude();
      repository.findFixedEnrollmentForCheckoutSession.mockResolvedValue(
        enrollment,
      );
      repository.findFixedEnrollmentRecordById.mockResolvedValue({
        ...enrollment,
        status: UpcomingClassEnrollmentStatus.PENDING_PAYMENT,
      });
      repository.findVenueConfigByEventId.mockResolvedValue(
        makeVenueConfigStub({ eventId: enrollment.eventId }),
      );
      mockFixedPaidFinalize(enrollment);
      await expect(
        service.processFixedStripeWebhookEvent(fixedCompletedEvent()),
      ).rejects.toBeInstanceOf(InternalServerErrorException);
    });
    it('fixed tx already PAID returns without re-assigning ticket', async () => {
      const enrollment = makeFixedEnrollmentWebhookInclude();
      repository.findFixedEnrollmentForCheckoutSession.mockResolvedValue(
        enrollment,
      );
      repository.findFixedEnrollmentRecordById.mockResolvedValue({
        ...enrollment,
        status: UpcomingClassEnrollmentStatus.PAID,
        ticketNumber: 9,
      });
      repository.findFixedEnrollmentById.mockResolvedValue({
        ...enrollment,
        status: UpcomingClassEnrollmentStatus.PAID,
        ticketNumber: 9,
        customerEmailSentAt: new Date(),
        adminNotifySentAt: new Date(),
      });
      repository.findVenueConfigByEventId.mockResolvedValue(
        makeVenueConfigStub({ eventId: enrollment.eventId }),
      );
      repository.finalizeFixedEnrollmentPayment.mockResolvedValue({
        ...enrollment,
        ticketNumber: 9,
      });
      harness.stripe.client.paymentIntents.retrieve.mockResolvedValue({
        payment_method: null,
      });
      await expect(
        service.processFixedStripeWebhookEvent(fixedCompletedEvent()),
      ).resolves.toEqual({ handled: true });
    });
    it('reconcileFixedTicketFromStripeSession returns reconciled true', async () => {
      const enrollment = makeFixedEnrollmentWebhookInclude();
      repository.findFixedEnrollmentForCheckoutSession.mockResolvedValue(
        enrollment,
      );
      repository.findFixedEnrollmentRecordById.mockResolvedValue({
        ...enrollment,
        status: UpcomingClassEnrollmentStatus.PAID,
        ticketNumber: 2,
      });
      repository.findFixedEnrollmentById.mockResolvedValue({
        ...enrollment,
        status: UpcomingClassEnrollmentStatus.PAID,
        ticketNumber: 2,
        customerEmailSentAt: new Date(),
        adminNotifySentAt: new Date(),
      });
      repository.findVenueConfigByEventId.mockResolvedValue(
        makeVenueConfigStub({ eventId: enrollment.eventId }),
      );
      mockFixedPaidFinalize(enrollment);
      await expect(
        service.reconcileFixedTicketFromStripeSession(
          'cs_fixed_1',
          makeStripeCheckoutSessionLite({
            id: 'cs_fixed_1',
            amount_total: 2500,
            metadata: { flow: 'fixed_event_ticket' },
          }),
        ),
      ).resolves.toEqual({ reconciled: true });
    });
    it('reconcileClassPackageFromStripeSession returns reconciled true', async () => {
      const pkg = makeClassPackageWebhookInclude({ itemCount: 2 });
      repository.findPackageEnrollmentForCheckoutSession.mockResolvedValue(pkg);
      repository.findPackageEnrollmentById.mockResolvedValue({
        ...pkg,
        status: UpcomingClassEnrollmentStatus.PAID,
      });
      await expect(
        service.reconcileClassPackageFromStripeSession(
          'cs_pkg_1',
          makeStripeCheckoutSessionLite({
            id: 'cs_pkg_1',
            amount_total: 10_000,
            metadata: { flow: 'class_session_bundle' },
          }),
        ),
      ).resolves.toEqual({ reconciled: true });
    });
    it('getFixedEventSessionStatus soft-reconcile catch still returns status', async () => {
      const pending = makeFixedEnrollmentWebhookInclude();
      repository.findFixedEnrollmentForCheckoutSession.mockResolvedValue(
        pending,
      );
      harness.stripe.client.checkout.sessions.retrieve.mockResolvedValue({
        status: 'complete',
        payment_status: 'paid',
        metadata: { flow: 'fixed_event_ticket' },
        id: 'cs_fixed_1',
        amount_total: 2500,
        currency: 'usd',
      });
      jest
        .spyOn(service, 'reconcileFixedTicketFromStripeSession')
        .mockRejectedValue(new Error('reconcile boom'));
      const result = await service.getFixedEventSessionStatus('cs_fixed_1');
      expect(result.stripeStatus).toBe('complete');
      expect(result.enrollment.status).toBe(
        UpcomingClassEnrollmentStatus.PENDING_PAYMENT,
      );
    });
    it('getClassSessionStatus package reconcile warn path still returns', async () => {
      const pkg = makeClassPackageWebhookInclude({ itemCount: 2 });
      repository.findPackageEnrollmentForCheckoutSession.mockResolvedValue(pkg);
      harness.stripe.client.checkout.sessions.retrieve.mockResolvedValue({
        status: 'complete',
        payment_status: 'paid',
        metadata: { flow: 'class_session_bundle' },
        id: 'cs_pkg_1',
        amount_total: 10_000,
        currency: 'usd',
      });
      jest
        .spyOn(service, 'reconcileClassPackageFromStripeSession')
        .mockRejectedValue(new Error('pkg reconcile boom'));
      const result = await service.getClassSessionStatus('cs_pkg_1');
      expect(result.package).toBe(true);
      expect(result.stripeStatus).toBe('complete');
      expect(result.enrollment.status).toBe(
        UpcomingClassEnrollmentStatus.PENDING_PAYMENT,
      );
    });
  });
  describe('deprecated handlers', () => {
    it('handleClassWebhook throws when signature missing', async () => {
      await expect(
        service.handleClassWebhook(Buffer.from('{}'), undefined),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
    it('handleClassWebhook constructEvent then process', async () => {
      harness.stripe.client.webhooks.constructEvent.mockReturnValue(
        classCompletedEvent(),
      );
      repository.findClassEnrollmentForCheckoutSession.mockResolvedValue(
        makeClassEnrollmentWebhookInclude({
          status: UpcomingClassEnrollmentStatus.PAID,
        }),
      );
      await expect(
        service.handleClassWebhook(Buffer.from('{}'), 'sig_test'),
      ).resolves.toEqual({ handled: true });
      expect(harness.stripe.client.webhooks.constructEvent).toHaveBeenCalled();
    });
    it('handleFixedEventTicketWebhook throws when signature missing', async () => {
      await expect(
        service.handleFixedEventTicketWebhook(Buffer.from('{}'), undefined),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
    it('handleFixedEventTicketWebhook constructEvent then process', async () => {
      const paid = makeFixedEnrollmentWebhookInclude({
        status: UpcomingClassEnrollmentStatus.PAID,
        ticketNumber: 1,
        customerEmailSentAt: new Date(),
        adminNotifySentAt: new Date(),
      });
      harness.stripe.client.webhooks.constructEvent.mockReturnValue(
        fixedCompletedEvent(),
      );
      repository.findFixedEnrollmentForCheckoutSession.mockResolvedValue(paid);
      repository.findFixedEnrollmentById.mockResolvedValue(paid);
      repository.findVenueConfigByEventId.mockResolvedValue(
        makeVenueConfigStub({ eventId: paid.eventId }),
      );
      await expect(
        service.handleFixedEventTicketWebhook(Buffer.from('{}'), 'sig_test'),
      ).resolves.toEqual({ handled: true });
    });
  });
});
