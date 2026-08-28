/** @vitest-environment jsdom */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { FIXTURE_USER_EMAIL } from "../test/fixtures/uuids.fixture";

const requestPasswordResetMock = vi.fn();

vi.mock("../services/requestPasswordReset", () => ({
  requestPasswordReset: (...args: unknown[]) =>
    requestPasswordResetMock(...args),
}));

import { useForgotPassword } from "./useForgotPassword";

function makeEvent(): React.FormEvent<HTMLFormElement> {
  return {
    preventDefault: vi.fn(),
  } as unknown as React.FormEvent<HTMLFormElement>;
}

describe("useForgotPassword", () => {
  beforeEach(() => {
    requestPasswordResetMock.mockReset();
  });

  it("rejects empty email without calling the API", async () => {
    const { result } = renderHook(() => useForgotPassword());

    await act(async () => {
      await result.current.onSubmit(makeEvent());
    });

    expect(requestPasswordResetMock).not.toHaveBeenCalled();
    expect(result.current.error).toBe("Please enter your email address.");
  });

  it("onSubmit success sets message and clears email", async () => {
    requestPasswordResetMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        message: "If this email exists, a secure recovery link has been sent.",
      }),
    });

    const { result } = renderHook(() => useForgotPassword());

    act(() => {
      result.current.setEmail(FIXTURE_USER_EMAIL);
    });

    await act(async () => {
      await result.current.onSubmit(makeEvent());
    });

    await waitFor(() => {
      expect(result.current.message).toMatch(/secure recovery link/i);
    });
    expect(requestPasswordResetMock).toHaveBeenCalledWith(FIXTURE_USER_EMAIL);
    expect(result.current.email).toBe("");
    expect(result.current.error).toBeNull();
  });

  it("onSubmit failure sets error from API", async () => {
    requestPasswordResetMock.mockResolvedValue({
      ok: false,
      json: async () => ({ message: "Rate limited." }),
    });

    const { result } = renderHook(() => useForgotPassword());

    act(() => {
      result.current.setEmail(FIXTURE_USER_EMAIL);
    });

    await act(async () => {
      await result.current.onSubmit(makeEvent());
    });

    await waitFor(() => {
      expect(result.current.error).toBe("Rate limited.");
    });
  });

  it("onSubmit network error sets reachability message", async () => {
    requestPasswordResetMock.mockRejectedValue(new Error("network"));

    const { result } = renderHook(() => useForgotPassword());

    act(() => {
      result.current.setEmail(FIXTURE_USER_EMAIL);
    });

    await act(async () => {
      await result.current.onSubmit(makeEvent());
    });

    await waitFor(() => {
      expect(result.current.error).toMatch(/Cannot reach backend/i);
    });
  });
});
