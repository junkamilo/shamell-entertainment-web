// src/modules/contact/contact.module.ts
import { Module } from '@nestjs/common';
import { AvailabilityModule } from '../availability/availability.module';
import { BookingsModule } from '../bookings/bookings.module';
import { MailModule } from '../mail/mail.module';
import { ContactController } from './contact.controller';
import { ContactInboxService } from './contact-inbox.service';
import { ContactService } from './contact.service';

@Module({
  imports: [AvailabilityModule, BookingsModule, MailModule],
  controllers: [ContactController],
  providers: [ContactInboxService, ContactService],
  exports: [ContactInboxService],
})
export class ContactModule {}
