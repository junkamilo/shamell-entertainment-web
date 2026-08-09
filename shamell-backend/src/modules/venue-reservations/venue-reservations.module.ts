import { Module } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { PrismaModule } from '../../prisma/prisma.module';
import { BookingsModule } from '../bookings/bookings.module';
import { FloorLayoutModule } from '../floor-layout/floor-layout.module';
import { MailModule } from '../mail/mail.module';
import { StripeModule } from '../stripe/stripe.module';
import { UpcomingEventsModule } from '../upcoming-events/upcoming-events.module';
import { StripeWebhookController } from './controllers/stripe-webhook.controller';
import { VenueReservationsController } from './controllers/venue-reservations.controller';
import { StripeWebhookDispatchService } from './services/stripe-webhook-dispatch.service';
import { StripeWebhookRetryService } from './services/stripe-webhook-retry.service';
import { VenueReservationsRepository } from './services/venue-reservations.repository';
import { VenueReservationsService } from './services/venue-reservations.service';

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
    VenueReservationsRepository,
    VenueReservationsService,
    StripeWebhookDispatchService,
    StripeWebhookRetryService,
    ThrottlerGuard,
  ],
})
export class VenueReservationsModule {}
