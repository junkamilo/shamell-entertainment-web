export function createAdminStripeWebhooksRepositoryMock() {
  return {
    countEvents: jest.fn().mockResolvedValue(0),
    findEventsPage: jest.fn().mockResolvedValue([]),
    findByStripeEventId: jest.fn().mockResolvedValue(null),
    findRelatedPaymentSources: jest.fn().mockResolvedValue({
      bookingPayment: null,
      classEnrollment: null,
      packageEnrollment: null,
      fixedEnrollment: null,
      venueReservation: null,
    }),
  };
}

export type AdminStripeWebhooksRepositoryMock = ReturnType<
  typeof createAdminStripeWebhooksRepositoryMock
>;
