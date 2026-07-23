import { describe, it, expect, vi, beforeEach } from "vitest";

const toastMock = vi.fn();
const readTokenMock = vi.fn((): string | null => "token-1");

vi.mock("@/hooks/use-toast", () => ({
  toast: (...args: unknown[]) => toastMock(...args),
}));

vi.mock("@/app/admin/shared/lib/adminAuth", () => ({
  getAdminBearerToken: () => readTokenMock(),
}));

import { getAdminBearerToken } from "./aboutAdminAuth";

describe("getAdminBearerToken (about)", () => {
  beforeEach(() => {
    toastMock.mockClear();
    readTokenMock.mockReturnValue("token-1");
  });

  it("returns the session token when present", () => {
    expect(getAdminBearerToken()).toBe("token-1");
    expect(toastMock).not.toHaveBeenCalled();
  });

  it("toasts and returns null when the session is missing", () => {
    readTokenMock.mockReturnValue(null);
    expect(getAdminBearerToken()).toBeNull();
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({
        variant: "destructive",
        title: "Sign-in required",
      }),
    );
  });

  it("toasts and returns null for an empty token string", () => {
    readTokenMock.mockReturnValue("");
    expect(getAdminBearerToken()).toBeNull();
    expect(toastMock).toHaveBeenCalledOnce();
  });
});
