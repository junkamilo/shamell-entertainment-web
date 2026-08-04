/** @vitest-environment jsdom */

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ADMIN_ACCESS_TOKEN_KEY } from "@/lib/admin/session";
import {
  getAdminAuthHeaders as getLibAdminAuthHeaders,
  getAdminBearerToken as getLibAdminBearerToken,
} from "@/lib/admin/auth";
import { FIXTURE_ADMIN_TOKEN } from "./test/fixtures/uuids.fixture";
import { getAdminAuthHeaders, getAdminBearerToken } from "./adminAuth";

describe("adminAuth (app shared re-export)", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("re-exports the same helpers as @/lib/admin/auth", () => {
    expect(getAdminBearerToken).toBe(getLibAdminBearerToken);
    expect(getAdminAuthHeaders).toBe(getLibAdminAuthHeaders);
  });

  it("returns null when no token is stored", () => {
    expect(getAdminBearerToken()).toBeNull();
  });

  it("reads the bearer token from localStorage", () => {
    localStorage.setItem(ADMIN_ACCESS_TOKEN_KEY, FIXTURE_ADMIN_TOKEN);
    expect(getAdminBearerToken()).toBe(FIXTURE_ADMIN_TOKEN);
  });

  it("builds JSON auth headers with Authorization when token exists", () => {
    localStorage.setItem(ADMIN_ACCESS_TOKEN_KEY, FIXTURE_ADMIN_TOKEN);
    expect(getAdminAuthHeaders()).toEqual({
      "Content-Type": "application/json",
      Authorization: `Bearer ${FIXTURE_ADMIN_TOKEN}`,
    });
  });

  it("omits Content-Type when includeJson is false", () => {
    localStorage.setItem(ADMIN_ACCESS_TOKEN_KEY, FIXTURE_ADMIN_TOKEN);
    expect(getAdminAuthHeaders(false)).toEqual({
      Authorization: `Bearer ${FIXTURE_ADMIN_TOKEN}`,
    });
  });

  it("omits Authorization when there is no token", () => {
    expect(getAdminAuthHeaders()).toEqual({
      "Content-Type": "application/json",
    });
  });
});
