export const HEADER_FONTS = ['brand', 'elegant', 'script', 'body'] as const;
export type HeaderFont = (typeof HEADER_FONTS)[number];

export const HEADER_HEX_COLOR_REGEX = /^#[0-9A-Fa-f]{6}$/;

export const DEFAULT_HEADER_TEXT = {
  headline: 'SHAMELL',
  headlineFont: 'brand' as HeaderFont,
  headlineColor: '#c5a55a',
  tagline: 'Exclusive Belly Dance Performance Artistry',
  taglineFont: 'elegant' as HeaderFont,
  taglineColor: '#f5e6b8',
  quote: 'Dance is the hidden language of the soul.',
  quoteFont: 'script' as HeaderFont,
  quoteColor: '#c5a55a',
};
