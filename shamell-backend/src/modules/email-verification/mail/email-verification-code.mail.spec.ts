import {
  buildEmailVerificationCodeHtml,
  buildEmailVerificationCodeSubject,
} from './email-verification-code.mail';

describe('email-verification-code.mail', () => {
  it('embeds a spaced 6-digit code', () => {
    const html = buildEmailVerificationCodeHtml({
      appName: 'Shamell',
      code: '482193',
    });
    expect(html).toContain('4 8 2 1 9 3');
    expect(html).toContain('Verify your email');
    expect(buildEmailVerificationCodeSubject('Shamell')).toBe(
      'Your Shamell verification code',
    );
  });
});
