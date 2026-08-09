export function createVenueLayoutSettingsRepositoryMock() {
  return {
    asPrisma: jest.fn(),
    findLatest: jest.fn().mockResolvedValue(null),
    create: jest.fn(),
    update: jest.fn(),
    findActiveVenueSeatingEvent: jest.fn().mockResolvedValue(null),
  };
}

export type VenueLayoutSettingsRepositoryMock = ReturnType<
  typeof createVenueLayoutSettingsRepositoryMock
>;
