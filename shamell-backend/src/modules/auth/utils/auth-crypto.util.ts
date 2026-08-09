import { compare, hash } from 'bcryptjs';
import { createHash, randomBytes, randomInt } from 'crypto';
import { BCRYPT_ROUNDS } from '../constants/auth.constants';

export function sha256Hex(input: string): string {
  return createHash('sha256').update(input, 'utf8').digest('hex');
}

export function hashPassword(password: string): Promise<string> {
  return hash(password, BCRYPT_ROUNDS);
}

export function comparePassword(
  password: string,
  passwordHash: string,
): Promise<boolean> {
  return compare(password, passwordHash);
}

/** Six-digit numeric invite code as string (100000–999999). */
export function generateInviteCode(): string {
  return String(randomInt(100000, 1000000));
}

export function generateResetToken(): { rawToken: string; tokenHash: string } {
  const rawToken = randomBytes(32).toString('hex');
  return {
    rawToken,
    tokenHash: sha256Hex(rawToken),
  };
}
