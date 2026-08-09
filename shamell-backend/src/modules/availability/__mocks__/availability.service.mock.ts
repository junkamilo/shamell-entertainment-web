export function createAvailabilityServiceMock() {
  return {
    bookingTimeZone: jest.fn().mockReturnValue('America/New_York'),
    getPublicRules: jest.fn(),
    getAdminSnapshot: jest.fn(),
    putWeeklySlots: jest.fn(),
    createClosure: jest.fn(),
    removeClosure: jest.fn(),
    assertDateTimeAllowed: jest.fn(),
  };
}

export type AvailabilityServiceMock = ReturnType<
  typeof createAvailabilityServiceMock
>;
