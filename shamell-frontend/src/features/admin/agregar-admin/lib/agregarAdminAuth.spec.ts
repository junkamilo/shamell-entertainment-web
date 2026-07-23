import { beforeEach, describe, expect, it, vi } from "vitest";

const getAdminBearerTokenMock = vi.fn((): string | null => "tok");
const getAdminAuthHeadersMock = vi.fn((): HeadersInit => ({
  "Content-Type": "application/json",
  Authorization: "Bearer tok",
}));

vi.mock("@/app/admin/shared/lib/adminAuth", () => ({
  getAdminBearerToken: (...args: unknown[]) => getAdminBearerTokenMock(...args),
  getAdminAuthHeaders: (...args: unknown[]) => getAdminAuthHeadersMock(...args),
}));

import {
  getAgregarAdminAuthHeaders,
  getAgregarAdminBearerToken,
} from "./agregarAdminAuth";

describe("agregarAdminAuth", () => {
  beforeEach(() => {
    getAdminBearerTokenMock.mockClear();
    getAdminAuthHeadersMock.mockClear();
    getAdminBearerTokenMock.mockReturnValue("tok");
    getAdminAuthHeadersMock.mockReturnValue({
      "Content-Type": "application/json",
      Authorization: "Bearer tok",
    });
  });

  it("getAgregarAdminBearerToken calls through to getAdminBearerToken", () => {
    expect(getAgregarAdminBearerToken()).toBe("tok");
    expect(getAdminBearerTokenMock).toHaveBeenCalledOnce();
  });

  it("getAgregarAdminAuthHeaders calls through to getAdminAuthHeaders", () => {
    expect(getAgregarAdminAuthHeaders()).toEqual({
      "Content-Type": "application/json",
      Authorization: "Bearer tok",
    });
    expect(getAdminAuthHeadersMock).toHaveBeenCalledOnce();
  });
});
