import { UserRole } from '@prisma/client';
import type { CreateUserDto } from '../dto/create-user.dto';
import type { RegisteredUserView } from '../types/users.types';

export function makeCreateUserDto(
  overrides: Partial<CreateUserDto> = {},
): CreateUserDto {
  return {
    fullName: 'Test User',
    email: 'test.user@example.com',
    password: 'password123',
    phone: '+15551234567',
    ...overrides,
  };
}

export function makeRegisteredUserView(
  overrides: Partial<RegisteredUserView> = {},
): RegisteredUserView {
  return {
    id: 'user-1',
    fullName: 'Test User',
    email: 'test.user@example.com',
    phone: '+15551234567',
    role: UserRole.CLIENT,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}
