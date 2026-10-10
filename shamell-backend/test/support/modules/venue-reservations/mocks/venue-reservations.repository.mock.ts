export function createVenueReservationsRepositoryMock() {
  return {
    asPrisma: jest.fn(),
    runTransaction: jest.fn(),
    findReservationById: jest.fn(),
    findReservationByCheckoutSessionId: jest.fn(),
    findReservationByPayTokenHash: jest.fn(),
    updateReservation: jest.fn(),
    createReservation: jest.fn(),
    countReservations: jest.fn().mockResolvedValue(0),
    findManyReservations: jest.fn().mockResolvedValue([]),
    findPaidReservationsForEvent: jest.fn().mockResolvedValue([]),
    findVenueConfigByEventId: jest.fn(),
  };
}

export type VenueReservationsRepositoryMock = ReturnType<
  typeof createVenueReservationsRepositoryMock
>;
