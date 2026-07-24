/** @vitest-environment jsdom */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, renderHook } from "@testing-library/react";

const resetPasswordActionMock = vi.fn();
const searchParamsGetMock = vi.fn((_key: string) => "token-abc" as string | null);

vi.mock("../actions/resetPasswordAction", () => ({
  resetPasswordAction: (...args: unknown[]) => resetPasswordActionMock(...args),
}));

vi.mock("next/navigation", () => ({
  useSearchParams: () => ({
    get: (key: string) => searchParamsGetMock(key),
  }),
}));

import { useResetPassword } from "./useResetPassword";
import { FIXTURE_NEW_PASSWORD } from "../test/fixtures/uuids.fixture";

describe("useResetPassword", () => {
  beforeEach(() => {
    resetPasswordActionMock.mockReset();
    searchParamsGetMock.mockReturnValue("token-abc");
  });

  it("exposes token from search params", () => {
    const { result } = renderHook(() => useResetPassword());
    expect(result.current.token).toBe("token-abc");
    expect(result.current.tokenError).toBeNull();
  });

  it("sets tokenError when token is missing", () => {
    searchParamsGetMock.mockReturnValue(null);
    const { result } = renderHook(() => useResetPassword());
    expect(result.current.tokenError).toBe(
      "Invalid or missing recovery link.",
    );
  });

  it("validates password length before calling action", async () => {
    const { result } = renderHook(() => useResetPassword());

    act(() => {
      result.current.setNewPassword("short");
      result.current.setConfirmPassword("short");
    });

    await act(async () => {
      await result.current.onSubmit({
        preventDefault: vi.fn(),
      } as unknown as React.FormEvent<HTMLFormElement>);
    });

    expect(resetPasswordActionMock).not.toHaveBeenCalled();
    expect(result.current.error).toBe(
      "Password must be at least 8 characters.",
    );
  });

  it("validates password confirmation match", async () => {
    const { result } = renderHook(() => useResetPassword());

    act(() => {
      result.current.setNewPassword(FIXTURE_NEW_PASSWORD);
      result.current.setConfirmPassword("Different1");
    });

    await act(async () => {
      await result.current.onSubmit({
        preventDefault: vi.fn(),
      } as unknown as React.FormEvent<HTMLFormElement>);
    });

    expect(resetPasswordActionMock).not.toHaveBeenCalled();
    expect(result.current.error).toBe("Passwords do not match.");
  });

  it("submits and stores success message", async () => {
    resetPasswordActionMock.mockResolvedValue({
      ok: true,
      message: "Password updated successfully.",
    });

    const { result } = renderHook(() => useResetPassword());

    act(() => {
      result.current.setNewPassword(FIXTURE_NEW_PASSWORD);
      result.current.setConfirmPassword(FIXTURE_NEW_PASSWORD);
    });

    await act(async () => {
      await result.current.onSubmit({
        preventDefault: vi.fn(),
      } as unknown as React.FormEvent<HTMLFormElement>);
    });

    expect(resetPasswordActionMock).toHaveBeenCalledWith(
      "token-abc",
      FIXTURE_NEW_PASSWORD,
    );
    expect(result.current.message).toBe("Password updated successfully.");
    expect(result.current.newPassword).toBe("");
    expect(result.current.confirmPassword).toBe("");
  });
});
