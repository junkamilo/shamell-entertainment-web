import { Module } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { GalleryModule } from '../gallery/gallery.module';
import { MailModule } from '../mail/mail.module';
import { ReservationEventTemplatesModule } from '../reservation-event-templates/reservation-event-templates.module';
import { StripeModule } from '../stripe/stripe.module';
import { UpcomingEventsController } from './controllers/upcoming-events.controller';
import { AdminClassEnrollmentService } from './services/admin-class-enrollment.service';
import { AdminFixedEventEnrollmentService } from './services/admin-fixed-event-enrollment.service';
import { UpcomingEventsRepository } from './services/upcoming-events.repository';
import { UpcomingEventsService } from './services/upcoming-events.service';
import { UpcomingEventsPublicService } from './services/upcoming-events-public.service';
import { UpcomingEventsCheckoutService } from './services/upcoming-events-checkout.service';
import { UpcomingEventsWebhookService } from './services/upcoming-events-webhook.service';
import { UpcomingEventsAdminSessionsService } from './services/upcoming-events-admin-sessions.service';
import { UpcomingEventsVenueConfigService } from './services/upcoming-events-venue-config.service';
import { UpcomingFixedEventPackagesRepository } from './packages/upcoming-fixed-event-packages.repository';
import {
  UpcomingEventActivitiesService,
  UpcomingFixedEventPackagesService,
} from './packages/upcoming-fixed-event-packages.service';

@Module({
  imports: [
    GalleryModule,
    ReservationEventTemplatesModule,
    StripeModule,
    MailModule,
  ],
  controllers: [UpcomingEventsController],
  providers: [
    UpcomingEventsRepository,
    UpcomingFixedEventPackagesRepository,
    UpcomingEventActivitiesService,
    UpcomingFixedEventPackagesService,
    UpcomingEventsVenueConfigService,
    UpcomingEventsPublicService,
    UpcomingEventsCheckoutService,
    UpcomingEventsWebhookService,
    UpcomingEventsAdminSessionsService,
    UpcomingEventsService,
    AdminClassEnrollmentService,
    AdminFixedEventEnrollmentService,
    ThrottlerGuard,
  ],
  exports: [
    UpcomingEventsService,
    AdminClassEnrollmentService,
    AdminFixedEventEnrollmentService,
  ],
})
export class UpcomingEventsModule {}
