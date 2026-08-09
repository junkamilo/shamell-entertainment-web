export function createAdminPaymentsRepositoryMock() {
  return {
    buildUnionParts: jest.fn().mockReturnValue([]),
    countUnion: jest.fn().mockResolvedValue(0),
    listKeys: jest.fn().mockResolvedValue([]),
    findBookingPaymentsByIds: jest.fn().mockResolvedValue([]),
    findVenueReservationsByIds: jest.fn().mockResolvedValue([]),
    findClassEnrollmentsByIds: jest.fn().mockResolvedValue([]),
    findPackageEnrollmentsByIds: jest.fn().mockResolvedValue([]),
    findFixedEnrollmentsByIds: jest.fn().mockResolvedValue([]),
    findBookingPaymentById: jest.fn().mockResolvedValue(null),
    findVenueReservationById: jest.fn().mockResolvedValue(null),
    findClassEnrollmentById: jest.fn().mockResolvedValue(null),
    findFixedEnrollmentById: jest.fn().mockResolvedValue(null),
    findFloorLayoutIdForEvent: jest.fn().mockResolvedValue(null),
    countBadgeSince: jest.fn().mockResolvedValue(0),
    defaultFlows: jest
      .fn()
      .mockReturnValue([
        'BOOKING_QUOTE',
        'VENUE_SEAT',
        'CLASS_SESSION',
        'CLASS_PACKAGE',
        'CLASS_DAY_BUNDLE',
        'FIXED_TICKET',
      ]),
  };
}

export type AdminPaymentsRepositoryMock = ReturnType<
  typeof createAdminPaymentsRepositoryMock
>;
