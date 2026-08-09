/** Light-mode inline defaults (email-safe fallbacks when @media is ignored). */
export const EMAIL_TOKENS_LIGHT = {
  bodyBg: '#f3efe6',
  cardBg: '#fffffe',
  cardBorder: 'rgba(154,123,47,0.28)',
  textPrimary: '#1a1026',
  textBody: '#3d3548',
  textMuted: '#6b6358',
  textAccent: '#8a6f2e',
  labelGold: '#9a7b2f',
  wordmarkGold: '#9a7b2f',
  link: '#7a6020',
  divider: 'rgba(154,123,47,0.2)',
  calloutBg: 'rgba(243,239,230,0.95)',
  calloutBorder: 'rgba(154,123,47,0.28)',
  ctaBg: '#d4af37',
  ctaText: '#1a1026',
  success: '#15803d',
} as const;

/** Dark-mode overrides via @media (prefers-color-scheme: dark). */
export const EMAIL_TOKENS_DARK = {
  bodyBg: '#0c0610',
  cardBg: '#1a0d24',
  cardBorder: 'rgba(212,175,106,0.35)',
  textPrimary: '#fff8e6',
  textBody: '#d6cfbd',
  textMuted: '#b9b09f',
  textAccent: '#e8d5a3',
  labelGold: '#c9a962',
  wordmarkGold: '#d4af37',
  link: '#e8d5a3',
  divider: 'rgba(212,175,106,0.2)',
  calloutBg: 'rgba(0,0,0,0.28)',
  calloutBorder: 'rgba(212,175,106,0.35)',
  ctaBg: '#d4af37',
  ctaText: '#1a1026',
  success: '#34d399',
} as const;

export type EmailTokenKey = keyof typeof EMAIL_TOKENS_LIGHT;

export function emailLightInlineStyle(token: EmailTokenKey): string {
  return EMAIL_TOKENS_LIGHT[token];
}
