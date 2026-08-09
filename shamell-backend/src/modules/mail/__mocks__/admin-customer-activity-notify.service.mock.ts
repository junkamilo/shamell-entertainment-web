export function createAdminCustomerActivityNotifyServiceMock(
  overrides: Record<string, jest.Mock> = {},
) {
  return {
    adminOpsEmail: jest.fn().mockReturnValue('ops@example.com'),
    notifyCustomerActivity: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

export type AdminCustomerActivityNotifyServiceMock = ReturnType<
  typeof createAdminCustomerActivityNotifyServiceMock
>;
