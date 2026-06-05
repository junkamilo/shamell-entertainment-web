import { Module } from '@nestjs/common';
import { AdminCustomerActivityNotifyService } from './admin-customer-activity-notify.service';
import { AdminPaymentNotifyService } from './admin-payment-notify.service';
import { MailService } from './mail.service';

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
