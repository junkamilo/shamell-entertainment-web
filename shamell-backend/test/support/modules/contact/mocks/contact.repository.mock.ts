export function createContactRepositoryMock(
  overrides: Record<string, jest.Mock> = {},
) {
  return {
    asPrisma: jest.fn().mockReturnValue({}),
    runTransaction: jest.fn(async (fn: (tx: unknown) => Promise<unknown>) =>
      fn({
        contactRequest: {
          create: jest.fn(),
          update: jest.fn(),
        },
      }),
    ),
    create: jest.fn(),
    findById: jest.fn(),
    count: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findOccasionTypeNamesByIds: jest.fn().mockResolvedValue([]),
    findEventTypeNameById: jest.fn().mockResolvedValue(null),
    findActiveBookingContactRequestId: jest.fn().mockResolvedValue(null),
    findRecentContactByEmailAndEventDate: jest.fn().mockResolvedValue(null),
    findActiveBookingIdByContactRequestId: jest.fn().mockResolvedValue(null),
    countPeticionesBadgeGuidance: jest.fn().mockResolvedValue(0),
    countPeticionesBadgePrivateClasses: jest.fn().mockResolvedValue(0),
    countPeticionesBadgeBookings: jest.fn().mockResolvedValue(0),
    countGuidanceFeed: jest.fn().mockResolvedValue(0),
    listGuidanceFeed: jest.fn().mockResolvedValue([]),
    countPrivateClassesFeed: jest.fn().mockResolvedValue(0),
    listPrivateClassesFeed: jest.fn().mockResolvedValue([]),
    countBookingsLaneOrphans: jest.fn().mockResolvedValue(0),
    countBookingsLaneNonPrivate: jest.fn().mockResolvedValue(0),
    listBookingsLaneFeed: jest.fn().mockResolvedValue([]),
    ...overrides,
  };
}

export type ContactRepositoryMock = ReturnType<
  typeof createContactRepositoryMock
>;
