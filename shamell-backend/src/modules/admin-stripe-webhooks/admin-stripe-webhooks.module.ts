import { Module } from '@nestjs/common';
import { AdminStripeWebhooksController } from './admin-stripe-webhooks.controller';
import { AdminStripeWebhooksService } from './admin-stripe-webhooks.service';

@Module({
  controllers: [AdminStripeWebhooksController],
  providers: [AdminStripeWebhooksService],
})
export class AdminStripeWebhooksModule {}
