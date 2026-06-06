import type { HeroHeaderContent } from '@prisma/client';
import { DEFAULT_HEADER_TEXT, type HeaderFont } from './header-text.constants';

export type HeaderTextResponse = {
  headline: string;
  headlineFont: HeaderFont;
  headlineColor: string;
  tagline: string;
  taglineFont: HeaderFont;
  taglineColor: string;
  quote: string;
  quoteFont: HeaderFont;
  quoteColor: string;
  isActive: boolean;
  updatedAt: string | null;
};

function asHeaderFont(value: string, fallback: HeaderFont): HeaderFont {
  const fonts: HeaderFont[] = ['brand', 'elegant', 'script', 'body'];
  return fonts.includes(value as HeaderFont) ? (value as HeaderFont) : fallback;
}

export function mapHeaderText(
  row: HeroHeaderContent | null,
): HeaderTextResponse {
  if (!row) {
    return {
      ...DEFAULT_HEADER_TEXT,
      isActive: true,
      updatedAt: null,
    };
  }

  return {
    headline: row.headline,
    headlineFont: asHeaderFont(
      row.headlineFont,
      DEFAULT_HEADER_TEXT.headlineFont,
    ),
    headlineColor: row.headlineColor,
    tagline: row.tagline,
    taglineFont: asHeaderFont(row.taglineFont, DEFAULT_HEADER_TEXT.taglineFont),
    taglineColor: row.taglineColor,
    quote: row.quote,
    quoteFont: asHeaderFont(row.quoteFont, DEFAULT_HEADER_TEXT.quoteFont),
    quoteColor: row.quoteColor,
    isActive: row.isActive,
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function mapAdminHeaderText(
  row: HeroHeaderContent | null,
): (HeaderTextResponse & { id: string }) | null {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    ...mapHeaderText(row),
  };
}
