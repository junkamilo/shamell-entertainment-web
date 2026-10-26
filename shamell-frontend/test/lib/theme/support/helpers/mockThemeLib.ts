import { makeShamellAdminColorSample } from "@test/lib/theme/support/fixtures/themeLib.fixture";
import {
  FIXTURE_ADMIN_FIRE,
  FIXTURE_FONT_CINZEL_VAR,
} from "@test/lib/theme/support/fixtures/uuids.fixture";

export function createMockThemeState(
  overrides: Record<string, unknown> = {},
) {
  return {
    colors: makeShamellAdminColorSample(),
    accent: FIXTURE_ADMIN_FIRE,
    cinzelVariable: FIXTURE_FONT_CINZEL_VAR,
    ...overrides,
  };
}
