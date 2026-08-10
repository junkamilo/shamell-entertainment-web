import {
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import {
  REQUIRE_PERMISSIONS_KEY,
  RequirePermissionsGuard,
} from './require-permissions.guard';

function makeContext(adminUser?: { id: string; permissions?: string[] }) {
  return {
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({
      getRequest: () => ({ adminUser }),
    }),
  } as unknown as ExecutionContext;
}

describe('RequirePermissionsGuard', () => {
  let guard: RequirePermissionsGuard;
  const reflector = {
    getAllAndOverride: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        RequirePermissionsGuard,
        { provide: Reflector, useValue: reflector },
      ],
    }).compile();
    guard = moduleRef.get(RequirePermissionsGuard);
  });

  it('allows when no permissions metadata', () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);
    expect(guard.canActivate(makeContext())).toBe(true);
    expect(reflector.getAllAndOverride).toHaveBeenCalledWith(
      REQUIRE_PERMISSIONS_KEY,
      expect.any(Array),
    );
  });

  it('rejects missing admin context', () => {
    reflector.getAllAndOverride.mockReturnValue(['admin.invite']);
    expect(() => guard.canActivate(makeContext())).toThrow(
      UnauthorizedException,
    );
  });

  it('rejects missing permission', () => {
    reflector.getAllAndOverride.mockReturnValue(['admin.invite']);
    expect(() =>
      guard.canActivate(
        makeContext({ id: 'admin-1', permissions: ['admin.access'] }),
      ),
    ).toThrow(ForbiddenException);
  });

  it('allows when permission present', () => {
    reflector.getAllAndOverride.mockReturnValue(['admin.invite']);
    expect(
      guard.canActivate(
        makeContext({ id: 'admin-1', permissions: ['admin.invite'] }),
      ),
    ).toBe(true);
  });
});
