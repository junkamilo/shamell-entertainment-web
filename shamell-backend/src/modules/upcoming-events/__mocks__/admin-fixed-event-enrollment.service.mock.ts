export function createAdminFixedEventEnrollmentServiceMock() {
  return {
    listBoxOfficeFixedEvents: jest.fn(),
    createAdminFixedCashEnrollment: jest.fn(),
    createAdminFixedCheckoutSession: jest.fn(),
    reconcileFixedFromStripeSession: jest.fn(),
  };
}

export type AdminFixedEventEnrollmentServiceMock = ReturnType<
  typeof createAdminFixedEventEnrollmentServiceMock
>;
