/** @vitest-environment jsdom */

import { describe, it, expect, beforeEach } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import {
  ADMIN_ACCESS_TOKEN_KEY,
  ADMIN_USER_KEY,
  notifyAdminSessionChanged,
} from "@/lib/adminSession";
import {
  FIXTURE_ACCESS_TOKEN,
  FIXTURE_ADMIN_EMAIL,
  FIXTURE_ADMIN_USER_ID,
} from "../test/fixtures/uuids.fixture";
import { makeAdminLoginUser } from "../test/fixtures/auth.fixture";
import { useAdminSession } from "./useAdminSession";

function seedAdminSession(user: Record<string, unknown>) {
  localStorage.setItem(ADMIN_ACCESS_TOKEN_KEY, FIXTURE_ACCESS_TOKEN);
  localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(user));
  notifyAdminSessionChanged();
}

describe("useAdminSession", () => {
  beforeEach(() => {
    localStorage.clear();
    notifyAdminSessionChanged();
  });

  it("SUPER_ADMIN user with token is logged in with non-empty permissions", async () => {
    seedAdminSession(
      makeAdminLoginUser({
        id: FIXTURE_ADMIN_USER_ID,
        email: FIXTURE_ADMIN_EMAIL,
        role: "SUPER_ADMIN",
      }),
    );

    const { result } = renderHook(() => useAdminSession());

    await waitFor(() => {
      expect(result.current.isLoggedIn).toBe(true);
    });
    expect(result.current.token).toBe(FIXTURE_ACCESS_TOKEN);
    expect(result.current.role).toBe("SUPER_ADMIN");
    expect(result.current.user?.email).toBe(FIXTURE_ADMIN_EMAIL);
    expect(result.current.permissions.length).toBeGreaterThan(0);
  });

  it("clear() removes keys and isLoggedIn becomes false", async () => {
    seedAdminSession(makeAdminLoginUser({ role: "SUPER_ADMIN" }));

    const { result } = renderHook(() => useAdminSession());

    await waitFor(() => {
      expect(result.current.isLoggedIn).toBe(true);
    });

    act(() => {
      result.current.clear();
    });

    await waitFor(() => {
      expect(result.current.isLoggedIn).toBe(false);
    });
    expect(localStorage.getItem(ADMIN_ACCESS_TOKEN_KEY)).toBeNull();
    expect(localStorage.getItem(ADMIN_USER_KEY)).toBeNull();
    expect(result.current.token).toBeNull();
    expect(result.current.role).toBeNull();
    expect(result.current.permissions).toEqual([]);
  });

  it("invalid role is not logged in", async () => {
    seedAdminSession(
      makeAdminLoginUser({
        role: "CUSTOMER",
      }),
    );

    const { result } = renderHook(() => useAdminSession());

    await waitFor(() => {
      expect(result.current.isLoggedIn).toBe(false);
    });
    expect(result.current.token).toBe(FIXTURE_ACCESS_TOKEN);
    expect(result.current.role).toBe("CUSTOMER");
    expect(result.current.permissions).toEqual([]);
  });
});
