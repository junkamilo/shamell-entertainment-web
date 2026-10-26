export function createAdminPaymentNotifyServiceMock(
  overrides: Record<string, jest.Mock> = {},
) {
  return {
    adminOpsEmail: jest.fn().mockReturnValue('ops@example.com'),
    notifyPaymentOutcome: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

export type AdminPaymentNotifyServiceMock = ReturnType<
  typeof createAdminPaymentNotifyServiceMock
>;
