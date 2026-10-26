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
} from '@app/common/auth/guards/require-permissions.guard';

function makeContext(adminUser?: { id: string; permissions?: string[] }) {
  return {
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({
      getRequest: () => ({ adminUser }),
    }),
  } as unknown as ExecutionContext;
}

describe('Guardia de Permisos Requeridos (RequirePermissionsGuard)', () => {
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

  it('permite el acceso cuando no hay metadatos de permisos', () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);
    expect(guard.canActivate(makeContext())).toBe(true);
    expect(reflector.getAllAndOverride).toHaveBeenCalledWith(
      REQUIRE_PERMISSIONS_KEY,
      expect.any(Array),
    );
  });

  it('rechaza cuando no existe el contexto de administrador', () => {
    reflector.getAllAndOverride.mockReturnValue(['admin.invite']);
    expect(() => guard.canActivate(makeContext())).toThrow(
      UnauthorizedException,
    );
  });

  it('rechaza cuando falta el permiso requerido', () => {
    reflector.getAllAndOverride.mockReturnValue(['admin.invite']);
    expect(() =>
      guard.canActivate(
        makeContext({ id: 'admin-1', permissions: ['admin.access'] }),
      ),
    ).toThrow(ForbiddenException);
  });

  it('permite el acceso cuando el permiso requerido está presente', () => {
    reflector.getAllAndOverride.mockReturnValue(['admin.invite']);
    expect(
      guard.canActivate(
        makeContext({ id: 'admin-1', permissions: ['admin.invite'] }),
      ),
    ).toBe(true);
  });
});
