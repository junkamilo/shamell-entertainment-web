import { Module } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { MailModule } from '../mail/mail.module';
import { ReservationEventTemplatesModule } from '../reservation-event-templates/reservation-event-templates.module';
import { StripeModule } from '../stripe/stripe.module';
import { AdminClassEnrollmentService } from './admin-class-enrollment.service';
import { AdminFixedEventEnrollmentService } from './admin-fixed-event-enrollment.service';
import { UpcomingEventsController } from './upcoming-events.controller';
import { UpcomingEventsService } from './upcoming-events.service';

@Module({
  imports: [ReservationEventTemplatesModule, StripeModule, MailModule],
  controllers: [UpcomingEventsController],
  providers: [
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
