/** @vitest-environment jsdom */

import { describe, expect, it } from "vitest";
import {
  makeAdminPermissions,
  makeAdminToken,
  makePriceCases,
  makeSuperAdminRole,
} from "./fixtures/adminLib.fixture";
import {
  FIXTURE_ADMIN_TOKEN,
  FIXTURE_SUPER_ADMIN_ROLE,
} from "./fixtures/uuids.fixture";
import { createMockAdminAuthState } from "./helpers/mockAdminLib";
import { ADMIN_LOGIN_PATH, SERVICES_PATH } from "../routes";
import { parsePriceInput } from "../pricing";

describe("admin lib test environment", () => {
  it("exposes usable fixtures and mocks", () => {
    expect(makeAdminToken()).toBe(FIXTURE_ADMIN_TOKEN);
    expect(makeSuperAdminRole()).toBe(FIXTURE_SUPER_ADMIN_ROLE);
    expect(makeAdminPermissions()).toContain("catalog.manage");
    expect(makePriceCases().validRounded).toBe(1250.5);

    const auth = createMockAdminAuthState({ token: "x" });
    expect(auth.token).toBe("x");
  });

  it("keeps route + pricing helpers wired for smoke", () => {
    expect(ADMIN_LOGIN_PATH).toBe("/admin/login");
    expect(SERVICES_PATH).toBe("/admin/services");
    expect(parsePriceInput(makePriceCases().valid)).toEqual({
      ok: true,
      value: makePriceCases().validRounded,
    });
  });
});
