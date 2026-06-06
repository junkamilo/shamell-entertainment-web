import { maskCustomerName, maskEmail } from './mask-pii.util';

describe('mask-pii.util', () => {
  it('masks email local part', () => {
    expect(maskEmail('juan@example.com')).toBe('j***@example.com');
  });

  it('returns guest name fallback', () => {
    expect(maskCustomerName('')).toBe('Guest');
    expect(maskCustomerName('Maria Lopez')).toBe('Maria');
  });
});
