import { Module } from '@nestjs/common';
import { AdminPaymentNotifyService } from './admin-payment-notify.service';
import { MailService } from './mail.service';

@Module({
  providers: [MailService, AdminPaymentNotifyService],
  exports: [MailService, AdminPaymentNotifyService],
})
export class MailModule {}
