/** @vitest-environment jsdom */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  ADMIN_ACCESS_TOKEN_KEY,
  ADMIN_SESSION_CHANGED_EVENT,
  ADMIN_USER_KEY,
  isAdminLoggedIn,
  notifyAdminSessionChanged,
  persistAdminSessionUser,
  readAdminSessionRole,
} from "./session";
import { FIXTURE_ADMIN_TOKEN } from "./test/fixtures/uuids.fixture";

describe("admin session", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  describe("notifyAdminSessionChanged", () => {
    it("dispatches the session-changed event", () => {
      const spy = vi.fn();
      window.addEventListener(ADMIN_SESSION_CHANGED_EVENT, spy);
      notifyAdminSessionChanged();
      expect(spy).toHaveBeenCalledTimes(1);
      window.removeEventListener(ADMIN_SESSION_CHANGED_EVENT, spy);
    });

    it("no-ops when window is undefined", () => {
      const original = globalThis.window;
      // @ts-expect-error intentional SSR stub
      delete globalThis.window;
      expect(() => notifyAdminSessionChanged()).not.toThrow();
      globalThis.window = original;
    });
  });

  describe("readAdminSessionRole", () => {
    it("returns null when no user is stored", () => {
      expect(readAdminSessionRole()).toBeNull();
    });

    it("returns null for invalid JSON", () => {
      localStorage.setItem(ADMIN_USER_KEY, "{not-json");
      expect(readAdminSessionRole()).toBeNull();
    });

    it("returns null when role is missing", () => {
      localStorage.setItem(ADMIN_USER_KEY, JSON.stringify({ name: "x" }));
      expect(readAdminSessionRole()).toBeNull();
    });

    it("returns the stored role string", () => {
      localStorage.setItem(
        ADMIN_USER_KEY,
        JSON.stringify({ role: "ADMIN" }),
      );
      expect(readAdminSessionRole()).toBe("ADMIN");
    });

    it("returns null when window is undefined", () => {
      const original = globalThis.window;
      // @ts-expect-error intentional SSR stub
      delete globalThis.window;
      expect(readAdminSessionRole()).toBeNull();
      globalThis.window = original;
    });
  });

  describe("isAdminLoggedIn", () => {
    it("is false without a token", () => {
      localStorage.setItem(
        ADMIN_USER_KEY,
        JSON.stringify({ role: "ADMIN" }),
      );
      expect(isAdminLoggedIn()).toBe(false);
    });

    it("is false with token but non-staff role", () => {
      localStorage.setItem(ADMIN_ACCESS_TOKEN_KEY, FIXTURE_ADMIN_TOKEN);
      localStorage.setItem(
        ADMIN_USER_KEY,
        JSON.stringify({ role: "VIEWER" }),
      );
      expect(isAdminLoggedIn()).toBe(false);
    });

    it("is true with token and ADMIN role", () => {
      localStorage.setItem(ADMIN_ACCESS_TOKEN_KEY, FIXTURE_ADMIN_TOKEN);
      localStorage.setItem(
        ADMIN_USER_KEY,
        JSON.stringify({ role: "ADMIN" }),
      );
      expect(isAdminLoggedIn()).toBe(true);
    });

    it("returns false when window is undefined", () => {
      const original = globalThis.window;
      // @ts-expect-error intentional SSR stub
      delete globalThis.window;
      expect(isAdminLoggedIn()).toBe(false);
      globalThis.window = original;
    });
  });

  describe("persistAdminSessionUser", () => {
    it("no-ops when window is undefined", () => {
      const original = globalThis.window;
      // @ts-expect-error intentional SSR stub
      delete globalThis.window;
      expect(() => persistAdminSessionUser({ role: "ADMIN" })).not.toThrow();
      globalThis.window = original;
    });

    it("derives permissions when API permissions are empty", () => {
      persistAdminSessionUser({ role: "ADMIN", permissions: [] });
      const stored = JSON.parse(localStorage.getItem(ADMIN_USER_KEY)!);
      expect(stored.role).toBe("ADMIN");
      expect(stored.permissions).toContain("admin.access");
      expect(stored.permissions).not.toContain("admin.invite");
    });

    it("keeps API permissions and filters non-strings", () => {
      persistAdminSessionUser({
        role: "SUPER_ADMIN",
        permissions: ["admin.invite", 42, "catalog.manage", null],
      });
      const stored = JSON.parse(localStorage.getItem(ADMIN_USER_KEY)!);
      expect(stored.permissions).toEqual(["admin.invite", "catalog.manage"]);
    });

    it("treats non-string role as undefined and derives empty permissions", () => {
      persistAdminSessionUser({ role: 123, name: "x" });
      const stored = JSON.parse(localStorage.getItem(ADMIN_USER_KEY)!);
      expect(stored.permissions).toEqual([]);
    });

    it("derives all permissions for SUPER_ADMIN without API list", () => {
      persistAdminSessionUser({ role: "SUPER_ADMIN" });
      const stored = JSON.parse(localStorage.getItem(ADMIN_USER_KEY)!);
      expect(stored.permissions).toContain("admin.invite");
    });
  });
});
