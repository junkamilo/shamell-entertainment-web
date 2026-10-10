export function createAvailabilityRepositoryMock() {
  return {
    findWeeklySlots: jest.fn().mockResolvedValue([]),
    findClosures: jest.fn().mockResolvedValue([]),
    findWeeklySlotByWeekday: jest.fn().mockResolvedValue(null),
    upsertAllWeeklySlots: jest.fn().mockResolvedValue(undefined),
    createClosure: jest.fn(),
    deleteClosure: jest.fn(),
    findBlockingClosure: jest.fn().mockResolvedValue(null),
  };
}

export type AvailabilityRepositoryMock = ReturnType<
  typeof createAvailabilityRepositoryMock
>;
