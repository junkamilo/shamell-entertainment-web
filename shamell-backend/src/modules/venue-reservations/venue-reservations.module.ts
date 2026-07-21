import { Module } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { PrismaModule } from '../../prisma/prisma.module';
import { BookingsModule } from '../bookings/bookings.module';
import { FloorLayoutModule } from '../floor-layout/floor-layout.module';
import { MailModule } from '../mail/mail.module';
import { StripeModule } from '../stripe/stripe.module';
import { UpcomingEventsModule } from '../upcoming-events/upcoming-events.module';
import { StripeWebhookController } from './stripe-webhook.controller';
import { StripeWebhookDispatchService } from './stripe-webhook-dispatch.service';
import { StripeWebhookRetryService } from './stripe-webhook-retry.service';
import { VenueReservationsController } from './venue-reservations.controller';
import { VenueReservationsService } from './venue-reservations.service';

@Module({
  imports: [
    PrismaModule,
    BookingsModule,
    MailModule,
    StripeModule,
    FloorLayoutModule,
    UpcomingEventsModule,
  ],
  controllers: [VenueReservationsController, StripeWebhookController],
  providers: [
    VenueReservationsService,
    StripeWebhookDispatchService,
    StripeWebhookRetryService,
    ThrottlerGuard,
  ],
})
export class VenueReservationsModule {}
