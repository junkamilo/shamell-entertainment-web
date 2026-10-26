export function createAdminFixedEventEnrollmentServiceMock() {
  return {
    listBoxOfficeFixedEvents: jest.fn(),
    createAdminCash: jest.fn(),
    createAdminCheckoutSession: jest.fn(),
  };
}

export type AdminFixedEventEnrollmentServiceMock = ReturnType<
  typeof createAdminFixedEventEnrollmentServiceMock
>;
