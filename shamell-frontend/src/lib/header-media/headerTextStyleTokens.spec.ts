import { describe, expect, it } from "vitest";
import {
  makeAdminHeaderTextRow,
  makeHeaderTextContent,
} from "./test/fixtures/headerMediaLib.fixture";
import { FIXTURE_HEADER_HEADLINE, FIXTURE_HEADER_TEXT_ID } from "./test/fixtures/uuids.fixture";
import { DEFAULT_HEADER_TEXT } from "./headerTextTypes";
import {
  colorInputFromHex,
  fontClassForToken,
  hexFromColorInput,
  isValidHexColor,
  mapAdminHeaderTextFromApi,
  mapHeaderTextFromApi,
  normalizeHexColor,
  parseHeaderFontToken,
} from "./headerTextStyleTokens";

describe("headerTextStyleTokens", () => {
  it("maps font tokens to CSS utility classes", () => {
    expect(fontClassForToken("brand")).toBe("font-brand");
    expect(fontClassForToken("script")).toBe("font-script");
  });

  it("validates and normalizes hex colors", () => {
    expect(isValidHexColor("#c5a55a")).toBe(true);
    expect(isValidHexColor("#GGG")).toBe(false);
    expect(normalizeHexColor("abcdef")).toBe("#abcdef");
    expect(normalizeHexColor("#1122334455")).toBe("#112233");
    expect(hexFromColorInput("ff0000")).toBe("#ff0000");
    expect(hexFromColorInput("nope")).toBe("#000000");
    expect(colorInputFromHex("#abcdef")).toBe("#abcdef");
    expect(colorInputFromHex("bad")).toBe("#c5a55a");
  });

  it("parses font tokens with brand fallback", () => {
    expect(parseHeaderFontToken("elegant")).toBe("elegant");
    expect(parseHeaderFontToken("nope")).toBe("brand");
    expect(parseHeaderFontToken(null)).toBe("brand");
  });

  it("maps API payloads into HeaderTextContent with defaults", () => {
    expect(mapHeaderTextFromApi(makeHeaderTextContent()).headline).toBe(
      FIXTURE_HEADER_HEADLINE,
    );
    expect(mapHeaderTextFromApi({}).headline).toBe(DEFAULT_HEADER_TEXT.headline);
    expect(
      mapHeaderTextFromApi({
        headline: "X",
        headlineColor: "bad",
        headlineFont: "script",
      }).headlineColor,
    ).toBe(DEFAULT_HEADER_TEXT.headlineColor);
    expect(
      mapHeaderTextFromApi({
        headline: "X",
        headlineColor: "#112233",
        headlineFont: "script",
      }),
    ).toMatchObject({
      headline: "X",
      headlineColor: "#112233",
      headlineFont: "script",
    });
  });

  it("maps admin header text rows or returns null", () => {
    const row = makeAdminHeaderTextRow();
    expect(mapAdminHeaderTextFromApi(row)?.id).toBe(FIXTURE_HEADER_TEXT_ID);
    expect(mapAdminHeaderTextFromApi(null)).toBeNull();
    expect(mapAdminHeaderTextFromApi({ headline: "no-id" })).toBeNull();
  });
});
