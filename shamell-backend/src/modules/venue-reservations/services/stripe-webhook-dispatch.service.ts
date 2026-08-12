import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { logCaughtError } from '../../../common/http/utils/log-caught-error.util';
import { BookingsService } from '../../bookings/services/bookings.service';
import { UpcomingEventsService } from '../../upcoming-events/services/upcoming-events.service';
import { StripeWebhookAuditService } from '../../stripe/services/stripe-webhook-audit.service';
import { StripeService } from '../../stripe/services/stripe.service';
import { Prisma } from '@prisma/client';
import {
  buildWebhookEventPayload,
  buildWebhookPayloadSummary,
  isStripeAuditOnlyEventType,
  isStripeCheckoutBusinessEventType,
  parseCheckoutSession,
  redactStripePayload,
  resolveWebhookCheckoutSessionId,
  resolveWebhookMetadataFlow,
  resolveWebhookPurchaseCorrelationId,
  type StripeWebhookEventLite,
} from '../../stripe/types/stripe-webhook.types';
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
    const nodeEnv = process.env.NODE_ENV ?? 'development';

    try {
      event = this.stripeService.client.webhooks.constructEvent(
        rawBody,
        signature,
        this.stripeService.webhookSecret,
      );
    } catch (err) {
      logCaughtError(this.logger, err, {
        op: 'stripe.webhook.invalid_signature',
        level: 'warn',
      });
      throw new BadRequestException('Invalid stripe-signature header.');
    }

    if (nodeEnv === 'production' && event.livemode === false) {
      this.logger.warn(
        `stripe-webhook-test-mode-rejected eventId=${event.id} type=${event.type}`,
      );
      throw new BadRequestException(
        'Test-mode Stripe events are not accepted in production.',
      );
    }

    if (await this.audit.isProcessed(event.id)) {
      this.logger.log(
        `stripe-webhook-duplicate eventId=${event.id} type=${event.type}`,
      );
      return { received: true, deduplicated: true };
    }

    return this.processVerifiedEvent(event);
  }

  async reprocessFromStripeEventId(eventId: string): Promise<boolean> {
    if (await this.audit.isProcessed(eventId)) {
      return false;
    }
    const event = (await this.stripeService.client.events.retrieve(
      eventId,
    )) as StripeWebhookEventLite;
    await this.processVerifiedEvent(event);
    return true;
  }

  private async processVerifiedEvent(event: StripeWebhookEventLite) {
    const sessionObj = isStripeCheckoutBusinessEventType(event.type)
      ? parseCheckoutSession(event.data.object)
      : null;
    const flow = resolveWebhookMetadataFlow(event, sessionObj);
    const checkoutSessionId = resolveWebhookCheckoutSessionId(
      event,
      sessionObj,
    );
    const purchaseCorrelationId = resolveWebhookPurchaseCorrelationId(
      event,
      sessionObj,
      checkoutSessionId,
    );
    const payloadSummary = buildWebhookPayloadSummary(event, sessionObj);
    const payload = redactStripePayload(
      buildWebhookEventPayload(event),
    ) as Prisma.InputJsonValue;

    await this.audit.trackAttempt(event, {
      metadataFlow: flow,
      checkoutSessionId,
      purchaseCorrelationId,
      payloadSummary,
      payload,
    });

    try {
      if (isStripeAuditOnlyEventType(event.type)) {
        const handler = 'audit_only';
        await this.audit.markProcessing(event.id, handler);
        await this.audit.markProcessed(event.id);
        this.logger.log(
          `stripe-webhook-audit-only eventId=${event.id} type=${event.type} checkoutSessionId=${checkoutSessionId ?? 'none'}`,
        );
        return { received: true, handler, deduplicated: false };
      }

      if (!isStripeCheckoutBusinessEventType(event.type)) {
        this.logger.warn(
          `stripe-webhook-not-handled eventId=${event.id} flow=${flow ?? 'none'} type=${event.type} checkoutSessionId=${checkoutSessionId ?? 'none'}`,
        );
        throw new BadRequestException(
          `Unhandled Stripe webhook flow=${flow ?? 'none'} type=${event.type}`,
        );
      }

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
          await this.upcomingEventsService.processClassStripeWebhookEvent(
            event,
          );
        handled = result.handled;
      } else if (
        flow === 'class_package' ||
        flow === 'class_session_bundle' ||
        flow === 'class_session_cart' ||
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
          await this.upcomingEventsService.processFixedStripeWebhookEvent(
            event,
          );
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
