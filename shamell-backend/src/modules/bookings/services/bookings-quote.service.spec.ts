import { BadRequestException, NotFoundException } from '@nestjs/common';
import {
  BookingPaymentStage,
  BookingPaymentStatus,
  BookingQuotePaymentModel,
  BookingQuoteStatus,
  BookingStatus,
} from '@prisma/client';
import {
  makeActiveQuoteRow,
  makeBookingWithRelations,
  makeDepositQuoteBooking,
  makeFullyPaidBooking,
  makeMultiServiceBooking,
  makePendingQuotePayment,
} from '../__mocks__/bookings.fixtures';
import { createBookingsQuoteServiceTestModule } from '../testing/bookings-quote-service.test-module';
import type { BookingsQuoteService } from './bookings-quote.service';

describe('BookingsQuoteService', () => {
  let service: BookingsQuoteService;
  let repository: Awaited<
    ReturnType<typeof createBookingsQuoteServiceTestModule>
  >['repository'];
  let stripe: Awaited<
    ReturnType<typeof createBookingsQuoteServiceTestModule>
  >['stripe'];
  let admin: Awaited<
    ReturnType<typeof createBookingsQuoteServiceTestModule>
  >['admin'];
  let webhook: Awaited<
    ReturnType<typeof createBookingsQuoteServiceTestModule>
  >['webhook'];

  beforeEach(async () => {
    const harness = await createBookingsQuoteServiceTestModule();
    service = harness.service;
    repository = harness.repository;
    stripe = harness.stripe;
    admin = harness.admin;
    webhook = harness.webhook;
  });

  describe('createBookingQuote / balance (baseline)', () => {
    it('createBookingQuote rejects fully paid booking', async () => {
      admin.findOneAdmin.mockResolvedValue(makeFullyPaidBooking());
      await expect(
        service.createBookingQuote('admin-1', 'booking-1', {
          paymentModel: BookingQuotePaymentModel.FULL,
          totalAmount: 100,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('resolveQuotePayUrl builds frontend URL', () => {
      expect(service.resolveQuotePayUrl('tok')).toBe(
        'https://example.com/pay/quote?token=tok',
      );
    });

    it('createBookingQuote FULL writes quoteTotalAmount and returns ids', async () => {
      admin.findOneAdmin.mockResolvedValue(makeBookingWithRelations());
      const result = await service.createBookingQuote('admin-1', 'booking-1', {
        paymentModel: BookingQuotePaymentModel.FULL,
        totalAmount: 500,
      });

      expect(result.quoteId).toBe('quote-1');
      expect(result.paymentId).toBe('payment-1');
      expect(result.checkoutSessionId).toBe('cs_quote_1');
      expect(repository.createBookingQuote).toHaveBeenCalledWith(
        expect.objectContaining({
          paymentModel: BookingQuotePaymentModel.FULL,
          totalAmount: 500,
          depositAmount: null,
          balanceAmount: null,
        }),
      );
      expect(repository.updateBooking).toHaveBeenCalledWith(
        'booking-1',
        expect.objectContaining({
          status: BookingStatus.PENDING,
          quoteModel: BookingQuotePaymentModel.FULL,
          quoteTotalAmount: 500,
          quoteDepositAmount: null,
          quoteBalanceAmount: null,
        }),
      );
      expect(repository.createBookingPayment).toHaveBeenCalledWith(
        expect.objectContaining({
          stage: BookingPaymentStage.FULL,
          expectedAmount: 500,
        }),
      );
    });

    it('createBookingQuote DEPOSIT splits deposit and balance', async () => {
      admin.findOneAdmin.mockResolvedValue(makeBookingWithRelations());
      await service.createBookingQuote('admin-1', 'booking-1', {
        paymentModel: BookingQuotePaymentModel.DEPOSIT,
        totalAmount: 500,
        depositAmount: 150,
      });

      expect(repository.createBookingQuote).toHaveBeenCalledWith(
        expect.objectContaining({
          paymentModel: BookingQuotePaymentModel.DEPOSIT,
          totalAmount: 500,
          depositAmount: 150,
          balanceAmount: 350,
        }),
      );
      expect(repository.updateBooking).toHaveBeenCalledWith(
        'booking-1',
        expect.objectContaining({
          quoteDepositAmount: 150,
          quoteBalanceAmount: 350,
        }),
      );
      expect(repository.createBookingPayment).toHaveBeenCalledWith(
        expect.objectContaining({
          stage: BookingPaymentStage.DEPOSIT,
          expectedAmount: 150,
        }),
      );
    });

    it('createBookingQuote rejects invalid total', async () => {
      admin.findOneAdmin.mockResolvedValue(makeBookingWithRelations());
      await expect(
        service.createBookingQuote('admin-1', 'booking-1', {
          paymentModel: BookingQuotePaymentModel.FULL,
          totalAmount: 0,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('createBookingQuote rejects invalid deposit', async () => {
      admin.findOneAdmin.mockResolvedValue(makeBookingWithRelations());
      await expect(
        service.createBookingQuote('admin-1', 'booking-1', {
          paymentModel: BookingQuotePaymentModel.DEPOSIT,
          totalAmount: 500,
          depositAmount: 500,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('createBookingQuote rejects booking without customer email', async () => {
      admin.findOneAdmin.mockResolvedValue(
        makeBookingWithRelations({
          guestEmail: null,
          user: null,
        }),
      );
      await expect(
        service.createBookingQuote('admin-1', 'booking-1', {
          paymentModel: BookingQuotePaymentModel.FULL,
          totalAmount: 100,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('sendBookingBalanceLink rejects when no pending balance', async () => {
      admin.findOneAdmin.mockResolvedValue(
        makeBookingWithRelations({
          quoteBalanceAmount: null,
        }),
      );
      await expect(
        service.sendBookingBalanceLink('admin-1', 'booking-1', {}),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('sendBookingBalanceLink rejects when deposit unpaid', async () => {
      admin.findOneAdmin.mockResolvedValue(
        makeDepositQuoteBooking({
          depositPaidAt: null,
        }),
      );
      await expect(
        service.sendBookingBalanceLink('admin-1', 'booking-1', {}),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('sendBookingBalanceLink happy path returns payUrl', async () => {
      admin.findOneAdmin.mockResolvedValue(makeDepositQuoteBooking());
      repository.findActiveQuoteByBookingId.mockResolvedValue({
        id: 'quote-active',
      });
      repository.cancelOtherPendingBalancePayments.mockResolvedValue({
        count: 0,
      });
      repository.createBookingPayment.mockResolvedValue({
        id: 'payment-balance',
        stripeCheckoutSessionId: 'cs_balance_1',
      });
      stripe.client.checkout.sessions.create = jest.fn().mockResolvedValue({
        id: 'cs_balance_1',
        client_secret: 'cs_balance_secret',
      });

      const result = await service.sendBookingBalanceLink(
        'admin-1',
        'booking-1',
        {},
      );
      expect(result.paymentId).toBe('payment-balance');
      expect(result.payUrl).toContain('/pay/quote?token=');
      expect(repository.createBookingPayment).toHaveBeenCalledWith(
        expect.objectContaining({
          stage: BookingPaymentStage.BALANCE,
          expectedAmount: 350,
        }),
      );
    });

    it('sendBookingBalanceLink NotFound when no active quote', async () => {
      admin.findOneAdmin.mockResolvedValue(makeDepositQuoteBooking());
      repository.findActiveQuoteByBookingId.mockResolvedValue(null);
      await expect(
        service.sendBookingBalanceLink('admin-1', 'booking-1', {}),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('create / multi-service context / re-quote', () => {
    it('FULL on multi-service booking uses admin total (not service sum)', async () => {
      admin.findOneAdmin.mockResolvedValue(makeMultiServiceBooking());
      await service.createBookingQuote('admin-1', 'booking-1', {
        paymentModel: BookingQuotePaymentModel.FULL,
        totalAmount: 900,
      });
      expect(repository.updateBooking).toHaveBeenCalledWith(
        'booking-1',
        expect.objectContaining({
          quoteTotalAmount: 900,
        }),
      );
      expect(repository.createBookingPayment).toHaveBeenCalledWith(
        expect.objectContaining({
          expectedAmount: 900,
        }),
      );
    });

    it('rejects non-USD currency on create', async () => {
      admin.findOneAdmin.mockResolvedValue(makeBookingWithRelations());
      await expect(
        service.createBookingQuote('admin-1', 'booking-1', {
          paymentModel: BookingQuotePaymentModel.FULL,
          totalAmount: 100,
          currency: 'eur',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('re-quote cancels pending payments and rewrites totals', async () => {
      admin.findOneAdmin.mockResolvedValue(makeMultiServiceBooking());
      await service.createBookingQuote('admin-1', 'booking-1', {
        paymentModel: BookingQuotePaymentModel.FULL,
        totalAmount: 400,
      });
      await service.createBookingQuote('admin-1', 'booking-1', {
        paymentModel: BookingQuotePaymentModel.FULL,
        totalAmount: 750,
      });
      expect(repository.cancelPendingBookingPayments).toHaveBeenCalledTimes(2);
      expect(repository.updateBooking).toHaveBeenLastCalledWith(
        'booking-1',
        expect.objectContaining({
          quoteTotalAmount: 750,
        }),
      );
    });
  });

  describe('checkout / expiry / reissue', () => {
    it('resolveQuoteCheckoutClientSecret rejects expired quote token', async () => {
      repository.findActiveQuoteByTokenHash.mockResolvedValue(
        makeActiveQuoteRow({
          tokenExpiresAt: new Date(Date.now() - 60_000),
        }),
      );
      await expect(
        service.resolveQuoteCheckoutClientSecret('raw-token'),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(repository.updateBookingQuote).toHaveBeenCalledWith(
        'quote-1',
        expect.objectContaining({
          status: BookingQuoteStatus.EXPIRED,
        }),
      );
    });

    it('resolveQuoteCheckoutClientSecret NotFound for unknown token', async () => {
      repository.findActiveQuoteByTokenHash.mockResolvedValue(null);
      await expect(
        service.resolveQuoteCheckoutClientSecret('missing'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('resolveQuoteCheckoutClientSecret returns client_secret for open session', async () => {
      repository.findActiveQuoteByTokenHash.mockResolvedValue(
        makeActiveQuoteRow(),
      );
      repository.findBookingWithUser.mockResolvedValue(
        makeBookingWithRelations(),
      );
      repository.findPendingPaymentByQuoteId.mockResolvedValue(
        makePendingQuotePayment(),
      );
      stripe.client.checkout.sessions.retrieve = jest.fn().mockResolvedValue({
        id: 'cs_quote_open',
        status: 'open',
        client_secret: 'cs_open_secret',
        payment_status: 'unpaid',
      });

      await expect(
        service.resolveQuoteCheckoutClientSecret('raw-token'),
      ).resolves.toBe('cs_open_secret');
    });

    it('reissues checkout when Stripe session is expired', async () => {
      repository.findActiveQuoteByTokenHash.mockResolvedValue(
        makeActiveQuoteRow(),
      );
      repository.findBookingWithUser.mockResolvedValue(
        makeBookingWithRelations(),
      );
      repository.findPendingPaymentByQuoteId.mockResolvedValue(
        makePendingQuotePayment({
          id: 'payment-old',
          stripeCheckoutSessionId: 'cs_expired',
          expectedAmount: 500,
        }),
      );
      stripe.client.checkout.sessions.retrieve = jest
        .fn()
        .mockResolvedValueOnce({
          id: 'cs_expired',
          status: 'expired',
          payment_status: 'unpaid',
          client_secret: null,
        })
        .mockResolvedValueOnce({
          id: 'cs_reissued',
          status: 'open',
          client_secret: 'cs_reissued_secret',
          payment_status: 'unpaid',
        });
      stripe.client.checkout.sessions.create = jest.fn().mockResolvedValue({
        id: 'cs_reissued',
        client_secret: 'cs_reissued_secret',
      });
      repository.createBookingPayment.mockResolvedValue({
        id: 'payment-reissued',
        stripeCheckoutSessionId: 'cs_reissued',
      });

      await expect(
        service.resolveQuoteCheckoutClientSecret('raw-token'),
      ).resolves.toBe('cs_reissued_secret');
      expect(repository.updateBookingPayment).toHaveBeenCalledWith(
        'payment-old',
        expect.objectContaining({
          status: BookingPaymentStatus.EXPIRED,
        }),
      );
      expect(stripe.client.checkout.sessions.create).toHaveBeenCalled();
    });

    it('rejects checkout when session already paid', async () => {
      repository.findActiveQuoteByTokenHash.mockResolvedValue(
        makeActiveQuoteRow(),
      );
      repository.findBookingWithUser.mockResolvedValue(
        makeBookingWithRelations(),
      );
      repository.findPendingPaymentByQuoteId.mockResolvedValue(
        makePendingQuotePayment(),
      );
      stripe.client.checkout.sessions.retrieve = jest.fn().mockResolvedValue({
        id: 'cs_paid',
        status: 'complete',
        payment_status: 'paid',
        client_secret: 'cs_paid_secret',
      });

      await expect(
        service.resolveQuoteCheckoutClientSecret('raw-token'),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('session status / reconcile', () => {
    it('getQuotePaymentSessionStatus returns open without reconcile', async () => {
      repository.findPaymentByCheckoutSessionId.mockResolvedValue(
        makePendingQuotePayment({
          status: BookingPaymentStatus.PENDING,
          stripeCheckoutSessionId: 'cs_open',
        }),
      );
      stripe.client.checkout.sessions.retrieve = jest.fn().mockResolvedValue({
        id: 'cs_open',
        status: 'open',
        payment_status: 'unpaid',
      });

      const status = await service.getQuotePaymentSessionStatus('cs_open');
      expect(status.stripeStatus).toBe('open');
      expect(status.paymentStatus).toBe(BookingPaymentStatus.PENDING);
      expect(webhook.markBookingPaymentPaid).not.toHaveBeenCalled();
    });

    it('reconciles when Stripe complete+paid and payment PENDING', async () => {
      const payment = makePendingQuotePayment({
        status: BookingPaymentStatus.PENDING,
        stripeCheckoutSessionId: 'cs_complete',
      });
      repository.findPaymentByCheckoutSessionId
        .mockResolvedValueOnce(payment)
        .mockResolvedValueOnce({
          ...payment,
          status: BookingPaymentStatus.PAID,
        });
      stripe.client.checkout.sessions.retrieve = jest.fn().mockResolvedValue({
        id: 'cs_complete',
        status: 'complete',
        payment_status: 'paid',
      });

      const status = await service.getQuotePaymentSessionStatus('cs_complete');
      expect(webhook.markBookingPaymentPaid).toHaveBeenCalledWith(
        'return-page-reconcile',
        expect.objectContaining({
          id: 'cs_complete',
          status: 'complete',
        }),
      );
      expect(status.stripeStatus).toBe('complete');
      expect(status.paymentStatus).toBe(BookingPaymentStatus.PAID);
    });

    it('getQuotePaymentSessionStatus NotFound for unknown session', async () => {
      repository.findPaymentByCheckoutSessionId.mockResolvedValue(null);
      await expect(
        service.getQuotePaymentSessionStatus('cs_missing'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('sendBookingBalanceLink rejects non-USD currency', async () => {
      admin.findOneAdmin.mockResolvedValue(makeDepositQuoteBooking());
      repository.findActiveQuoteByBookingId.mockResolvedValue({
        id: 'quote-active',
      });
      await expect(
        service.sendBookingBalanceLink('admin-1', 'booking-1', {
          currency: 'eur',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });
});
