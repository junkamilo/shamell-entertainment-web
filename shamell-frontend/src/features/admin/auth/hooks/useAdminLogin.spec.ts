/** @vitest-environment jsdom */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import {
  FIXTURE_ACCESS_TOKEN,
  FIXTURE_ADMIN_EMAIL,
  FIXTURE_ADMIN_PASSWORD,
} from "../test/fixtures/uuids.fixture";
import {
  makeLoginActionFailure,
  makeLoginActionSuccess,
} from "../test/fixtures/auth.fixture";
import { ADMIN_ACCESS_TOKEN_KEY } from "@/lib/adminSession";

const push = vi.fn();
const loginAdminActionMock = vi.fn();
const notifyAdminSessionChangedMock = vi.fn();
const persistAdminSessionUserMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

vi.mock("../actions/authActions", () => ({
  loginAdminAction: (...args: unknown[]) => loginAdminActionMock(...args),
}));

vi.mock("@/lib/adminSession", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/adminSession")>();
  return {
    ...actual,
    notifyAdminSessionChanged: (...args: unknown[]) =>
      notifyAdminSessionChangedMock(...args),
    persistAdminSessionUser: (...args: unknown[]) =>
      persistAdminSessionUserMock(...args),
  };
});

import { useAdminLogin } from "./useAdminLogin";

function makeEvent(): React.FormEvent<HTMLFormElement> {
  return { preventDefault: vi.fn() } as unknown as React.FormEvent<HTMLFormElement>;
}

describe("useAdminLogin", () => {
  beforeEach(() => {
    localStorage.clear();
    push.mockClear();
    loginAdminActionMock.mockReset();
    notifyAdminSessionChangedMock.mockClear();
    persistAdminSessionUserMock.mockClear();
  });

  it("defaults empty email/password", () => {
    const { result } = renderHook(() => useAdminLogin());

    expect(result.current.email).toBe("");
    expect(result.current.password).toBe("");
    expect(result.current.error).toBeNull();
    expect(result.current.message).toBeNull();
    expect(result.current.isSubmitting).toBe(false);
  });

  it("onSubmit failure sets error from result.message", async () => {
    const failure = makeLoginActionFailure({
      message: "Invalid admin credentials.",
    });
    loginAdminActionMock.mockResolvedValue(failure);

    const { result } = renderHook(() => useAdminLogin());

    act(() => {
      result.current.setEmail(FIXTURE_ADMIN_EMAIL);
      result.current.setPassword(FIXTURE_ADMIN_PASSWORD);
    });

    await act(async () => {
      await result.current.onSubmit(makeEvent());
    });

    await waitFor(() => {
      expect(result.current.error).toBe("Invalid admin credentials.");
    });
    expect(result.current.message).toBeNull();
    expect(localStorage.getItem(ADMIN_ACCESS_TOKEN_KEY)).toBeNull();
    expect(push).not.toHaveBeenCalled();
    expect(notifyAdminSessionChangedMock).not.toHaveBeenCalled();
  });

  it("onSubmit success stores token in localStorage, sets message, calls router.push(\"/admin\")", async () => {
    const success = makeLoginActionSuccess();
    loginAdminActionMock.mockResolvedValue(success);

    const { result } = renderHook(() => useAdminLogin());

    act(() => {
      result.current.setEmail(FIXTURE_ADMIN_EMAIL);
      result.current.setPassword(FIXTURE_ADMIN_PASSWORD);
    });

    await act(async () => {
      await result.current.onSubmit(makeEvent());
    });

    await waitFor(() => {
      expect(result.current.message).toBe(
        "Admin login successful. Redirecting...",
      );
    });
    expect(localStorage.getItem(ADMIN_ACCESS_TOKEN_KEY)).toBe(
      FIXTURE_ACCESS_TOKEN,
    );
    expect(persistAdminSessionUserMock).toHaveBeenCalledWith(success.user);
    expect(notifyAdminSessionChangedMock).toHaveBeenCalled();
    expect(push).toHaveBeenCalledWith("/admin");
    expect(result.current.error).toBeNull();
  });
});
