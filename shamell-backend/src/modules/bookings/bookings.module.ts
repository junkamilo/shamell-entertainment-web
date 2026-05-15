import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AvailabilityModule } from '../availability/availability.module';
import { AdminJwtGuard } from '../contact/guards/admin-jwt.guard';
import { MailModule } from '../mail/mail.module';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? 'change-me-in-production',
    }),
    AvailabilityModule,
    MailModule,
  ],
  controllers: [BookingsController],
  providers: [BookingsService, AdminJwtGuard],
  exports: [BookingsService],
})
export class BookingsModule {}
