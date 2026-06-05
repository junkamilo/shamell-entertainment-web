import {
  Injectable,
  InternalServerErrorException,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

@Injectable()
export class StripeService implements OnModuleInit {
  private stripeClient: InstanceType<typeof Stripe> | null = null;
  private readonly logger = new Logger(StripeService.name);

  constructor(private readonly config: ConfigService) {}

  onModuleInit(): void {
    const key = this.config.get<string>('STRIPE_SECRET_KEY')?.trim() ?? '';
    const webhookSecret =
      this.config.get<string>('STRIPE_WEBHOOK_SECRET')?.trim() ?? '';
    const publishableKey =
      this.config.get<string>('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY')?.trim() ??
      '';
    const nodeEnv = (this.config.get<string>('NODE_ENV') ?? '').toLowerCase();
    const isProduction = nodeEnv === 'production';

    const keyLooksLive = /^s[kr]_live_/.test(key);
    const keyLooksTest = /^s[kr]_test_/.test(key);
    const publishableLooksLive = /^pk_live_/.test(publishableKey);
    const publishableLooksTest = /^pk_test_/.test(publishableKey);

    if (key && !keyLooksLive && !keyLooksTest) {
      this.logger.warn(
        'STRIPE_SECRET_KEY does not match expected sk_/rk_ live/test prefixes.',
      );
    }
    if (webhookSecret && !webhookSecret.startsWith('whsec_')) {
      this.logger.warn(
        'STRIPE_WEBHOOK_SECRET does not match expected whsec_ prefix.',
      );
    }

    if (isProduction && keyLooksTest) {
      throw new Error(
        'Unsafe Stripe configuration: STRIPE_SECRET_KEY is test-mode while NODE_ENV=production.',
      );
    }
    if (isProduction && publishableLooksTest) {
      throw new Error(
        'Unsafe Stripe configuration: NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is test-mode while NODE_ENV=production.',
      );
    }
    if (isProduction && !webhookSecret) {
      throw new Error(
        'Unsafe Stripe configuration: STRIPE_WEBHOOK_SECRET is required when NODE_ENV=production.',
      );
    }
    if (
      key &&
      publishableKey &&
      ((keyLooksLive && publishableLooksTest) ||
        (keyLooksTest && publishableLooksLive))
    ) {
      throw new Error(
        'Unsafe Stripe configuration: mixed live/test Stripe keys detected.',
      );
    }
  }

  get client(): InstanceType<typeof Stripe> {
    if (!this.stripeClient) {
      const secretKey = this.config.get<string>('STRIPE_SECRET_KEY');
      if (!secretKey) {
        throw new InternalServerErrorException(
          'STRIPE_SECRET_KEY is not configured.',
        );
      }
      this.stripeClient = new Stripe(secretKey);
    }
    return this.stripeClient;
  }

  get webhookSecret(): string {
    const secret = this.config.get<string>('STRIPE_WEBHOOK_SECRET');
    if (!secret) {
      throw new InternalServerErrorException(
        'STRIPE_WEBHOOK_SECRET is not configured.',
      );
    }
    return secret;
  }

  frontendUrl(): string {
    const url =
      this.config.get<string>('FRONTEND_URL') ?? 'http://localhost:3000';
    return url.split(',')[0]?.trim() || 'http://localhost:3000';
  }
}
