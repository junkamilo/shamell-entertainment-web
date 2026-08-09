export function createAdminStripeWebhooksServiceMock() {
  return {
    listEvents: jest.fn(),
    getEventByStripeId: jest.fn(),
  };
}

export type AdminStripeWebhooksServiceMock = ReturnType<
  typeof createAdminStripeWebhooksServiceMock
>;
