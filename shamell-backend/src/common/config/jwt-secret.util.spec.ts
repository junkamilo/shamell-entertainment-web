import {
  assertJwtSecretForProduction,
  resolveJwtSecret,
} from './jwt-secret.util';

describe('jwt-secret.util', () => {
  const originalEnv = process.env.NODE_ENV;
  const originalSecret = process.env.JWT_SECRET;

  afterEach(() => {
    if (originalEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = originalEnv;
    if (originalSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = originalSecret;
  });

  it('resolveJwtSecret falls back to default', () => {
    delete process.env.JWT_SECRET;
    expect(resolveJwtSecret()).toBe('change-me-in-production');
  });

  it('resolveJwtSecret trims env value', () => {
    process.env.JWT_SECRET = '  my-secret  ';
    expect(resolveJwtSecret()).toBe('my-secret');
  });

  it('assertJwtSecretForProduction no-ops outside production', () => {
    process.env.NODE_ENV = 'development';
    delete process.env.JWT_SECRET;
    expect(() => assertJwtSecretForProduction()).not.toThrow();
  });

  it('assertJwtSecretForProduction rejects weak secrets in production', () => {
    process.env.NODE_ENV = 'production';
    process.env.JWT_SECRET = 'short';
    expect(() => assertJwtSecretForProduction()).toThrow(/JWT_SECRET/);
  });

  it('assertJwtSecretForProduction accepts strong secret', () => {
    process.env.NODE_ENV = 'production';
    process.env.JWT_SECRET = 'a'.repeat(32);
    expect(() => assertJwtSecretForProduction()).not.toThrow();
  });
});
