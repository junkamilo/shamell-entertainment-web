/** @vitest-environment jsdom */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";

const forgotPasswordActionMock = vi.fn();

vi.mock("../actions/forgotPasswordAction", () => ({
  forgotPasswordAction: (...args: unknown[]) =>
    forgotPasswordActionMock(...args),
}));

import { useForgotPassword } from "./useForgotPassword";
import { FIXTURE_USER_EMAIL } from "../test/fixtures/uuids.fixture";
import { makeDevResetLink } from "../test/helpers/mockForgotPassword";

describe("useForgotPassword", () => {
  beforeEach(() => {
    forgotPasswordActionMock.mockReset();
  });

  it("submits email and stores success message + resetLink", async () => {
    forgotPasswordActionMock.mockResolvedValue({
      ok: true,
      message: "Link sent.",
      resetLink: makeDevResetLink(),
    });

    const { result } = renderHook(() => useForgotPassword());

    act(() => {
      result.current.setEmail(FIXTURE_USER_EMAIL);
    });

    await act(async () => {
      await result.current.onSubmit({
        preventDefault: vi.fn(),
      } as unknown as React.FormEvent<HTMLFormElement>);
    });

    expect(forgotPasswordActionMock).toHaveBeenCalledWith(FIXTURE_USER_EMAIL);
    expect(result.current.message).toBe("Link sent.");
    expect(result.current.resetLink).toBe(makeDevResetLink());
    expect(result.current.email).toBe("");
    expect(result.current.isSubmitting).toBe(false);
  });

  it("stores error when action fails", async () => {
    forgotPasswordActionMock.mockResolvedValue({
      ok: false,
      message: "Please enter your email address.",
    });

    const { result } = renderHook(() => useForgotPassword());

    await act(async () => {
      await result.current.onSubmit({
        preventDefault: vi.fn(),
      } as unknown as React.FormEvent<HTMLFormElement>);
    });

    expect(result.current.error).toBe("Please enter your email address.");
    expect(result.current.message).toBeNull();
  });

  it("stores offline error when action throws", async () => {
    forgotPasswordActionMock.mockRejectedValue(new Error("network"));

    const { result } = renderHook(() => useForgotPassword());

    await act(async () => {
      await result.current.onSubmit({
        preventDefault: vi.fn(),
      } as unknown as React.FormEvent<HTMLFormElement>);
    });

    await waitFor(() => {
      expect(result.current.error).toMatch(/Cannot reach backend/);
    });
  });
});
