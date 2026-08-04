import type { ShamellAdminColorKey } from "../../shamell-admin-colors";
import {
  FIXTURE_ADMIN_FIRE,
  FIXTURE_ADMIN_GOLD,
  FIXTURE_ADMIN_NIGHT,
  FIXTURE_ADMIN_TEXT_PRIMARY,
} from "./uuids.fixture";

export function makeShamellAdminColorSample(
  overrides: Partial<Record<ShamellAdminColorKey, string>> = {},
) {
  return {
    night: FIXTURE_ADMIN_NIGHT,
    fire: FIXTURE_ADMIN_FIRE,
    gold: FIXTURE_ADMIN_GOLD,
    textPrimary: FIXTURE_ADMIN_TEXT_PRIMARY,
    ...overrides,
  };
}

export function makeLocalFontResult(variable: string) {
  return {
    className: `mock-${variable.replace(/^--/, "")}`,
    style: { fontFamily: `mock-${variable}` },
    variable,
  };
}
