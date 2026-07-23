import { describe, expect, it, vi, beforeEach } from "vitest";

const getAdminBearerTokenMock = vi.fn((): string | null => "tok");
const getAdminAuthHeadersMock = vi.fn((): HeadersInit => ({
  Authorization: "Bearer tok",
  "Content-Type": "application/json",
}));

vi.mock("@/app/admin/shared/lib/adminAuth", () => ({
  getAdminBearerToken: (...args: unknown[]) => getAdminBearerTokenMock(...args),
  getAdminAuthHeaders: (...args: unknown[]) => getAdminAuthHeadersMock(...args),
}));

import { getEventTypesAuthHeaders, getEventTypesBearerToken } from "./eventTypesAuth";

describe("eventTypesAuth", () => {
  beforeEach(() => {
    getAdminBearerTokenMock.mockClear();
    getAdminAuthHeadersMock.mockClear();
    getAdminBearerTokenMock.mockReturnValue("tok");
    getAdminAuthHeadersMock.mockReturnValue({
      Authorization: "Bearer tok",
      "Content-Type": "application/json",
    });
  });

  it("getEventTypesBearerToken calls through to getAdminBearerToken", () => {
    expect(getEventTypesBearerToken()).toBe("tok");
    expect(getAdminBearerTokenMock).toHaveBeenCalledOnce();
  });

  it("getEventTypesAuthHeaders calls through to getAdminAuthHeaders", () => {
    expect(getEventTypesAuthHeaders()).toEqual({
      Authorization: "Bearer tok",
      "Content-Type": "application/json",
    });
    expect(getAdminAuthHeadersMock).toHaveBeenCalledOnce();
  });

  it("getEventTypesAuthHeaders forwards its arguments", () => {
    getEventTypesAuthHeaders(false);
    expect(getAdminAuthHeadersMock).toHaveBeenCalledWith(false);
  });
});
