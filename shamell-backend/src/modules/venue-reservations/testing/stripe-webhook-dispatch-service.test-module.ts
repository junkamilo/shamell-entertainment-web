import { Test, type TestingModule } from '@nestjs/testing';
import { BookingsService } from '../../bookings/services/bookings.service';
import { StripeWebhookAuditService } from '../../stripe/services/stripe-webhook-audit.service';
import { StripeService } from '../../stripe/services/stripe.service';
import { UpcomingEventsService } from '../../upcoming-events/services/upcoming-events.service';
import { StripeWebhookDispatchService } from '../services/stripe-webhook-dispatch.service';
import { VenueReservationsService } from '../services/venue-reservations.service';

export type StripeWebhookDispatchServiceTestHarness = {
  moduleRef: TestingModule;
  service: StripeWebhookDispatchService;
  constructEvent: jest.Mock;
  retrieveEvent: jest.Mock;
  audit: {
    isProcessed: jest.Mock;
    trackAttempt: jest.Mock;
    markProcessing: jest.Mock;
    markProcessed: jest.Mock;
    markFailed: jest.Mock;
  };
  bookings: { processStripeWebhookEvent: jest.Mock };
  upcoming: {
    processClassStripeWebhookEvent: jest.Mock;
    processClassPackageStripeWebhookEvent: jest.Mock;
    processFixedStripeWebhookEvent: jest.Mock;
  };
  venue: { processStripeWebhookEvent: jest.Mock };
};

export async function createStripeWebhookDispatchServiceTestModule(): Promise<StripeWebhookDispatchServiceTestHarness> {
  const constructEvent = jest.fn();
  const retrieveEvent = jest.fn();
  const audit = {
    isProcessed: jest.fn().mockResolvedValue(false),
    trackAttempt: jest.fn().mockResolvedValue(undefined),
    markProcessing: jest.fn().mockResolvedValue(undefined),
    markProcessed: jest.fn().mockResolvedValue(undefined),
    markFailed: jest.fn().mockResolvedValue(undefined),
  };
  const bookings = {
    processStripeWebhookEvent: jest.fn().mockResolvedValue({ handled: true }),
  };
  const upcoming = {
    processClassStripeWebhookEvent: jest
      .fn()
      .mockResolvedValue({ handled: true }),
    processClassPackageStripeWebhookEvent: jest
      .fn()
      .mockResolvedValue({ handled: true }),
    processFixedStripeWebhookEvent: jest
      .fn()
      .mockResolvedValue({ handled: true }),
  };
  const venue = {
    processStripeWebhookEvent: jest
      .fn()
      .mockResolvedValue({ received: true, handled: true }),
  };

  const moduleRef = await Test.createTestingModule({
    providers: [
      StripeWebhookDispatchService,
      {
        provide: StripeService,
        useValue: {
          webhookSecret: 'whsec_test',
          client: {
            webhooks: { constructEvent },
            events: { retrieve: retrieveEvent },
          },
        },
      },
      { provide: StripeWebhookAuditService, useValue: audit },
      { provide: BookingsService, useValue: bookings },
      { provide: UpcomingEventsService, useValue: upcoming },
      { provide: VenueReservationsService, useValue: venue },
    ],
  }).compile();

  return {
    moduleRef,
    service: moduleRef.get(StripeWebhookDispatchService),
    constructEvent,
    retrieveEvent,
    audit,
    bookings,
    upcoming,
    venue,
  };
}
