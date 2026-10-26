import {
  assertJwtSecretForProduction,
  resolveJwtSecret,
} from '@app/common/config/jwt-secret.util';

describe('Utilidad jwt-secret.util', () => {
  const originalEnv = process.env.NODE_ENV;
  const originalSecret = process.env.JWT_SECRET;

  afterEach(() => {
    if (originalEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = originalEnv;
    if (originalSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = originalSecret;
  });

  it('resolveJwtSecret recurre al valor por defecto cuando no está definido', () => {
    delete process.env.JWT_SECRET;
    expect(resolveJwtSecret()).toBe('change-me-in-production');
  });

  it('resolveJwtSecret elimina espacios en blanco del valor de entorno', () => {
    process.env.JWT_SECRET = '  my-secret  ';
    expect(resolveJwtSecret()).toBe('my-secret');
  });

  it('assertJwtSecretForProduction no realiza ninguna acción fuera del entorno de producción', () => {
    process.env.NODE_ENV = 'development';
    delete process.env.JWT_SECRET;
    expect(() => assertJwtSecretForProduction()).not.toThrow();
  });

  it('assertJwtSecretForProduction rechaza secretos débiles en producción', () => {
    process.env.NODE_ENV = 'production';
    process.env.JWT_SECRET = 'short';
    expect(() => assertJwtSecretForProduction()).toThrow(/JWT_SECRET/);
  });

  it('assertJwtSecretForProduction acepta un secreto seguro en producción', () => {
    process.env.NODE_ENV = 'production';
    process.env.JWT_SECRET = 'a'.repeat(32);
    expect(() => assertJwtSecretForProduction()).not.toThrow();
  });
});
