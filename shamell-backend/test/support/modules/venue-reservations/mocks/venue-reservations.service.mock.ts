export function createVenueReservationsServiceMock() {
  return {
    getAvailability: jest.fn(),
    listAdminReservations: jest.fn(),
    createCheckoutSession: jest.fn(),
    getSessionStatus: jest.fn(),
    processStripeWebhookEvent: jest.fn(),
    cancelAdminReservation: jest.fn(),
    createAdminCheckoutSession: jest.fn(),
    createAdminCashReservation: jest.fn(),
    getAdminAvailability: jest.fn(),
    resolvePayCheckoutClientSecret: jest.fn(),
    getConfirmationPdfDownload: jest.fn(),
    resendAdminPaidConfirmationEmail: jest.fn(),
    resendAdminPaidConfirmationForCustomers: jest.fn(),
  };
}

export type VenueReservationsServiceMock = ReturnType<
  typeof createVenueReservationsServiceMock
>;
