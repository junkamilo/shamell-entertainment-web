export type HeaderFontToken = "brand" | "elegant" | "script" | "body";

export type HeaderTextContent = {
  headline: string;
  headlineFont: HeaderFontToken;
  headlineColor: string;
  tagline: string;
  taglineFont: HeaderFontToken;
  taglineColor: string;
  quote: string;
  quoteFont: HeaderFontToken;
  quoteColor: string;
};

export type AdminHeaderTextRow = HeaderTextContent & {
  id: string;
  isActive: boolean;
  updatedAt: string | null;
};

export const DEFAULT_HEADER_TEXT: HeaderTextContent = {
  headline: "SHAMELL",
  headlineFont: "brand",
  headlineColor: "#c5a55a",
  tagline: "Exclusive Belly Dance Performance Artistry",
  taglineFont: "elegant",
  taglineColor: "#f5e6b8",
  quote: "Dance is the hidden language of the soul.",
  quoteFont: "script",
  quoteColor: "#c5a55a",
};

export const HEADER_FONT_OPTIONS: { value: HeaderFontToken; label: string }[] = [
  { value: "brand", label: "Cinzel (brand)" },
  { value: "elegant", label: "Cormorant Garamond (elegant)" },
  { value: "script", label: "Great Vibes (script)" },
  { value: "body", label: "Cormorant (body)" },
];

export type HeaderMediaSectionTab = "media" | "text";
