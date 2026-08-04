import { describe, expect, it } from "vitest";
import {
  DEFAULT_HEADER_TEXT,
  HEADER_FONT_OPTIONS,
  type HeaderFontToken,
} from "./headerTextTypes";

describe("headerTextTypes", () => {
  it("exposes default header marketing copy", () => {
    expect(DEFAULT_HEADER_TEXT.headline).toBe("SHAMELL");
    expect(DEFAULT_HEADER_TEXT.headlineFont).toBe("brand");
    expect(DEFAULT_HEADER_TEXT.headlineColor).toMatch(/^#[0-9a-fA-F]{6}$/);
  });

  it("lists all supported font tokens", () => {
    const values = HEADER_FONT_OPTIONS.map((o) => o.value);
    const expected: HeaderFontToken[] = ["brand", "elegant", "script", "body"];
    expect(values).toEqual(expected);
    expect(HEADER_FONT_OPTIONS.every((o) => o.label.length > 0)).toBe(true);
  });
});
