import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerGuard } from '@nestjs/throttler';
import { MailModule } from '../mail/mail.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { BookingsModule } from '../bookings/bookings.module';
import { AdminJwtGuard } from '../contact/guards/admin-jwt.guard';
import { FloorLayoutModule } from '../floor-layout/floor-layout.module';
import { StripeModule } from '../stripe/stripe.module';
import { StripeWebhookController } from './stripe-webhook.controller';
import { VenueReservationsController } from './venue-reservations.controller';
import { VenueReservationsService } from './venue-reservations.service';

@Module({
  imports: [
    PrismaModule,
    BookingsModule,
    MailModule,
    StripeModule,
    FloorLayoutModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? 'change-me-in-production',
      signOptions: {
        expiresIn: (process.env.JWT_EXPIRES_IN ?? '7d') as never,
      },
    }),
  ],
  controllers: [VenueReservationsController, StripeWebhookController],
  providers: [VenueReservationsService, AdminJwtGuard, ThrottlerGuard],
})
export class VenueReservationsModule {}
