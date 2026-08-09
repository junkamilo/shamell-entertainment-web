export function createAdminPaymentsServiceMock() {
  return {
    listPayments: jest.fn(),
    getPaymentDetail: jest.fn(),
    countBadgeSince: jest.fn(),
  };
}

export type AdminPaymentsServiceMock = ReturnType<
  typeof createAdminPaymentsServiceMock
>;
