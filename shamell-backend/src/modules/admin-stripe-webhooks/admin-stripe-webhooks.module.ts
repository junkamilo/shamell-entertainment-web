import { Module } from '@nestjs/common';
import { AdminStripeWebhooksController } from './controllers/admin-stripe-webhooks.controller';
import { AdminStripeWebhooksRepository } from './services/admin-stripe-webhooks.repository';
import { AdminStripeWebhooksService } from './services/admin-stripe-webhooks.service';

@Module({
  controllers: [AdminStripeWebhooksController],
  providers: [AdminStripeWebhooksRepository, AdminStripeWebhooksService],
})
export class AdminStripeWebhooksModule {}
