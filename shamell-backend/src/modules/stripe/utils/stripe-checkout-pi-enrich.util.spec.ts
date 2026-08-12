import {
  attachPaymentIntentCheckoutMetadata,
  buildCheckoutCorrelationMetadata,
  resolvePaymentIntentIdForCheckoutSession,
  type StripeCheckoutPiClient,
} from './stripe-checkout-pi-enrich.util';

function makeClient(
  overrides: Partial<{
    retrieve: jest.Mock;
    search: jest.Mock;
    update: jest.Mock;
  }> = {},
): StripeCheckoutPiClient {
  return {
    checkout: {
      sessions: {
        retrieve:
          overrides.retrieve ??
          jest.fn().mockResolvedValue({ payment_intent: null }),
      },
    },
    paymentIntents: {
      search: overrides.search ?? jest.fn().mockResolvedValue({ data: [] }),
      update: overrides.update ?? jest.fn().mockResolvedValue({}),
    },
  };
}

describe('stripe-checkout-pi-enrich.util', () => {
  it('buildCheckoutCorrelationMetadata adds uuid correlationId', () => {
    const { correlationId, metadata } = buildCheckoutCorrelationMetadata({
      flow: 'booking_quote',
    });
    expect(correlationId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
    expect(metadata).toEqual({
      flow: 'booking_quote',
      correlationId,
    });
  });

  it('resolvePaymentIntentIdForCheckoutSession prefers session PI id', async () => {
    const client = makeClient();
    await expect(
      resolvePaymentIntentIdForCheckoutSession(client, {
        checkoutSessionId: 'cs_1',
        paymentIntentFromSession: 'pi_from_session',
        correlationId: 'corr-1',
      }),
    ).resolves.toBe('pi_from_session');
    expect(client.checkout.sessions.retrieve).not.toHaveBeenCalled();
  });

  it('resolvePaymentIntentIdForCheckoutSession falls back to search', async () => {
    const search = jest.fn().mockResolvedValue({
      data: [{ id: 'pi_from_search' }],
    });
    const client = makeClient({ search });
    await expect(
      resolvePaymentIntentIdForCheckoutSession(client, {
        checkoutSessionId: 'cs_1',
        paymentIntentFromSession: null,
        correlationId: 'corr-search',
      }),
    ).resolves.toBe('pi_from_search');
    expect(search).toHaveBeenCalledWith({
      query: 'metadata["correlationId"]:"corr-search"',
      limit: 1,
    });
  });

  it('attachPaymentIntentCheckoutMetadata merges checkoutSessionId', async () => {
    const update = jest.fn().mockResolvedValue({});
    const client = makeClient({ update });
    await attachPaymentIntentCheckoutMetadata(client, {
      paymentIntentId: 'pi_1',
      checkoutSessionId: 'cs_1',
      metadata: { flow: 'booking_quote', correlationId: 'corr-1' },
    });
    expect(update).toHaveBeenCalledWith('pi_1', {
      metadata: {
        flow: 'booking_quote',
        correlationId: 'corr-1',
        checkoutSessionId: 'cs_1',
      },
    });
  });
});
