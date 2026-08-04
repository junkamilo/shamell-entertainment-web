import { makeShamellAdminColorSample } from "../fixtures/themeLib.fixture";
import {
  FIXTURE_ADMIN_FIRE,
  FIXTURE_FONT_CINZEL_VAR,
} from "../fixtures/uuids.fixture";

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
