import { describe, expect, it, vi, beforeEach } from "vitest";

const getAdminBearerTokenMock = vi.fn((): string | null => "tok");

vi.mock("@/app/admin/shared/lib/adminAuth", () => ({
  getAdminBearerToken: (...args: unknown[]) => getAdminBearerTokenMock(...args),
}));

import { getHeaderMediaBearerToken } from "./headerMediaAuth";

describe("headerMediaAuth", () => {
  beforeEach(() => {
    getAdminBearerTokenMock.mockClear();
    getAdminBearerTokenMock.mockReturnValue("tok");
  });

  it("getHeaderMediaBearerToken calls through to getAdminBearerToken", () => {
    expect(getHeaderMediaBearerToken()).toBe("tok");
    expect(getAdminBearerTokenMock).toHaveBeenCalledOnce();
  });
});
