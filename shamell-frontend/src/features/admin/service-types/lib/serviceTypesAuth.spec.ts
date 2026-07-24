import { describe, expect, it, vi, beforeEach } from "vitest";

const getAdminBearerTokenMock = vi.fn((): string | null => "tok");

vi.mock("@/app/admin/shared/lib/adminAuth", () => ({
  getAdminBearerToken: (...args: unknown[]) => getAdminBearerTokenMock(...args),
}));

import { getServiceTypesBearerToken } from "./serviceTypesAuth";

describe("serviceTypesAuth", () => {
  beforeEach(() => {
    getAdminBearerTokenMock.mockClear();
    getAdminBearerTokenMock.mockReturnValue("tok");
  });

  it("getServiceTypesBearerToken calls through to getAdminBearerToken", () => {
    expect(getServiceTypesBearerToken()).toBe("tok");
    expect(getAdminBearerTokenMock).toHaveBeenCalledOnce();
  });
});
