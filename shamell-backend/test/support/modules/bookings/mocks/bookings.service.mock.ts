export function createBookingsServiceMock() {
  return {
    getPublicOccupiedByDate: jest.fn(),
    createAdminBooking: jest.fn(),
    createPrivateClassCash: jest.fn(),
    createPrivateClassCheckoutSession: jest.fn(),
    notifyBookingCreated: jest.fn(),
    preparePublicBookingInquiry: jest.fn(),
    insertPublicBookingInquiry: jest.fn(),
    createFromPublicBookingInquiry: jest.fn(),
    findAllAdmin: jest.fn(),
    findCalendarAdmin: jest.fn(),
    findOneAdmin: jest.fn(),
    updateAdmin: jest.fn(),
    removeAdmin: jest.fn(),
    createBookingQuote: jest.fn(),
    sendBookingBalanceLink: jest.fn(),
    resolveQuotePayUrl: jest.fn(),
    resolveQuoteCheckoutClientSecret: jest.fn(),
    getQuotePaymentSessionStatus: jest.fn(),
    handleBookingPaymentsWebhook: jest.fn(),
    processStripeWebhookEvent: jest.fn(),
  };
}

export type BookingsServiceMock = ReturnType<typeof createBookingsServiceMock>;
