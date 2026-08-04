/** @vitest-environment jsdom */

import { describe, expect, it } from "vitest";
import { makeShamellAdminColorSample } from "./fixtures/themeLib.fixture";
import {
  FIXTURE_ADMIN_FIRE,
  FIXTURE_ADMIN_NIGHT,
  FIXTURE_FONT_CINZEL_VAR,
} from "./fixtures/uuids.fixture";
import { createMockThemeState } from "./helpers/mockThemeLib";
import {
  SHAMELL_ADMIN_COLORS,
  SHAMELL_ADMIN_PALETTES,
} from "../shamell-admin-colors";

describe("theme lib test environment", () => {
  it("exposes usable fixtures and mocks", () => {
    expect(makeShamellAdminColorSample().night).toBe(FIXTURE_ADMIN_NIGHT);
    expect(createMockThemeState().accent).toBe(FIXTURE_ADMIN_FIRE);
    expect(createMockThemeState().cinzelVariable).toBe(FIXTURE_FONT_CINZEL_VAR);
  });

  it("keeps core tokens wired for smoke", () => {
    expect(SHAMELL_ADMIN_COLORS.fire).toBe(FIXTURE_ADMIN_FIRE);
    expect(SHAMELL_ADMIN_PALETTES.fireRamp.length).toBeGreaterThan(0);
  });
});
