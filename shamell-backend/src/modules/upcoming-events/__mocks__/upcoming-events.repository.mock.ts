export function createUpcomingEventsRepositoryMock() {
  return {
    asPrisma: jest.fn(),
    runTransaction: jest.fn(),
    findClassEnrollmentByCheckoutSessionId: jest.fn(),
    findPackageEnrollmentByCheckoutSessionId: jest.fn(),
    findFixedEnrollmentByCheckoutSessionId: jest.fn(),
    findClassSessionById: jest.fn(),
    findVenueConfigByEventId: jest.fn(),
    countPaidClassEnrollmentsForSession: jest.fn().mockResolvedValue(0),
  };
}

export type UpcomingEventsRepositoryMock = ReturnType<
  typeof createUpcomingEventsRepositoryMock
>;
