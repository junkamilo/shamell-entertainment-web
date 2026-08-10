export function createUpcomingEventsServiceMock() {
  return {
    getPublicBySlug: jest.fn(),
    listPublicSessions: jest.fn(),
    getPublicSessions: jest.fn(),
    getPublicVenueBundle: jest.fn(),
    getPublicClassOptions: jest.fn(),
    getClassSessionStatus: jest.fn(),
    reconcileClassFromStripeSession: jest.fn(),
    getFixedEventSessionStatus: jest.fn(),
    reconcileFixedTicketFromStripeSession: jest.fn(),
    createClassCheckout: jest.fn(),
    createClassPackageCheckout: jest.fn(),
    createClassBundleCheckout: jest.fn(),
    createFixedEventCheckout: jest.fn(),
    processClassStripeWebhookEvent: jest.fn(),
    processClassPackageStripeWebhookEvent: jest.fn(),
    processFixedStripeWebhookEvent: jest.fn(),
    listAdminSessions: jest.fn(),
    createAdminSession: jest.fn(),
    updateAdminSession: jest.fn(),
    deleteAdminSession: jest.fn(),
    getAdminVenueConfig: jest.fn(),
    upsertAdminVenueConfig: jest.fn(),
    regenerateAdminClassSessions: jest.fn(),
    listAdminBookableClassEvents: jest.fn(),
  };
}

export type UpcomingEventsServiceMock = ReturnType<
  typeof createUpcomingEventsServiceMock
>;
