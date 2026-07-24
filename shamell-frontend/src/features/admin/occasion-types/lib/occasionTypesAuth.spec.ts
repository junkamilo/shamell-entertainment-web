import { describe, expect, it, vi, beforeEach } from "vitest";

const getAdminBearerTokenMock = vi.fn((): string | null => "tok");

vi.mock("@/app/admin/shared/lib/adminAuth", () => ({
  getAdminBearerToken: (...args: unknown[]) => getAdminBearerTokenMock(...args),
}));

import { getOccasionTypesBearerToken } from "./occasionTypesAuth";

describe("occasionTypesAuth", () => {
  beforeEach(() => {
    getAdminBearerTokenMock.mockClear();
    getAdminBearerTokenMock.mockReturnValue("tok");
  });

  it("getOccasionTypesBearerToken calls through to getAdminBearerToken", () => {
    expect(getOccasionTypesBearerToken()).toBe("tok");
    expect(getAdminBearerTokenMock).toHaveBeenCalledOnce();
  });
});
