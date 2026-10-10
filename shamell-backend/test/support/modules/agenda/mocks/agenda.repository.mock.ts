export function createAgendaRepositoryMock() {
  return {
    findActiveServicesForCatalog: jest.fn().mockResolvedValue([]),
    findBookingEligibleEventTypes: jest.fn().mockResolvedValue([]),
    findActiveOccasionsForCatalog: jest.fn().mockResolvedValue([]),
  };
}

export type AgendaRepositoryMock = ReturnType<
  typeof createAgendaRepositoryMock
>;
