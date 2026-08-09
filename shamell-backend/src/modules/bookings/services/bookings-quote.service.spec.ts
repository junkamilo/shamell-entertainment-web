import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BookingQuotePaymentModel, BookingStatus } from '@prisma/client';
import { Test } from '@nestjs/testing';
import { MailService } from '../../mail/services/mail.service';
import { AdminCustomerActivityNotifyService } from '../../mail/services/admin-customer-activity-notify.service';
import { StripeService } from '../../stripe/services/stripe.service';
import { createStripeServiceMock } from '../../stripe/__mocks__/stripe.service.mock';
import { createBookingsRepositoryMock } from '../__mocks__/bookings.repository.mock';
import { makeBookingWithRelations } from '../__mocks__/bookings.fixtures';
import { BookingsAdminService } from './bookings-admin.service';
import { BookingsQuoteService } from './bookings-quote.service';
import { BookingsRepository } from './bookings.repository';
import { BookingsWebhookService } from './bookings-webhook.service';

describe('BookingsQuoteService', () => {
  let service: BookingsQuoteService;
  const repository = createBookingsRepositoryMock();
  const stripe = createStripeServiceMock();
  const admin = {
    findOneAdmin: jest.fn(),
    bookingContextLabel: jest.fn().mockReturnValue('Booking'),
  };
  const mail = {
    sendTransactional: jest.fn().mockResolvedValue({ ok: false }),
  };
  const adminActivityNotify = { notifyCustomerActivity: jest.fn() };
  const webhook = {
    markBookingPaymentPaid: jest.fn(),
    parseStripeCheckoutSession: jest.fn((x: unknown) => x),
  };
  const config = { get: jest.fn().mockReturnValue(undefined) };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        BookingsQuoteService,
        { provide: BookingsRepository, useValue: repository },
        { provide: MailService, useValue: mail },
        {
          provide: AdminCustomerActivityNotifyService,
          useValue: adminActivityNotify,
        },
        { provide: ConfigService, useValue: config },
        { provide: StripeService, useValue: stripe },
        { provide: BookingsAdminService, useValue: admin },
        { provide: BookingsWebhookService, useValue: webhook },
      ],
    }).compile();
    service = moduleRef.get(BookingsQuoteService);
  });

  it('createBookingQuote rejects fully paid booking', async () => {
    admin.findOneAdmin.mockResolvedValue(
      makeBookingWithRelations({
        status: BookingStatus.CONFIRMED,
        quoteModel: BookingQuotePaymentModel.FULL,
        balancePaidAt: null,
      }),
    );
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
});
