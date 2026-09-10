/** Public reCAPTCHA v2 site key. Secret lives only on the Nest API (`GOOGLE_RECAPTCHA_SECRET_KEY`). */
export function getRecaptchaSiteKey(): string {
  return process.env.NEXT_PUBLIC_GOOGLE_RECAPTCHA_SITE_KEY?.trim() ?? "";
}
