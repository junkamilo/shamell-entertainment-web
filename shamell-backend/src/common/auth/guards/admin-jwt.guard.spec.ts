import {
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { PrismaService } from '../../../prisma/prisma.service';
import { createPrismaMock } from '../../../testing';
import { AdminJwtGuard } from './admin-jwt.guard';

function makeContext(authorization?: string) {
  const request: {
    headers: Record<string, string | undefined>;
    adminUser?: unknown;
  } = {
    headers: authorization ? { authorization } : {},
  };
  return {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
    request,
  } as unknown as ExecutionContext & { request: typeof request };
}

describe('AdminJwtGuard', () => {
  let guard: AdminJwtGuard;
  const prisma = createPrismaMock();
  const jwtService = {
    verifyAsync: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        AdminJwtGuard,
        { provide: JwtService, useValue: jwtService },
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    guard = moduleRef.get(AdminJwtGuard);
  });

  it('rejects missing Bearer header', async () => {
    await expect(guard.canActivate(makeContext())).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('rejects invalid token', async () => {
    jwtService.verifyAsync.mockRejectedValue(new Error('bad'));
    await expect(
      guard.canActivate(makeContext('Bearer bad-token')),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects non-staff JWT role', async () => {
    jwtService.verifyAsync.mockResolvedValue({
      sub: 'user-1',
      role: 'USER',
    });
    await expect(
      guard.canActivate(makeContext('Bearer token')),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects missing or non-staff DB user', async () => {
    jwtService.verifyAsync.mockResolvedValue({
      sub: 'user-1',
      role: 'ADMIN',
    });
    prisma.user.findUnique.mockResolvedValue(null);
    await expect(
      guard.canActivate(makeContext('Bearer token')),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('sets adminUser on happy path', async () => {
    jwtService.verifyAsync.mockResolvedValue({
      sub: 'user-1',
      email: 'ada@example.com',
      role: 'ADMIN',
    });
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'ada@example.com',
      role: 'ADMIN',
    });
    const ctx = makeContext('Bearer token');
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
    expect(ctx.request.adminUser).toEqual(
      expect.objectContaining({
        id: 'user-1',
        email: 'ada@example.com',
        role: 'ADMIN',
      }),
    );
  });
});
