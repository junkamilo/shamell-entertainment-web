import { describe, expect, it, vi, beforeEach } from "vitest";

const getAdminBearerTokenMock = vi.fn((): string | null => "tok");

vi.mock("@/app/admin/shared/lib/adminAuth", () => ({
  getAdminBearerToken: (...args: unknown[]) => getAdminBearerTokenMock(...args),
}));

import { getServicesBearerToken } from "./servicesAuth";

describe("servicesAuth", () => {
  beforeEach(() => {
    getAdminBearerTokenMock.mockClear();
    getAdminBearerTokenMock.mockReturnValue("tok");
  });

  it("getServicesBearerToken calls through to getAdminBearerToken", () => {
    expect(getServicesBearerToken()).toBe("tok");
    expect(getAdminBearerTokenMock).toHaveBeenCalledOnce();
  });
});
