export function createAdminClassEnrollmentServiceMock() {
  return {
    getAdminClassBookingContext: jest.fn(),
    listAdminBookableClassEvents: jest.fn(),
    createAdminClassCashEnrollment: jest.fn(),
    createAdminClassCheckoutSession: jest.fn(),
    resolveClassPayCheckoutClientSecret: jest.fn(),
  };
}

export type AdminClassEnrollmentServiceMock = ReturnType<
  typeof createAdminClassEnrollmentServiceMock
>;
