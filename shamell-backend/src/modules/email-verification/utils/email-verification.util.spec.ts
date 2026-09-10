import { EMAIL_VERIFICATION_PURPOSE } from '../constants/email-verification.constants';
import { maskEmail, hashesMatch } from './email-verification.util';

describe('email-verification.util', () => {
  it('masks local-part but keeps the domain', () => {
    expect(maskEmail('ada@example.com')).toBe('a***@example.com');
  });

  it('compares equal hashes and rejects different lengths', () => {
    expect(hashesMatch('abc', 'abc')).toBe(true);
    expect(hashesMatch('abc', 'abd')).toBe(false);
    expect(hashesMatch('ab', 'abc')).toBe(false);
  });
});

describe('EMAIL_VERIFICATION_PURPOSE', () => {
  it('exposes concierge inquiry', () => {
    expect(EMAIL_VERIFICATION_PURPOSE.CONCIERGE_INQUIRY).toBe(
      'CONCIERGE_INQUIRY',
    );
  });
});
