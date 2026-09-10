export const EMAIL_VERIFICATION_PURPOSE = {
  CONCIERGE_INQUIRY: 'CONCIERGE_INQUIRY',
} as const;

export type EmailVerificationPurpose =
  (typeof EMAIL_VERIFICATION_PURPOSE)[keyof typeof EMAIL_VERIFICATION_PURPOSE];

export const EMAIL_VERIFICATION_PURPOSES = Object.values(
  EMAIL_VERIFICATION_PURPOSE,
);

export const OTP_TTL_MS = 10 * 60 * 1000;
export const VERIFIED_TOKEN_TTL_MS = 5 * 60 * 1000;
export const OTP_MAX_ATTEMPTS = 5;
export const OTP_RESEND_COOLDOWN_MS = 60 * 1000;
export const OTP_MAX_RESENDS = 3;

export const EMAIL_VERIFICATION_FAILED_MESSAGE = 'Could not verify your email.';
export const EMAIL_VERIFICATION_EXPIRED_MESSAGE =
  'That code has expired. Request a new one.';
export const EMAIL_VERIFICATION_LOCKED_MESSAGE =
  'Too many attempts. Request a new code.';
export const EMAIL_VERIFICATION_RESEND_WAIT_MESSAGE =
  'Please wait before requesting another code.';
export const EMAIL_VERIFICATION_RESEND_LIMIT_MESSAGE =
  'Too many codes sent. Try again later.';
export const EMAIL_VERIFICATION_SEND_FAILED_MESSAGE =
  'Could not send the verification code. Please try again.';
export const EMAIL_VERIFICATION_REQUIRED_MESSAGE =
  'Verify your email before sending this inquiry.';
