export function createAuthServiceMock() {
  return {
    bootstrapAdmin: jest.fn(),
    loginAdmin: jest.fn(),
    loginAdminGoogle: jest.fn(),
    inviteAdmin: jest.fn(),
    verifyAdminInvite: jest.fn(),
    forgotPassword: jest.fn(),
    resetPassword: jest.fn(),
  };
}

export type AuthServiceMock = ReturnType<typeof createAuthServiceMock>;
