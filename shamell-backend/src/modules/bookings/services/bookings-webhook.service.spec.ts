import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { MailService } from '../../mail/services/mail.service';
import { AdminPaymentNotifyService } from '../../mail/services/admin-payment-notify.service';
import { StripeService } from '../../stripe/services/stripe.service';
import { createBookingsRepositoryMock } from '../__mocks__/bookings.repository.mock';
import { createStripeServiceMock } from '../../stripe/__mocks__/stripe.service.mock';
import { BookingsAdminService } from './bookings-admin.service';
import { BookingsRepository } from './bookings.repository';
import { BookingsWebhookService } from './bookings-webhook.service';

describe('BookingsWebhookService', () => {
  let service: BookingsWebhookService;
  const repository = createBookingsRepositoryMock();
  const stripe = createStripeServiceMock();
  const admin = {
    bookingContextLabel: jest.fn().mockReturnValue('Booking'),
    bookingEventDateLabel: jest.fn(),
  };
  const mail = { sendTransactional: jest.fn() };
  const adminPaymentNotify = { notifyPaymentOutcome: jest.fn() };
  const config = { get: jest.fn().mockReturnValue(undefined) };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        BookingsWebhookService,
        { provide: BookingsRepository, useValue: repository },
        { provide: MailService, useValue: mail },
        { provide: AdminPaymentNotifyService, useValue: adminPaymentNotify },
        { provide: ConfigService, useValue: config },
        { provide: StripeService, useValue: stripe },
        { provide: BookingsAdminService, useValue: admin },
      ],
    }).compile();
    service = moduleRef.get(BookingsWebhookService);
  });

  it('processStripeWebhookEvent ignores non-booking flow', async () => {
    await expect(
      service.processStripeWebhookEvent({
        id: 'evt_1',
        type: 'checkout.session.completed',
        data: { object: { metadata: { flow: 'venue' } } },
      }),
    ).resolves.toEqual({ received: true, handled: false });
  });

  it('parseStripeCheckoutSession rejects non-object', () => {
    expect(() => service.parseStripeCheckoutSession(null)).toThrow(
      BadRequestException,
    );
  });

  it('handleBookingPaymentsWebhook requires signature', async () => {
    await expect(
      service.handleBookingPaymentsWebhook(Buffer.from('x'), undefined),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
