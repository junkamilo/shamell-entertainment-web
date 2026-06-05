import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AdminJwtGuard } from '../contact/guards/admin-jwt.guard';
import { AdminStripeWebhooksController } from './admin-stripe-webhooks.controller';
import { AdminStripeWebhooksService } from './admin-stripe-webhooks.service';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? 'change-me-in-production',
    }),
  ],
  controllers: [AdminStripeWebhooksController],
  providers: [AdminStripeWebhooksService, AdminJwtGuard],
})
export class AdminStripeWebhooksModule {}
