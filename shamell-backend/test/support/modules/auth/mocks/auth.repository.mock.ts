export function createAuthRepositoryMock() {
  return {
    findStaffAdminId: jest.fn().mockResolvedValue(null),
    findUserIdByEmail: jest.fn().mockResolvedValue(null),
    findUserByEmail: jest.fn().mockResolvedValue(null),
    findUserRoleById: jest.fn().mockResolvedValue(null),
    createSuperAdmin: jest.fn(),
    bindGoogleSub: jest.fn(),
    deletePendingInvitesByEmail: jest.fn().mockResolvedValue({ count: 0 }),
    createAdminInvite: jest.fn(),
    deleteInviteById: jest.fn(),
    findValidInviteByEmail: jest.fn().mockResolvedValue(null),
    consumeInviteAndCreateAdmin: jest.fn().mockResolvedValue(undefined),
    setPasswordResetToken: jest.fn(),
    findUserByValidResetToken: jest.fn().mockResolvedValue(null),
    updatePasswordAndClearReset: jest.fn(),
  };
}

export type AuthRepositoryMock = ReturnType<typeof createAuthRepositoryMock>;
