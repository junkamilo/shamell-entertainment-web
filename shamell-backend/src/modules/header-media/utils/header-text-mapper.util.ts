import type { HeroHeaderContent } from '@prisma/client';
import {
  DEFAULT_HEADER_TEXT,
  HEADER_FONTS,
  type HeaderFont,
} from '../constants/header-media.constants';
import type {
  AdminHeaderTextResponse,
  HeaderTextResponse,
} from '../types/header-media.types';

function asHeaderFont(value: string, fallback: HeaderFont): HeaderFont {
  return HEADER_FONTS.includes(value as HeaderFont)
    ? (value as HeaderFont)
    : fallback;
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
): AdminHeaderTextResponse | null {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    ...mapHeaderText(row),
  };
}
