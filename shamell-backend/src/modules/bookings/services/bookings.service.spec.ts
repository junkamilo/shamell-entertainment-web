import { Test } from '@nestjs/testing';
import { BookingsAdminService } from './bookings-admin.service';
import { BookingsInquiryService } from './bookings-inquiry.service';
import { BookingsPrivateClassService } from './bookings-private-class.service';
import { BookingsQuoteService } from './bookings-quote.service';
import { BookingsWebhookService } from './bookings-webhook.service';
import { BookingsService } from './bookings.service';
import { makeOccupiedPayload } from '../__mocks__/bookings.fixtures';

describe('BookingsService facade', () => {
  let service: BookingsService;
  const admin = {
    getPublicOccupiedByDate: jest.fn(),
    createAdminBooking: jest.fn(),
    findAllAdmin: jest.fn(),
    findCalendarAdmin: jest.fn(),
    findOneAdmin: jest.fn(),
    updateAdmin: jest.fn(),
    removeAdmin: jest.fn(),
  };
  const inquiry = {
    notifyBookingCreated: jest.fn(),
    preparePublicBookingInquiry: jest.fn(),
    insertPublicBookingInquiry: jest.fn(),
    createFromPublicBookingInquiry: jest.fn(),
  };
  const quote = {
    createBookingQuote: jest.fn(),
    sendBookingBalanceLink: jest.fn(),
    resolveQuotePayUrl: jest.fn(),
    resolveQuoteCheckoutClientSecret: jest.fn(),
    getQuotePaymentSessionStatus: jest.fn(),
  };
  const webhook = {
    handleBookingPaymentsWebhook: jest.fn(),
    processStripeWebhookEvent: jest.fn(),
  };
  const privateClass = {
    createCash: jest.fn(),
    createCheckoutSession: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        BookingsService,
        { provide: BookingsAdminService, useValue: admin },
        { provide: BookingsInquiryService, useValue: inquiry },
        { provide: BookingsQuoteService, useValue: quote },
        { provide: BookingsWebhookService, useValue: webhook },
        { provide: BookingsPrivateClassService, useValue: privateClass },
      ],
    }).compile();
    service = moduleRef.get(BookingsService);
  });

  it('getPublicOccupiedByDate delegates to admin', async () => {
    const payload = makeOccupiedPayload();
    admin.getPublicOccupiedByDate.mockResolvedValue(payload);
    await expect(
      service.getPublicOccupiedByDate('2026-07-15'),
    ).resolves.toEqual(payload);
  });

  it('processStripeWebhookEvent delegates to webhook', async () => {
    webhook.processStripeWebhookEvent.mockResolvedValue({
      received: true,
      handled: true,
    });
    await expect(
      service.processStripeWebhookEvent({
        id: 'evt_1',
        type: 'checkout.session.completed',
        data: { object: {} },
      }),
    ).resolves.toEqual({ received: true, handled: true });
  });

  it('createPrivateClassCash delegates', async () => {
    privateClass.createCash.mockResolvedValue({
      bookingId: 'b-1',
      message: 'ok',
    });
    await expect(
      service.createPrivateClassCash('admin-1', {} as never),
    ).resolves.toEqual({ bookingId: 'b-1', message: 'ok' });
  });
});
