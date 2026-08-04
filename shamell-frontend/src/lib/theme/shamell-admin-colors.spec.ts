import { describe, expect, it } from "vitest";
import { makeShamellAdminColorSample } from "./test/fixtures/themeLib.fixture";
import {
  FIXTURE_ADMIN_FIRE,
  FIXTURE_ADMIN_GOLD,
  FIXTURE_ADMIN_NIGHT,
  FIXTURE_ADMIN_TEXT_PRIMARY,
} from "./test/fixtures/uuids.fixture";
import {
  SHAMELL_ADMIN_COLORS,
  SHAMELL_ADMIN_PALETTES,
  SHAMELL_COLORS,
  SHAMELL_PALETTES,
} from "./shamell-admin-colors";

describe("SHAMELL_ADMIN_COLORS", () => {
  it("exposes the Purple Fire hex tokens used outside CSS variables", () => {
    expect(SHAMELL_ADMIN_COLORS.night).toBe(FIXTURE_ADMIN_NIGHT);
    expect(SHAMELL_ADMIN_COLORS.fire).toBe(FIXTURE_ADMIN_FIRE);
    expect(SHAMELL_ADMIN_COLORS.gold).toBe(FIXTURE_ADMIN_GOLD);
    expect(SHAMELL_ADMIN_COLORS.textPrimary).toBe(FIXTURE_ADMIN_TEXT_PRIMARY);
    expect(SHAMELL_ADMIN_COLORS.danger).toBe("#C9001F");
    expect(SHAMELL_ADMIN_COLORS.success).toBe("#4A8B5C");
  });

  it("aliases SHAMELL_COLORS to the admin palette", () => {
    expect(SHAMELL_COLORS).toBe(SHAMELL_ADMIN_COLORS);
  });

  it("matches fixture sample keys", () => {
    const sample = makeShamellAdminColorSample();
    expect(SHAMELL_ADMIN_COLORS.night).toBe(sample.night);
    expect(SHAMELL_ADMIN_COLORS.fire).toBe(sample.fire);
  });
});

describe("SHAMELL_ADMIN_PALETTES", () => {
  it("builds fireRamp and categorical series from admin colors", () => {
    expect(SHAMELL_ADMIN_PALETTES.fireRamp).toEqual([
      SHAMELL_ADMIN_COLORS.twilight,
      SHAMELL_ADMIN_COLORS.dusk,
      SHAMELL_ADMIN_COLORS.ember,
      SHAMELL_ADMIN_COLORS.fire,
      SHAMELL_ADMIN_COLORS.fireOrange,
      SHAMELL_ADMIN_COLORS.fireYellow,
    ]);
    expect(SHAMELL_ADMIN_PALETTES.categorical).toEqual([
      SHAMELL_ADMIN_COLORS.gold,
      SHAMELL_ADMIN_COLORS.fireRed,
      SHAMELL_ADMIN_COLORS.fireOrange,
      SHAMELL_ADMIN_COLORS.dusk,
      SHAMELL_ADMIN_COLORS.fireYellow,
      SHAMELL_ADMIN_COLORS.ember,
    ]);
  });

  it("aliases SHAMELL_PALETTES to the admin palettes", () => {
    expect(SHAMELL_PALETTES).toBe(SHAMELL_ADMIN_PALETTES);
  });
});
