import { BadRequestException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { StripeWebhookDispatchService } from './stripe-webhook-dispatch.service';
import { StripeWebhookAuditService } from '../stripe/stripe-webhook-audit.service';
import { StripeService } from '../stripe/stripe.service';
import { BookingsService } from '../bookings/bookings.service';
import { UpcomingEventsService } from '../upcoming-events/upcoming-events.service';
import { VenueReservationsService } from './venue-reservations.service';

describe('StripeWebhookDispatchService', () => {
  let service: StripeWebhookDispatchService;
  const constructEvent = jest.fn();
  const isProcessed = jest.fn().mockResolvedValue(false);

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        StripeWebhookDispatchService,
        {
          provide: StripeService,
          useValue: {
            webhookSecret: 'whsec_test',
            client: {
              webhooks: { constructEvent },
              events: { retrieve: jest.fn() },
            },
          },
        },
        {
          provide: StripeWebhookAuditService,
          useValue: {
            isProcessed,
            trackAttempt: jest.fn(),
            markProcessing: jest.fn(),
            markProcessed: jest.fn(),
            markFailed: jest.fn(),
          },
        },
        {
          provide: BookingsService,
          useValue: { processStripeWebhookEvent: jest.fn() },
        },
        {
          provide: UpcomingEventsService,
          useValue: {
            processClassStripeWebhookEvent: jest.fn(),
            processClassPackageStripeWebhookEvent: jest.fn(),
            processFixedStripeWebhookEvent: jest.fn(),
          },
        },
        {
          provide: VenueReservationsService,
          useValue: { processStripeWebhookEvent: jest.fn() },
        },
      ],
    }).compile();

    service = moduleRef.get(StripeWebhookDispatchService);
  });

  it('rejects missing stripe-signature header', async () => {
    await expect(service.handle(Buffer.from('{}'), undefined)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('rejects test-mode events in production', async () => {
    const previous = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    constructEvent.mockReturnValue({
      id: 'evt_test',
      type: 'checkout.session.completed',
      livemode: false,
      data: { object: {} },
    });

    await expect(
      service.handle(Buffer.from('{}'), 'sig_test'),
    ).rejects.toThrow('Test-mode Stripe events are not accepted in production.');

    process.env.NODE_ENV = previous;
  });

  it('returns deduplicated when event already processed', async () => {
    isProcessed.mockResolvedValueOnce(true);
    constructEvent.mockReturnValue({
      id: 'evt_dup',
      type: 'checkout.session.completed',
      livemode: true,
      data: { object: {} },
    });

    await expect(
      service.handle(Buffer.from('{}'), 'sig_test'),
    ).resolves.toEqual({ received: true, deduplicated: true });
  });
});
