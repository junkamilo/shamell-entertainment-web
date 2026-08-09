import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { StripeWebhookAuditService } from './services/stripe-webhook-audit.service';
import { StripeService } from './services/stripe.service';

@Module({
  imports: [PrismaModule],
  providers: [StripeService, StripeWebhookAuditService],
  exports: [StripeService, StripeWebhookAuditService],
})
export class StripeModule {}
