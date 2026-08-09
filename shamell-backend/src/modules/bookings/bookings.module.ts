import { Module } from '@nestjs/common';
import { AvailabilityModule } from '../availability/availability.module';
import { MailModule } from '../mail/mail.module';
import { StripeModule } from '../stripe/stripe.module';
import { BookingsController } from './controllers/bookings.controller';
import { BookingsAdminService } from './services/bookings-admin.service';
import { BookingsInquiryService } from './services/bookings-inquiry.service';
import { BookingsPrivateClassService } from './services/bookings-private-class.service';
import { BookingsQuoteService } from './services/bookings-quote.service';
import { BookingsRepository } from './services/bookings.repository';
import { BookingsWebhookService } from './services/bookings-webhook.service';
import { BookingsService } from './services/bookings.service';

@Module({
  imports: [AvailabilityModule, MailModule, StripeModule],
  controllers: [BookingsController],
  providers: [
    BookingsRepository,
    BookingsAdminService,
    BookingsInquiryService,
    BookingsQuoteService,
    BookingsPrivateClassService,
    BookingsWebhookService,
    BookingsService,
  ],
  exports: [BookingsService],
})
export class BookingsModule {}
