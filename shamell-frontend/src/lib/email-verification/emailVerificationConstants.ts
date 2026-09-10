export const EMAIL_VERIFICATION_PURPOSE = {
  CONCIERGE_INQUIRY: "CONCIERGE_INQUIRY",
} as const;

export type EmailVerificationPurpose =
  (typeof EMAIL_VERIFICATION_PURPOSE)[keyof typeof EMAIL_VERIFICATION_PURPOSE];
