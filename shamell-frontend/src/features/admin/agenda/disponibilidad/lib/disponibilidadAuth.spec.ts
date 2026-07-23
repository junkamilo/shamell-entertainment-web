import { describe, it, expect, vi, beforeEach } from "vitest";

const getAdminBearerTokenMock = vi.fn((): string | null => "token-1");
const getAdminAuthHeadersMock = vi.fn((): HeadersInit => ({
  Authorization: "Bearer token-1",
  "Content-Type": "application/json",
}));

vi.mock("@/app/admin/shared/lib/adminAuth", () => ({
  getAdminBearerToken: (...args: unknown[]) => getAdminBearerTokenMock(...args),
  getAdminAuthHeaders: (...args: unknown[]) => getAdminAuthHeadersMock(...args),
}));

import {
  getDisponibilidadBearerToken,
  getDisponibilidadAuthHeaders,
} from "./disponibilidadAuth";

describe("disponibilidadAuth", () => {
  beforeEach(() => {
    getAdminBearerTokenMock.mockClear();
    getAdminAuthHeadersMock.mockClear();
  });

  it("getDisponibilidadBearerToken calls through to getAdminBearerToken", () => {
    expect(getDisponibilidadBearerToken()).toBe("token-1");
    expect(getAdminBearerTokenMock).toHaveBeenCalledOnce();
  });

  it("getDisponibilidadAuthHeaders calls through to getAdminAuthHeaders", () => {
    expect(getDisponibilidadAuthHeaders()).toEqual({
      Authorization: "Bearer token-1",
      "Content-Type": "application/json",
    });
    expect(getAdminAuthHeadersMock).toHaveBeenCalledOnce();
  });

  it("getDisponibilidadAuthHeaders forwards its arguments", () => {
    getDisponibilidadAuthHeaders(false);
    expect(getAdminAuthHeadersMock).toHaveBeenCalledWith(false);
  });
});
