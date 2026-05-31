import {
  BadRequestException,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  Req,
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';
import { BookingsService } from '../bookings/bookings.service';
import { UpcomingEventsService } from '../upcoming-events/upcoming-events.service';
import { VenueReservationsService } from './venue-reservations.service';

@Controller('stripe')
export class StripeWebhookController {
  constructor(
    private readonly bookingsService: BookingsService,
    private readonly upcomingEventsService: UpcomingEventsService,
    private readonly venueReservationsService: VenueReservationsService,
  ) {}

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature?: string,
  ) {
    const rawBody = req.rawBody;
    if (!rawBody) {
      throw new BadRequestException(
        'Raw body is required for Stripe webhook verification.',
      );
    }
    return this.bookingsService
      .handleBookingPaymentsWebhook(rawBody, signature)
      .then((result) => {
        if (result.handled) return result;
        return this.upcomingEventsService
          .handleClassWebhook(rawBody, signature)
          .then(async (classResult) => {
            if (classResult.handled) {
              return {
                received: true,
                deduplicated: classResult.deduplicated === true,
              };
            }
            return this.upcomingEventsService
              .handleFixedEventTicketWebhook(rawBody, signature)
              .then(async (fixedResult) => {
                if (fixedResult.handled) {
                  return {
                    received: true,
                    deduplicated: fixedResult.deduplicated === true,
                  };
                }
                return this.venueReservationsService.handleWebhookEvent(
                  rawBody,
                  signature,
                );
              });
          });
      });
  }
}
