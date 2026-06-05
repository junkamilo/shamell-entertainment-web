import {
  BadRequestException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { BookingsService } from '../bookings/bookings.service';
import { UpcomingEventsService } from '../upcoming-events/upcoming-events.service';
import { StripeWebhookAuditService } from '../stripe/stripe-webhook-audit.service';
import { StripeService } from '../stripe/stripe.service';
import {
  buildWebhookPayloadSummary,
  checkoutSessionFlow,
  parseCheckoutSession,
  type StripeWebhookEventLite,
} from '../stripe/stripe-webhook.types';
import { VenueReservationsService } from './venue-reservations.service';

@Injectable()
export class StripeWebhookDispatchService {
  private readonly logger = new Logger(StripeWebhookDispatchService.name);

  constructor(
    private readonly stripeService: StripeService,
    private readonly audit: StripeWebhookAuditService,
    private readonly bookingsService: BookingsService,
    private readonly upcomingEventsService: UpcomingEventsService,
    private readonly venueReservationsService: VenueReservationsService,
  ) {}

  async handle(rawBody: Buffer, signature: string | undefined) {
    if (!signature) {
      throw new BadRequestException('Missing stripe-signature header.');
    }

    let event: StripeWebhookEventLite;
    try {
      event = this.stripeService.client.webhooks.constructEvent(
        rawBody,
        signature,
        this.stripeService.webhookSecret,
      ) as StripeWebhookEventLite;
    } catch (err) {
      this.logger.warn(
        `stripe-webhook-invalid-signature reason=${err instanceof Error ? err.message : String(err)}`,
      );
      throw new BadRequestException('Invalid stripe-signature header.');
    }

    if (await this.audit.isProcessed(event.id)) {
      this.logger.log(
        `stripe-webhook-duplicate eventId=${event.id} type=${event.type}`,
      );
      return { received: true, deduplicated: true };
    }

    const sessionObj =
      event.type === 'checkout.session.completed' ||
      event.type === 'checkout.session.expired'
        ? parseCheckoutSession(event.data.object)
        : null;
    const flow = checkoutSessionFlow(sessionObj);
    const checkoutSessionId = sessionObj?.id?.trim() ?? null;

    await this.audit.trackAttempt(event, {
      metadataFlow: flow,
      checkoutSessionId,
      payloadSummary: buildWebhookPayloadSummary(event, sessionObj),
    });

    try {
      let handler = 'unhandled';
      let handled = false;

      if (flow === 'booking_quote') {
        handler = 'booking_quote';
        await this.audit.markProcessing(event.id, handler);
        const result =
          await this.bookingsService.processStripeWebhookEvent(event);
        handled = result.handled;
      } else if (flow === 'class_session') {
        handler = 'class_session';
        await this.audit.markProcessing(event.id, handler);
        const result =
          await this.upcomingEventsService.processClassStripeWebhookEvent(event);
        handled = result.handled;
      } else if (
        flow === 'class_package' ||
        flow === 'class_session_bundle' ||
        flow === 'class_month_package'
      ) {
        handler = flow;
        await this.audit.markProcessing(event.id, handler);
        const result =
          await this.upcomingEventsService.processClassPackageStripeWebhookEvent(
            event,
          );
        handled = result.handled;
      } else if (flow === 'fixed_event_ticket') {
        handler = 'fixed_event_ticket';
        await this.audit.markProcessing(event.id, handler);
        const result =
          await this.upcomingEventsService.processFixedStripeWebhookEvent(event);
        handled = result.handled;
      } else if (flow === 'venue_seat') {
        handler = 'venue_seat';
        await this.audit.markProcessing(event.id, handler);
        const result =
          await this.venueReservationsService.processStripeWebhookEvent(event);
        handled = result.received === true;
      }

      if (!handled) {
        this.logger.warn(
          `stripe-webhook-not-handled eventId=${event.id} flow=${flow ?? 'none'} type=${event.type} checkoutSessionId=${checkoutSessionId ?? 'none'}`,
        );
        throw new BadRequestException(
          `Unhandled Stripe webhook flow=${flow ?? 'none'} type=${event.type}`,
        );
      }

      this.logger.log(
        `stripe-webhook-processed eventId=${event.id} flow=${flow ?? 'none'} checkoutSessionId=${checkoutSessionId ?? 'none'} handler=${handler}`,
      );
      await this.audit.markProcessed(event.id);

      return { received: true, handler, deduplicated: false };
    } catch (err) {
      await this.audit.markFailed(event.id, err);
      throw err;
    }
  }
}
