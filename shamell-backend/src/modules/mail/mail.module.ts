import { Module } from '@nestjs/common';
import { AdminCustomerActivityNotifyService } from './services/admin-customer-activity-notify.service';
import { AdminPaymentNotifyService } from './services/admin-payment-notify.service';
import { MailService } from './services/mail.service';

@Module({
  providers: [
    MailService,
    AdminPaymentNotifyService,
    AdminCustomerActivityNotifyService,
  ],
  exports: [
    MailService,
    AdminPaymentNotifyService,
    AdminCustomerActivityNotifyService,
  ],
})
export class MailModule {}
