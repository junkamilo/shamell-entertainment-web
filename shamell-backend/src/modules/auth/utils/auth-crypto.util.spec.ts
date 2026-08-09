import {
  comparePassword,
  generateInviteCode,
  generateResetToken,
  hashPassword,
  sha256Hex,
} from './auth-crypto.util';

describe('auth-crypto.util', () => {
  it('sha256Hex is stable for the same input', () => {
    expect(sha256Hex('code')).toBe(sha256Hex('code'));
    expect(sha256Hex('code')).not.toBe(sha256Hex('other'));
  });

  it('generateInviteCode returns a 6-digit string', () => {
    const code = generateInviteCode();
    expect(code).toMatch(/^\d{6}$/);
    expect(Number(code)).toBeGreaterThanOrEqual(100000);
    expect(Number(code)).toBeLessThan(1000000);
  });

  it('hashPassword / comparePassword roundtrip', async () => {
    const hashed = await hashPassword('password123');
    await expect(comparePassword('password123', hashed)).resolves.toBe(true);
    await expect(comparePassword('wrong', hashed)).resolves.toBe(false);
  });

  it('generateResetToken returns raw + matching hash', () => {
    const { rawToken, tokenHash } = generateResetToken();
    expect(rawToken).toHaveLength(64);
    expect(tokenHash).toBe(sha256Hex(rawToken));
  });
});
