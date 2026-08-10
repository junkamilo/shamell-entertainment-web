export function createAdminJwtGuardMock(canActivate = true) {
  return {
    canActivate: jest.fn().mockResolvedValue(canActivate),
  };
}

export type AdminJwtGuardMock = ReturnType<typeof createAdminJwtGuardMock>;
