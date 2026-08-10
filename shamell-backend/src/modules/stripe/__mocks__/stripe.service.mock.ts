export function createStripeServiceMock() {
  return {
    frontendUrl: jest.fn().mockReturnValue('https://example.com'),
    webhookSecret: 'whsec_test',
    client: {
      checkout: {
        sessions: {
          create: jest.fn(),
          retrieve: jest.fn(),
          update: jest.fn(),
        },
      },
      webhooks: {
        constructEvent: jest.fn(),
      },
      events: {
        retrieve: jest.fn(),
      },
      paymentIntents: {
        retrieve: jest.fn(),
      },
    },
  };
}

export type StripeServiceMock = ReturnType<typeof createStripeServiceMock>;
