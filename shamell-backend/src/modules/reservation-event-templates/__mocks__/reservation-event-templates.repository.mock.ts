export function createReservationEventTemplatesRepositoryMock(
  overrides: Record<string, jest.Mock> = {},
) {
  return {
    runTransaction: jest.fn((fn: (tx: unknown) => Promise<unknown>) =>
      Promise.resolve(fn({})),
    ),
    findManyAdmin: jest.fn(),
    findById: jest.fn(),
    findByName: jest.fn(),
    createWithoutClassSections: jest.fn(),
    findByIdInTx: jest.fn(),
    deleteWeekdays: jest.fn(),
    updateWithoutNestedSections: jest.fn(),
    replaceClassSections: jest.fn(),
    countLinkedVenueConfigs: jest.fn(),
    deleteTemplate: jest.fn(),
    findLinkedVenueConfigsForSync: jest.fn(),
    updateVenueConfigReservationFields: jest.fn(),
    syncSeatReservationEventDates: jest.fn(),
    toPrismaCreateWithoutClassSections: jest.fn((v: unknown) => v),
    toPrismaUpdateWithoutNestedSections: jest.fn((v: unknown) => v),
    normalizeClassSections: jest.fn((s: unknown) => s),
    normalizeWeekdays: jest.fn((w: unknown) => w),
    ...overrides,
  };
}

export type ReservationEventTemplatesRepositoryMock = ReturnType<
  typeof createReservationEventTemplatesRepositoryMock
>;
