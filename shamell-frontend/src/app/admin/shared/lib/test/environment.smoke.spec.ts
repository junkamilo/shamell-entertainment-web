/** @vitest-environment jsdom */

import { describe, expect, it } from "vitest";
import {
  makeAdminSharedToken,
  makePriceValueFixture,
} from "./fixtures/adminSharedLib.fixture";
import {
  FIXTURE_ADMIN_TOKEN,
  FIXTURE_PRICE_VALUE,
} from "./fixtures/uuids.fixture";
import { createMockAdminSharedLibState } from "./helpers/mockAdminSharedLib";
import { ADMIN_LOGIN_PATH } from "../adminRoutes";
import { getAdminApiBaseUrl } from "../adminApiBaseUrl";
import { formatPriceEn } from "../pricing";

describe("app/admin/shared/lib test environment", () => {
  it("exposes usable fixtures and mocks", () => {
    expect(makeAdminSharedToken()).toBe(FIXTURE_ADMIN_TOKEN);
    expect(makePriceValueFixture()).toBe(FIXTURE_PRICE_VALUE);
    expect(createMockAdminSharedLibState().token).toBe(FIXTURE_ADMIN_TOKEN);
  });

  it("keeps re-export shims wired for smoke", () => {
    expect(ADMIN_LOGIN_PATH).toBe("/admin/login");
    expect(typeof getAdminApiBaseUrl()).toBe("string");
    expect(formatPriceEn(FIXTURE_PRICE_VALUE)).toContain("1,250");
  });
});
