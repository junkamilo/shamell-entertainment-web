export function createMailServiceMock(
  overrides: Record<string, jest.Mock> = {},
) {
  return {
    isConfigured: jest.fn().mockReturnValue(true),
    getMissingConfigMessage: jest.fn().mockReturnValue('Mail not configured'),
    sendTransactional: jest.fn().mockResolvedValue({ ok: true }),
    resolveFromEmail: jest.fn().mockReturnValue('noreply@example.com'),
    ...overrides,
  };
}

export type MailServiceMock = ReturnType<typeof createMailServiceMock>;
