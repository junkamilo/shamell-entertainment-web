import { Module } from '@nestjs/common';
import { MailModule } from '../mail/mail.module';
import { RecaptchaVerifier } from '../contact/services/recaptcha.verifier';
import { EmailVerificationController } from './controllers/email-verification.controller';
import { EmailVerificationService } from './services/email-verification.service';

@Module({
  imports: [MailModule],
  controllers: [EmailVerificationController],
  providers: [EmailVerificationService, RecaptchaVerifier],
  exports: [EmailVerificationService],
})
export class EmailVerificationModule {}
