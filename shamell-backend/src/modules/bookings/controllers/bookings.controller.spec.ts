import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ThrottlerGuard } from '@nestjs/throttler';
import type { Response } from 'express';
import type { AdminJwtPayload } from '../../auth/decorators/current-admin.decorator';
import { AdminJwtGuard } from '../../../common/auth/guards/admin-jwt.guard';
import { createBookingsServiceMock } from '../__mocks__/bookings.service.mock';
import { makeOccupiedPayload } from '../__mocks__/bookings.fixtures';
import { BookingsService } from '../services/bookings.service';
import { BookingsController } from './bookings.controller';

const BOOKING_ID = '11111111-1111-4111-8111-111111111111';
const admin: AdminJwtPayload = {
  id: 'admin-1',
  email: 'admin@example.com',
  role: 'ADMIN',
};

describe('BookingsController', () => {
  let controller: BookingsController;
  const bookingsService = createBookingsServiceMock();

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      controllers: [BookingsController],
      providers: [{ provide: BookingsService, useValue: bookingsService }],
    })
      .overrideGuard(AdminJwtGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(ThrottlerGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = moduleRef.get(BookingsController);
  });

  it('getOccupiedPublic delegates', async () => {
    const payload = makeOccupiedPayload();
    bookingsService.getPublicOccupiedByDate.mockResolvedValue(payload);
    await expect(controller.getOccupiedPublic('2026-07-15')).resolves.toEqual(
      payload,
    );
  });

  it('admin CRUD and calendar/list/getOne delegate', async () => {
    bookingsService.createAdminBooking.mockResolvedValue({ id: BOOKING_ID });
    bookingsService.findAllAdmin.mockResolvedValue({ items: [], total: 0 });
    bookingsService.findCalendarAdmin.mockResolvedValue({ items: [] });
    bookingsService.findOneAdmin.mockResolvedValue({ id: BOOKING_ID });
    bookingsService.updateAdmin.mockResolvedValue({ id: BOOKING_ID });
    bookingsService.removeAdmin.mockResolvedValue({ message: 'ok' });

    await expect(
      controller.createAdmin(admin, {
        eventDate: '2026-08-15T18:00:00.000Z',
        guestFullName: 'Guest',
        guestEmail: 'g@example.com',
      } as never),
    ).resolves.toEqual({ id: BOOKING_ID });
    await expect(controller.findAllAdmin({ page: 1 })).resolves.toEqual({
      items: [],
      total: 0,
    });
    await expect(
      controller.findCalendarAdmin({ from: '2026-08-01', to: '2026-08-31' }),
    ).resolves.toEqual({ items: [] });
    await expect(controller.findOneAdmin(BOOKING_ID)).resolves.toEqual({
      id: BOOKING_ID,
    });
    await expect(
      controller.updateAdmin(BOOKING_ID, { status: 'CONFIRMED' } as never),
    ).resolves.toEqual({ id: BOOKING_ID });
    await expect(controller.removeAdmin(BOOKING_ID)).resolves.toEqual({
      message: 'ok',
    });
    await expect(controller.removeAdmin(BOOKING_ID, 'true')).resolves.toEqual({
      message: 'ok',
    });
    expect(bookingsService.removeAdmin).toHaveBeenLastCalledWith(BOOKING_ID, {
      purgeContact: true,
    });
  });

  it('private-class cash and checkout delegate', async () => {
    bookingsService.createPrivateClassCash.mockResolvedValue({
      id: BOOKING_ID,
    });
    bookingsService.createPrivateClassCheckoutSession.mockResolvedValue({
      bookingId: BOOKING_ID,
      payUrl: 'https://pay',
    });
    const dto = {
      guestFullName: 'Student',
      guestEmail: 's@example.com',
      eventDate: '2026-08-15T18:00:00.000Z',
    } as never;
    await expect(
      controller.createPrivateClassCash(admin, dto),
    ).resolves.toEqual({ id: BOOKING_ID });
    await expect(
      controller.createPrivateClassCheckout(admin, dto),
    ).resolves.toMatchObject({ payUrl: 'https://pay' });
  });

  it('quote and balance-link delegate', async () => {
    bookingsService.createBookingQuote.mockResolvedValue({ id: 'q-1' });
    bookingsService.sendBookingBalanceLink.mockResolvedValue({ ok: true });
    await expect(
      controller.createQuote(admin, BOOKING_ID, {
        paymentModel: 'FULL',
        totalAmount: 100,
      } as never),
    ).resolves.toEqual({ id: 'q-1' });
    await expect(
      controller.sendBalanceLink(admin, BOOKING_ID, {}),
    ).resolves.toEqual({ ok: true });
  });

  it('quote pay/checkout/reconcile/session-status validate and delegate', async () => {
    expect(() => controller.quotePayRedirect('', {} as Response)).toThrow(
      BadRequestException,
    );
    expect(() => controller.quoteCheckout('')).toThrow(BadRequestException);
    expect(() => controller.quoteReconcile('')).toThrow(BadRequestException);
    expect(() => controller.quoteSessionStatus('')).toThrow(
      BadRequestException,
    );

    bookingsService.resolveQuotePayUrl.mockReturnValue(
      'https://app/pay/quote?token=t',
    );
    const redirect = jest.fn();
    controller.quotePayRedirect('token-1', {
      redirect,
    } as unknown as Response);
    expect(redirect).toHaveBeenCalledWith('https://app/pay/quote?token=t');

    bookingsService.resolveQuoteCheckoutClientSecret.mockResolvedValue(
      'cs_secret',
    );
    await expect(controller.quoteCheckout('token-1')).resolves.toEqual({
      clientSecret: 'cs_secret',
    });

    bookingsService.getQuotePaymentSessionStatus.mockResolvedValue({
      stripeStatus: 'open',
    });
    await expect(controller.quoteReconcile('cs_1')).resolves.toEqual({
      stripeStatus: 'open',
    });
    await expect(controller.quoteSessionStatus('cs_1')).resolves.toEqual({
      stripeStatus: 'open',
    });
  });

  it('deprecated webhook returns 410 payload', () => {
    expect(controller.handleBookingPaymentsWebhookDeprecated()).toEqual({
      deprecated: true,
      message:
        'Use POST /api/v1/stripe/webhook instead. This endpoint is no longer active.',
    });
  });

  it('propagates service errors', async () => {
    bookingsService.findOneAdmin.mockRejectedValue(
      new NotFoundException('Booking not found.'),
    );
    bookingsService.getPublicOccupiedByDate.mockRejectedValue(
      new BadRequestException('Invalid date.'),
    );
    await expect(controller.findOneAdmin('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    await expect(
      controller.getOccupiedPublic('bad-date'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
