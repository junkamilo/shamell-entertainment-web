export function createUpcomingEventsServiceMock() {
  return {
    getPublicBySlug: jest.fn(),
    getPublicSessions: jest.fn(),
    getPublicVenueBundle: jest.fn(),
    getPublicClassOptions: jest.fn(),
    getClassSessionStatus: jest.fn(),
    reconcileClassFromStripeSession: jest.fn(),
    processClassStripeWebhookEvent: jest.fn(),
    processClassPackageStripeWebhookEvent: jest.fn(),
    processFixedStripeWebhookEvent: jest.fn(),
    listAdminSessions: jest.fn(),
    listAdminBookableClassEvents: jest.fn(),
  };
}

export type UpcomingEventsServiceMock = ReturnType<
  typeof createUpcomingEventsServiceMock
>;
