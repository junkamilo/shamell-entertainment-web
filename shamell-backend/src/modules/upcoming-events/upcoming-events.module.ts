import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerGuard } from '@nestjs/throttler';
import { AdminJwtGuard } from '../contact/guards/admin-jwt.guard';
import { MailModule } from '../mail/mail.module';
import { StripeModule } from '../stripe/stripe.module';
import { ReservationEventTemplatesModule } from '../reservation-event-templates/reservation-event-templates.module';
import { UpcomingEventsController } from './upcoming-events.controller';
import { UpcomingEventsService } from './upcoming-events.service';

@Module({
  imports: [
    ReservationEventTemplatesModule,
    StripeModule,
    MailModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? 'change-me-in-production',
      signOptions: {
        expiresIn: (process.env.JWT_EXPIRES_IN ?? '7d') as never,
      },
    }),
  ],
  controllers: [UpcomingEventsController],
  providers: [UpcomingEventsService, AdminJwtGuard, ThrottlerGuard],
  exports: [UpcomingEventsService],
})
export class UpcomingEventsModule {}
