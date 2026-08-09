import { Module } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { MailModule } from '../mail/mail.module';
import { ReservationEventTemplatesModule } from '../reservation-event-templates/reservation-event-templates.module';
import { StripeModule } from '../stripe/stripe.module';
import { UpcomingEventsController } from './controllers/upcoming-events.controller';
import { AdminClassEnrollmentService } from './services/admin-class-enrollment.service';
import { AdminFixedEventEnrollmentService } from './services/admin-fixed-event-enrollment.service';
import { UpcomingEventsRepository } from './services/upcoming-events.repository';
import { UpcomingEventsService } from './services/upcoming-events.service';

@Module({
  imports: [ReservationEventTemplatesModule, StripeModule, MailModule],
  controllers: [UpcomingEventsController],
  providers: [
    UpcomingEventsRepository,
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
