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

import { getGalleryAuthHeaders, getGalleryBearerToken } from "./galleryAuth";

describe("galleryAuth", () => {
  beforeEach(() => {
    getAdminBearerTokenMock.mockClear();
    getAdminAuthHeadersMock.mockClear();
    getAdminBearerTokenMock.mockReturnValue("tok");
    getAdminAuthHeadersMock.mockReturnValue({
      Authorization: "Bearer tok",
      "Content-Type": "application/json",
    });
  });

  it("getGalleryBearerToken calls through to getAdminBearerToken", () => {
    expect(getGalleryBearerToken()).toBe("tok");
    expect(getAdminBearerTokenMock).toHaveBeenCalledOnce();
  });

  it("getGalleryAuthHeaders calls through to getAdminAuthHeaders", () => {
    expect(getGalleryAuthHeaders()).toEqual({
      Authorization: "Bearer tok",
      "Content-Type": "application/json",
    });
    expect(getAdminAuthHeadersMock).toHaveBeenCalledOnce();
  });

  it("getGalleryAuthHeaders forwards its arguments", () => {
    getGalleryAuthHeaders(false);
    expect(getAdminAuthHeadersMock).toHaveBeenCalledWith(false);
  });
});
