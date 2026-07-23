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

import { getEventsAuthHeaders, getEventsBearerToken } from "./eventsAuth";

describe("eventsAuth", () => {
  beforeEach(() => {
    getAdminBearerTokenMock.mockClear();
    getAdminAuthHeadersMock.mockClear();
    getAdminBearerTokenMock.mockReturnValue("tok");
    getAdminAuthHeadersMock.mockReturnValue({
      Authorization: "Bearer tok",
      "Content-Type": "application/json",
    });
  });

  it("getEventsBearerToken calls through to getAdminBearerToken", () => {
    expect(getEventsBearerToken()).toBe("tok");
    expect(getAdminBearerTokenMock).toHaveBeenCalledOnce();
  });

  it("getEventsAuthHeaders calls through to getAdminAuthHeaders", () => {
    expect(getEventsAuthHeaders()).toEqual({
      Authorization: "Bearer tok",
      "Content-Type": "application/json",
    });
    expect(getAdminAuthHeadersMock).toHaveBeenCalledOnce();
  });

  it("getEventsAuthHeaders forwards its arguments", () => {
    getEventsAuthHeaders(false);
    expect(getAdminAuthHeadersMock).toHaveBeenCalledWith(false);
  });
});
