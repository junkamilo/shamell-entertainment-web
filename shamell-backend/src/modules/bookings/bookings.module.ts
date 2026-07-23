import { Module } from '@nestjs/common';
import { AvailabilityModule } from '../availability/availability.module';
import { MailModule } from '../mail/mail.module';
import { StripeModule } from '../stripe/stripe.module';
import { BookingsController } from './bookings.controller';
import { BookingsAdminService } from './bookings-admin.service';
import { BookingsInquiryService } from './bookings-inquiry.service';
import { BookingsPrivateClassService } from './bookings-private-class.service';
import { BookingsQuoteService } from './bookings-quote.service';
import { BookingsWebhookService } from './bookings-webhook.service';
import { BookingsService } from './bookings.service';

@Module({
  imports: [AvailabilityModule, MailModule, StripeModule],
  controllers: [BookingsController],
  providers: [
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
