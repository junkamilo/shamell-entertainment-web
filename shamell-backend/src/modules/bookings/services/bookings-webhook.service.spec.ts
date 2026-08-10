import { BadRequestException, NotFoundException } from '@nestjs/common';
import {
  BookingPaymentStage,
  BookingPaymentStatus,
  BookingStatus,
} from '@prisma/client';
import {
  makeBookingWithRelations,
  makePaidCheckoutSession,
  makeWebhookPaymentRow,
} from '../__mocks__/bookings.fixtures';
import { createBookingsWebhookServiceTestModule } from '../testing/bookings-webhook-service.test-module';
import type { BookingsWebhookServiceTestHarness } from '../testing/bookings-webhook-service.test-module';

describe('BookingsWebhookService (deep QA)', () => {
  let harness: BookingsWebhookServiceTestHarness;

  beforeEach(async () => {
    jest.clearAllMocks();
    harness = await createBookingsWebhookServiceTestModule();
    harness.repository.updateBookingPayment.mockResolvedValue(undefined);
    harness.repository.updateBooking.mockResolvedValue(undefined);
    harness.repository.findBookingAdminById.mockResolvedValue(
      makeBookingWithRelations(),
    );
    harness.mail.sendTransactional.mockResolvedValue({ ok: true });
    harness.adminPaymentNotify.notifyPaymentOutcome.mockResolvedValue(
      undefined,
    );
  });

  afterEach(async () => {
    await harness.moduleRef.close();
  });

  it('processStripeWebhookEvent ignores non-booking flow', async () => {
    await expect(
      harness.service.processStripeWebhookEvent({
        id: 'evt_1',
        type: 'checkout.session.completed',
        data: { object: { metadata: { flow: 'venue_seat' } } },
      }),
    ).resolves.toEqual({ received: true, handled: false });
  });

  it('processStripeWebhookEvent ignores unknown event type for booking_quote', async () => {
    await expect(
      harness.service.processStripeWebhookEvent({
        id: 'evt_1',
        type: 'payment_intent.succeeded',
        data: {
          object: makePaidCheckoutSession(),
        },
      }),
    ).resolves.toEqual({ received: true, handled: false });
  });

  it('parseStripeCheckoutSession rejects non-object', () => {
    expect(() => harness.service.parseStripeCheckoutSession(null)).toThrow(
      BadRequestException,
    );
  });

  it('handleBookingPaymentsWebhook requires signature', async () => {
    await expect(
      harness.service.handleBookingPaymentsWebhook(Buffer.from('x'), undefined),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('handleBookingPaymentsWebhook rejects array signature', async () => {
    await expect(
      harness.service.handleBookingPaymentsWebhook(Buffer.from('x'), [
        'sig_a',
        'sig_b',
      ]),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('handleBookingPaymentsWebhook constructs event and processes', async () => {
    harness.stripe.client.webhooks.constructEvent.mockReturnValue({
      id: 'evt_wh',
      type: 'checkout.session.completed',
      data: { object: { metadata: { flow: 'other' } } },
    });
    await expect(
      harness.service.handleBookingPaymentsWebhook(Buffer.from('raw'), 'sig'),
    ).resolves.toEqual({ received: true, handled: false });
    expect(harness.stripe.client.webhooks.constructEvent).toHaveBeenCalled();
  });

  it('markBookingPaymentPaid DEPOSIT updates booking and sends mail', async () => {
    const payment = makeWebhookPaymentRow({
      stage: BookingPaymentStage.DEPOSIT,
      expectedAmount: 150,
      stripeCheckoutSessionId: 'cs_deposit',
    });
    harness.repository.findWebhookPaymentBySessionId.mockResolvedValue(payment);
    const session = makePaidCheckoutSession({
      id: 'cs_deposit',
      amountCents: 15000,
    });

    await harness.service.markBookingPaymentPaid('evt_dep', session);

    expect(harness.repository.updateBookingPayment).toHaveBeenCalledWith(
      payment.id,
      expect.objectContaining({
        status: BookingPaymentStatus.PAID,
        stripePaymentIntentId: 'pi_booking_1',
      }),
    );
    expect(harness.repository.updateBooking).toHaveBeenCalledWith(
      payment.bookingId,
      expect.objectContaining({
        status: BookingStatus.PENDING,
        depositPaidAt: expect.any(Date) as Date,
      }),
    );
    expect(harness.mail.sendTransactional).toHaveBeenCalled();
    expect(
      harness.adminPaymentNotify.notifyPaymentOutcome,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        outcome: 'DEPOSIT_PAID',
        flow: 'BOOKING_QUOTE',
        stage: BookingPaymentStage.DEPOSIT,
      }),
    );
  });

  it('markBookingPaymentPaid FULL confirms booking and sends fully-paid mail', async () => {
    const payment = makeWebhookPaymentRow({
      stage: BookingPaymentStage.FULL,
      expectedAmount: 500,
    });
    harness.repository.findWebhookPaymentBySessionId.mockResolvedValue(payment);

    await harness.service.markBookingPaymentPaid(
      'evt_full',
      makePaidCheckoutSession({ amountCents: 50000 }),
    );

    expect(harness.repository.updateBooking).toHaveBeenCalledWith(
      payment.bookingId,
      expect.objectContaining({
        status: BookingStatus.CONFIRMED,
        totalAmount: payment.expectedAmount,
      }),
    );
    expect(harness.mail.sendTransactional).toHaveBeenCalled();
    expect(
      harness.adminPaymentNotify.notifyPaymentOutcome,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        outcome: 'PAID',
        stage: BookingPaymentStage.FULL,
      }),
    );
  });

  it('markBookingPaymentPaid BALANCE sets balancePaidAt from quote total', async () => {
    const payment = makeWebhookPaymentRow({
      stage: BookingPaymentStage.BALANCE,
      expectedAmount: 350,
      quote: { id: 'quote-1', totalAmount: 500 },
    });
    harness.repository.findWebhookPaymentBySessionId.mockResolvedValue(payment);

    await harness.service.markBookingPaymentPaid(
      'evt_bal',
      makePaidCheckoutSession({
        id: 'cs_booking_paid',
        amountCents: 35000,
      }),
    );

    expect(harness.repository.updateBooking).toHaveBeenCalledWith(
      payment.bookingId,
      expect.objectContaining({
        status: BookingStatus.CONFIRMED,
        balancePaidAt: expect.any(Date) as Date,
        totalAmount: 500,
      }),
    );
  });

  it('markBookingPaymentPaid rejects amount mismatch', async () => {
    harness.repository.findWebhookPaymentBySessionId.mockResolvedValue(
      makeWebhookPaymentRow({ expectedAmount: 500 }),
    );

    await expect(
      harness.service.markBookingPaymentPaid(
        'evt_mismatch',
        makePaidCheckoutSession({ amountCents: 10000 }),
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(harness.repository.updateBookingPayment).not.toHaveBeenCalled();
  });

  it('markBookingPaymentPaid rejects unpaid session', async () => {
    harness.repository.findWebhookPaymentBySessionId.mockResolvedValue(
      makeWebhookPaymentRow(),
    );

    await expect(
      harness.service.markBookingPaymentPaid(
        'evt_unpaid',
        makePaidCheckoutSession({ paymentStatus: 'unpaid' }),
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('markBookingPaymentPaid throws when payment missing', async () => {
    harness.repository.findWebhookPaymentBySessionId.mockResolvedValue(null);

    await expect(
      harness.service.markBookingPaymentPaid(
        'evt_missing',
        makePaidCheckoutSession(),
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('markBookingPaymentPaid is idempotent when already PAID', async () => {
    harness.repository.findWebhookPaymentBySessionId.mockResolvedValue(
      makeWebhookPaymentRow({ status: BookingPaymentStatus.PAID }),
    );

    await harness.service.markBookingPaymentPaid(
      'evt_idem',
      makePaidCheckoutSession(),
    );

    expect(harness.repository.updateBookingPayment).not.toHaveBeenCalled();
    expect(harness.mail.sendTransactional).not.toHaveBeenCalled();
  });

  it('markBookingPaymentPaid skips customer mail when already sent', async () => {
    harness.repository.findWebhookPaymentBySessionId.mockResolvedValue(
      makeWebhookPaymentRow({
        stage: BookingPaymentStage.FULL,
        customerEmailSentAt: new Date('2026-07-01T00:00:00.000Z'),
      }),
    );

    await harness.service.markBookingPaymentPaid(
      'evt_mail_skip',
      makePaidCheckoutSession(),
    );

    expect(harness.mail.sendTransactional).not.toHaveBeenCalled();
    expect(harness.adminPaymentNotify.notifyPaymentOutcome).toHaveBeenCalled();
  });

  it('markBookingPaymentPaid accepts payment_intent object id', async () => {
    harness.repository.findWebhookPaymentBySessionId.mockResolvedValue(
      makeWebhookPaymentRow({ stage: BookingPaymentStage.FULL }),
    );

    await harness.service.markBookingPaymentPaid(
      'evt_pi_obj',
      makePaidCheckoutSession({ paymentIntent: { id: 'pi_obj_1' } }),
    );

    expect(harness.repository.updateBookingPayment).toHaveBeenCalledWith(
      'payment-1',
      expect.objectContaining({ stripePaymentIntentId: 'pi_obj_1' }),
    );
  });

  it('processStripeWebhookEvent completed marks DEPOSIT paid', async () => {
    harness.repository.findWebhookPaymentBySessionId.mockResolvedValue(
      makeWebhookPaymentRow({
        stage: BookingPaymentStage.DEPOSIT,
        expectedAmount: 150,
        stripeCheckoutSessionId: 'cs_dep_evt',
      }),
    );

    await expect(
      harness.service.processStripeWebhookEvent({
        id: 'evt_done',
        type: 'checkout.session.completed',
        data: {
          object: makePaidCheckoutSession({
            id: 'cs_dep_evt',
            amountCents: 15000,
          }),
        },
      }),
    ).resolves.toEqual({ received: true, handled: true });
  });

  it('processStripeWebhookEvent expired marks PENDING payment EXPIRED', async () => {
    const payment = makeWebhookPaymentRow({
      status: BookingPaymentStatus.PENDING,
      stripeCheckoutSessionId: 'cs_exp',
    });
    harness.repository.findExpiredWebhookPaymentBySessionId.mockResolvedValue(
      payment,
    );

    await expect(
      harness.service.processStripeWebhookEvent({
        id: 'evt_exp',
        type: 'checkout.session.expired',
        data: {
          object: {
            id: 'cs_exp',
            metadata: { flow: 'booking_quote' },
          },
        },
      }),
    ).resolves.toEqual({ received: true, handled: true });

    expect(harness.repository.updateBookingPayment).toHaveBeenCalledWith(
      payment.id,
      { status: BookingPaymentStatus.EXPIRED },
    );
    expect(
      harness.adminPaymentNotify.notifyPaymentOutcome,
    ).toHaveBeenCalledWith(expect.objectContaining({ outcome: 'EXPIRED' }));
  });

  it('processStripeWebhookEvent expired is no-op when payment not PENDING', async () => {
    harness.repository.findExpiredWebhookPaymentBySessionId.mockResolvedValue(
      makeWebhookPaymentRow({ status: BookingPaymentStatus.PAID }),
    );

    await harness.service.processStripeWebhookEvent({
      id: 'evt_exp2',
      type: 'checkout.session.expired',
      data: {
        object: {
          id: 'cs_exp2',
          metadata: { flow: 'booking_quote' },
        },
      },
    });

    expect(harness.repository.updateBookingPayment).not.toHaveBeenCalled();
  });

  it('processStripeWebhookEvent expired rejects missing session id', async () => {
    await expect(
      harness.service.processStripeWebhookEvent({
        id: 'evt_bad',
        type: 'checkout.session.expired',
        data: {
          object: { metadata: { flow: 'booking_quote' } },
        },
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('markBookingPaymentPaid continues when booking missing for mail', async () => {
    harness.repository.findWebhookPaymentBySessionId.mockResolvedValue(
      makeWebhookPaymentRow({ stage: BookingPaymentStage.FULL }),
    );
    harness.repository.findBookingAdminById.mockResolvedValue(null);

    await harness.service.markBookingPaymentPaid(
      'evt_no_booking',
      makePaidCheckoutSession(),
    );

    expect(harness.mail.sendTransactional).not.toHaveBeenCalled();
    expect(harness.adminPaymentNotify.notifyPaymentOutcome).toHaveBeenCalled();
  });

  it('markBookingPaymentPaid continues when guest has no email', async () => {
    harness.repository.findWebhookPaymentBySessionId.mockResolvedValue(
      makeWebhookPaymentRow({
        stage: BookingPaymentStage.DEPOSIT,
        expectedAmount: 150,
      }),
    );
    harness.repository.findBookingAdminById.mockResolvedValue(
      makeBookingWithRelations({ guestEmail: null, user: null }),
    );

    await harness.service.markBookingPaymentPaid(
      'evt_no_email',
      makePaidCheckoutSession({
        id: 'cs_booking_paid',
        amountCents: 15000,
      }),
    );

    expect(harness.mail.sendTransactional).not.toHaveBeenCalled();
  });
});
