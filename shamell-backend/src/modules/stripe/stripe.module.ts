import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { StripeWebhookAuditService } from './stripe-webhook-audit.service';
import { StripeService } from './stripe.service';

@Module({
  imports: [PrismaModule],
  providers: [StripeService, StripeWebhookAuditService],
  exports: [StripeService, StripeWebhookAuditService],
})
export class StripeModule {}
