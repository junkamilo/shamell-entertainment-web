import type { AdminHeaderTextRow, HeaderFontToken, HeaderTextContent } from "./headerTextTypes";
import { DEFAULT_HEADER_TEXT } from "./headerTextTypes";

export const HEADER_HEX_COLOR_REGEX = /^#[0-9A-Fa-f]{6}$/;

const FONT_CLASS: Record<HeaderFontToken, string> = {
  brand: "font-brand",
  elegant: "font-elegant",
  script: "font-script",
  body: "font-body",
};

export function fontClassForToken(token: HeaderFontToken): string {
  return FONT_CLASS[token] ?? FONT_CLASS.brand;
}

export function isValidHexColor(value: string): boolean {
  return HEADER_HEX_COLOR_REGEX.test(value);
}

export function normalizeHexColor(value: string): string {
  const trimmed = value.trim();
  if (!trimmed.startsWith("#")) {
    return `#${trimmed}`.slice(0, 7);
  }
  return trimmed.slice(0, 7);
}

export function hexFromColorInput(value: string): string {
  const normalized = normalizeHexColor(value);
  return isValidHexColor(normalized) ? normalized : "#000000";
}

export function colorInputFromHex(hex: string): string {
  return isValidHexColor(hex) ? hex : "#c5a55a";
}

export function parseHeaderFontToken(value: unknown): HeaderFontToken {
  const tokens: HeaderFontToken[] = ["brand", "elegant", "script", "body"];
  return typeof value === "string" && tokens.includes(value as HeaderFontToken)
    ? (value as HeaderFontToken)
    : "brand";
}

export function mapHeaderTextFromApi(data: unknown): HeaderTextContent {
  const row = data as Record<string, unknown>;

  return {
    headline: typeof row.headline === "string" ? row.headline : DEFAULT_HEADER_TEXT.headline,
    headlineFont: parseHeaderFontToken(row.headlineFont ?? DEFAULT_HEADER_TEXT.headlineFont),
    headlineColor:
      typeof row.headlineColor === "string" && isValidHexColor(row.headlineColor)
        ? row.headlineColor
        : DEFAULT_HEADER_TEXT.headlineColor,
    tagline: typeof row.tagline === "string" ? row.tagline : DEFAULT_HEADER_TEXT.tagline,
    taglineFont: parseHeaderFontToken(row.taglineFont ?? DEFAULT_HEADER_TEXT.taglineFont),
    taglineColor:
      typeof row.taglineColor === "string" && isValidHexColor(row.taglineColor)
        ? row.taglineColor
        : DEFAULT_HEADER_TEXT.taglineColor,
    quote: typeof row.quote === "string" ? row.quote : DEFAULT_HEADER_TEXT.quote,
    quoteFont: parseHeaderFontToken(row.quoteFont ?? DEFAULT_HEADER_TEXT.quoteFont),
    quoteColor:
      typeof row.quoteColor === "string" && isValidHexColor(row.quoteColor)
        ? row.quoteColor
        : DEFAULT_HEADER_TEXT.quoteColor,
  };
}

export function mapAdminHeaderTextFromApi(data: unknown): AdminHeaderTextRow | null {
  if (!data || typeof data !== "object") return null;
  const row = data as Record<string, unknown>;
  if (typeof row.id !== "string") return null;

  const content = mapHeaderTextFromApi(data);
  return {
    id: row.id,
    ...content,
    isActive: row.isActive === true,
    updatedAt: typeof row.updatedAt === "string" ? row.updatedAt : null,
  };
}
