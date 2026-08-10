export function createRequirePermissionsGuardMock(canActivate = true) {
  return {
    canActivate: jest.fn().mockReturnValue(canActivate),
  };
}

export type RequirePermissionsGuardMock = ReturnType<
  typeof createRequirePermissionsGuardMock
>;
