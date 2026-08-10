import { BadRequestException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { StripeWebhookDispatchService } from '../services/stripe-webhook-dispatch.service';
import { StripeWebhookController } from './stripe-webhook.controller';

describe('StripeWebhookController', () => {
  let controller: StripeWebhookController;
  const dispatch = {
    handle: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      controllers: [StripeWebhookController],
      providers: [
        { provide: StripeWebhookDispatchService, useValue: dispatch },
      ],
    }).compile();
    controller = moduleRef.get(StripeWebhookController);
  });

  it('rejects requests without rawBody', () => {
    expect(() => controller.handleWebhook({} as never, 'sig_test')).toThrow(
      BadRequestException,
    );
    expect(dispatch.handle).not.toHaveBeenCalled();
  });

  it('delegates to dispatch.handle with rawBody and signature', async () => {
    const rawBody = Buffer.from('{"id":"evt_1"}');
    dispatch.handle.mockResolvedValue({ received: true });
    await expect(
      controller.handleWebhook({ rawBody } as never, 'sig_test'),
    ).resolves.toEqual({ received: true });
    expect(dispatch.handle).toHaveBeenCalledWith(rawBody, 'sig_test');
  });
});
