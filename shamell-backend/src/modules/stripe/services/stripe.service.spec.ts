import { InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import {
  STRIPE_DEFAULT_FRONTEND_URL,
  STRIPE_ENV_FRONTEND_URL,
  STRIPE_ENV_NODE_ENV,
  STRIPE_ENV_PUBLISHABLE_KEY,
  STRIPE_ENV_SECRET_KEY,
  STRIPE_ENV_WEBHOOK_SECRET,
} from '../constants/stripe.constants';
import { StripeService } from './stripe.service';

jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({ mocked: true }));
});

import Stripe from 'stripe';

describe('StripeService', () => {
  let service: StripeService;
  const configGet = jest.fn();

  async function compileService() {
    const moduleRef = await Test.createTestingModule({
      providers: [
        StripeService,
        { provide: ConfigService, useValue: { get: configGet } },
      ],
    }).compile();
    return moduleRef.get(StripeService);
  }

  beforeEach(() => {
    jest.clearAllMocks();
    configGet.mockImplementation((key: string) => {
      if (key === STRIPE_ENV_SECRET_KEY) return 'sk_test_abc';
      if (key === STRIPE_ENV_WEBHOOK_SECRET) return 'whsec_test';
      if (key === STRIPE_ENV_PUBLISHABLE_KEY) return 'pk_test_abc';
      if (key === STRIPE_ENV_FRONTEND_URL) return 'https://app.example.com';
      if (key === STRIPE_ENV_NODE_ENV) return 'development';
      return undefined;
    });
  });

  it('frontendUrl returns configured URL first origin', async () => {
    configGet.mockImplementation((key: string) => {
      if (key === STRIPE_ENV_FRONTEND_URL) {
        return 'https://app.example.com,https://other.example.com';
      }
      return undefined;
    });
    service = await compileService();
    expect(service.frontendUrl()).toBe('https://app.example.com');
  });

  it('frontendUrl falls back to default when unset', async () => {
    configGet.mockReturnValue(undefined);
    service = await compileService();
    expect(service.frontendUrl()).toBe(STRIPE_DEFAULT_FRONTEND_URL);
  });

  it('client lazily constructs Stripe with secret key', async () => {
    service = await compileService();
    const client = service.client;
    expect(Stripe).toHaveBeenCalledWith('sk_test_abc');
    expect(client).toEqual({ mocked: true });
    expect(service.client).toBe(client);
  });

  it('client throws when secret key missing', async () => {
    configGet.mockReturnValue(undefined);
    service = await compileService();
    expect(() => service.client).toThrow(InternalServerErrorException);
  });

  it('webhookSecret returns configured secret', async () => {
    service = await compileService();
    expect(service.webhookSecret).toBe('whsec_test');
  });

  it('webhookSecret throws when missing', async () => {
    configGet.mockImplementation((key: string) => {
      if (key === STRIPE_ENV_SECRET_KEY) return 'sk_test_abc';
      return undefined;
    });
    service = await compileService();
    expect(() => service.webhookSecret).toThrow(InternalServerErrorException);
  });

  it('onModuleInit rejects test secret in production', async () => {
    configGet.mockImplementation((key: string) => {
      if (key === STRIPE_ENV_SECRET_KEY) return 'sk_test_abc';
      if (key === STRIPE_ENV_NODE_ENV) return 'production';
      if (key === STRIPE_ENV_PUBLISHABLE_KEY) return 'pk_live_abc';
      if (key === STRIPE_ENV_WEBHOOK_SECRET) return 'whsec_test';
      return undefined;
    });
    await expect(
      compileService().then((s) => s.onModuleInit()),
    ).rejects.toThrow(/test-mode while NODE_ENV=production/);
  });
});
