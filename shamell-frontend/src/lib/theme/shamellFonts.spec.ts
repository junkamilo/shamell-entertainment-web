import { beforeEach, describe, expect, it, vi } from "vitest";
import { makeLocalFontResult } from "./test/fixtures/themeLib.fixture";
import {
  FIXTURE_FONT_ADMIN_SANS_VAR,
  FIXTURE_FONT_CINZEL_VAR,
  FIXTURE_FONT_CORMORANT_VAR,
  FIXTURE_FONT_GREAT_VIBES_VAR,
} from "./test/fixtures/uuids.fixture";

const localFontMock = vi.hoisted(() =>
  vi.fn((options: { variable: string }) => makeLocalFontResult(options.variable)),
);

vi.mock("next/font/local", () => ({
  default: localFontMock,
}));

vi.mock("geist/font/sans", () => ({
  GeistSans: {
    className: "mock-geist-sans",
    variable: "--font-geist-sans",
  },
}));

vi.mock("geist/font/mono", () => ({
  GeistMono: {
    className: "mock-geist-mono",
    variable: "--font-geist-mono",
  },
}));

describe("shamellFonts", () => {
  beforeEach(() => {
    localFontMock.mockClear();
    vi.resetModules();
  });

  it("re-exports Geist sans and mono", async () => {
    const mod = await import("./shamellFonts");
    expect(mod.geistSans.className).toBe("mock-geist-sans");
    expect(mod.geistMono.className).toBe("mock-geist-mono");
  });

  it("registers local fonts with CSS variables", async () => {
    const mod = await import("./shamellFonts");

    expect(mod.cinzel.variable).toBe(FIXTURE_FONT_CINZEL_VAR);
    expect(mod.greatVibes.variable).toBe(FIXTURE_FONT_GREAT_VIBES_VAR);
    expect(mod.cormorant.variable).toBe(FIXTURE_FONT_CORMORANT_VAR);
    expect(mod.shamellAdminSans.variable).toBe(FIXTURE_FONT_ADMIN_SANS_VAR);

    const variables = localFontMock.mock.calls.map(
      (call) => (call[0] as { variable: string }).variable,
    );
    expect(variables).toEqual(
      expect.arrayContaining([
        FIXTURE_FONT_CINZEL_VAR,
        FIXTURE_FONT_GREAT_VIBES_VAR,
        FIXTURE_FONT_CORMORANT_VAR,
        FIXTURE_FONT_ADMIN_SANS_VAR,
      ]),
    );
  });

  it("configures cinzel and cormorant with swap display", async () => {
    await import("./shamellFonts");
    const cinzelOpts = localFontMock.mock.calls.find(
      (call) => (call[0] as { variable: string }).variable === FIXTURE_FONT_CINZEL_VAR,
    )?.[0] as { display: string; src: unknown[] };

    expect(cinzelOpts.display).toBe("swap");
    expect(cinzelOpts.src).toHaveLength(2);

    const cormorantOpts = localFontMock.mock.calls.find(
      (call) =>
        (call[0] as { variable: string }).variable === FIXTURE_FONT_CORMORANT_VAR,
    )?.[0] as { src: unknown[] };
    expect(cormorantOpts.src).toHaveLength(3);
  });
});
