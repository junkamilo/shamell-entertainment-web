import type { LoginDto } from '../dto/login.dto';
import type { InviteAdminDto } from '../dto/invite-admin.dto';
import type { AdminLoginResponse } from '../types/auth.types';

export function makeLoginDto(overrides: Partial<LoginDto> = {}): LoginDto {
  return {
    email: 'admin@example.com',
    password: 'password123',
    ...overrides,
  };
}

export function makeInviteDto(
  overrides: Partial<InviteAdminDto> = {},
): InviteAdminDto {
  return {
    email: 'newadmin@example.com',
    fullName: 'New Admin',
    ...overrides,
  };
}

export function makeStaffUser(overrides: Record<string, unknown> = {}) {
  return {
    id: 'user-admin-1',
    fullName: 'Ada Admin',
    email: 'admin@example.com',
    password: '$2a$10$hashed',
    phone: null,
    role: 'SUPER_ADMIN',
    googleSub: null,
    twoFactorEnabled: false,
    twoFactorSecret: null,
    passwordResetToken: null,
    passwordResetExpiresAt: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

export function makeAdminInviteRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'invite-1',
    email: 'newadmin@example.com',
    codeHash: 'abc123hash',
    fullName: 'New Admin',
    invitedById: 'user-admin-1',
    expiresAt: new Date(Date.now() + 60_000),
    consumedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

export function makeLoginResponse(
  overrides: Partial<AdminLoginResponse> = {},
): AdminLoginResponse {
  return {
    message: 'Login successful',
    accessToken: 'jwt-token',
    user: {
      id: 'user-admin-1',
      fullName: 'Ada Admin',
      email: 'admin@example.com',
      role: 'SUPER_ADMIN',
      permissions: ['admin.invite'],
    },
    ...overrides,
  };
}
