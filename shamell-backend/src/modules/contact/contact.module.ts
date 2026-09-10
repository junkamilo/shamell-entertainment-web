import { Module } from '@nestjs/common';
import { AvailabilityModule } from '../availability/availability.module';
import { BookingsModule } from '../bookings/bookings.module';
import { MailModule } from '../mail/mail.module';
import { ContactController } from './controllers/contact.controller';
import { ContactInboxService } from './services/contact-inbox.service';
import { ContactRepository } from './services/contact.repository';
import { ContactService } from './services/contact.service';
import { RecaptchaVerifier } from './services/recaptcha.verifier';
import { EmailVerificationModule } from '../email-verification/email-verification.module';

@Module({
  imports: [
    AvailabilityModule,
    BookingsModule,
    MailModule,
    EmailVerificationModule,
  ],
  controllers: [ContactController],
  providers: [
    ContactRepository,
    ContactInboxService,
    RecaptchaVerifier,
    ContactService,
  ],
  exports: [ContactInboxService],
})
export class ContactModule {}
