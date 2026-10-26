export function createBookingsRepositoryMock() {
  return {
    asPrisma: jest.fn(),
    runTransaction: jest.fn(),
    cancelPendingBookingPayments: jest.fn().mockResolvedValue({ count: 0 }),
    findOccasionTypeNamesByIds: jest.fn().mockResolvedValue([]),
    findEventTypeName: jest.fn().mockResolvedValue(null),
    findServicesWithTypeNames: jest.fn().mockResolvedValue([]),
    findServiceIdsExisting: jest.fn().mockResolvedValue([]),
    findActiveSlotsInDayRange: jest.fn().mockResolvedValue([]),
    findOccupiedBookingsInDayRange: jest.fn().mockResolvedValue([]),
    findServiceById: jest.fn(),
    findEventTypeCatalogChannel: jest.fn(),
    findOccasionTypeById: jest.fn(),
    findBookingCatalogEvent: jest.fn(),
    findUserById: jest.fn(),
    findContactRequestById: jest.fn(),
    findBookingIdByContactRequestId: jest.fn().mockResolvedValue(null),
    createAdminBookingWithServices: jest.fn(),
    countBookings: jest.fn().mockResolvedValue(0),
    findBookingsAdminList: jest.fn().mockResolvedValue([]),
    findBookingsCalendar: jest.fn().mockResolvedValue([]),
    findBookingAdminById: jest.fn(),
    updateAdminBookingWithServices: jest.fn(),
    removeAdminBooking: jest.fn().mockResolvedValue(undefined),
    updateContactRequestCancelled: jest.fn(),
    insertPublicInquiryBooking: jest.fn(),
    createBookingQuote: jest.fn(),
    updateBooking: jest.fn(),
    findActiveQuoteByBookingId: jest.fn(),
    updateBookingQuote: jest.fn(),
    cancelOtherPendingBalancePayments: jest
      .fn()
      .mockResolvedValue({ count: 0 }),
    findBookingWithUser: jest.fn(),
    findPendingPaymentByQuoteId: jest.fn(),
    updateBookingPayment: jest.fn(),
    findPaymentByCheckoutSessionId: jest.fn(),
    createBookingPayment: jest.fn(),
    findActiveQuoteByTokenHash: jest.fn(),
    findWebhookPaymentBySessionId: jest.fn(),
    findExpiredWebhookPaymentBySessionId: jest.fn(),
    findActiveServiceById: jest.fn(),
    findPrivateClassServiceByCode: jest.fn(),
    findPrivateClassServiceByName: jest.fn(),
    createPrivateClassBookingWithServices: jest.fn(),
  };
}

export type BookingsRepositoryMock = ReturnType<
  typeof createBookingsRepositoryMock
>;
