const DEFAULT_JWT_SECRET = 'change-me-in-production';

export function resolveJwtSecret(): string {
  return process.env.JWT_SECRET?.trim() || DEFAULT_JWT_SECRET;
}

export function assertJwtSecretForProduction(): void {
  const nodeEnv = process.env.NODE_ENV ?? 'development';
  if (nodeEnv !== 'production') return;

  const secret = process.env.JWT_SECRET?.trim();
  if (!secret || secret === DEFAULT_JWT_SECRET || secret.length < 32) {
    throw new Error(
      'JWT_SECRET must be set to a strong value (min 32 chars) in production.',
    );
  }
}
