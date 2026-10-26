import type { PrismaClient } from '@prisma/client';
import { hashPassword } from '@app/modules/auth/utils/auth-crypto.util';

export const STAFF_PASSWORD = 'Password123!';

/** Inserts a real user row with a bcrypt-hashed password. */
export async function seedUser(
  prisma: PrismaClient,
  data: {
    email: string;
    role?: 'CLIENT' | 'ADMIN' | 'SUPER_ADMIN';
    password?: string;
    fullName?: string;
  },
): Promise<{ id: string; email: string; role: string }> {
  return prisma.user.create({
    data: {
      email: data.email,
      fullName: data.fullName ?? 'Seeded User',
      role: data.role ?? 'SUPER_ADMIN',
      password: await hashPassword(data.password ?? STAFF_PASSWORD),
    },
    select: { id: true, email: true, role: true },
  });
}
