/** @vitest-environment jsdom */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import {
  FIXTURE_ADMIN_EMAIL,
  FIXTURE_ADMIN_FULL_NAME,
  FIXTURE_ADMIN_PASSWORD,
  FIXTURE_ADMIN_TOKEN,
  FIXTURE_INVITE_CODE,
} from "../test/fixtures/uuids.fixture";

const toastMock = vi.fn();
const getTokenMock = vi.fn((): string | null => FIXTURE_ADMIN_TOKEN);
const postAdminInviteMock = vi.fn(async () => undefined);
const postAdminInviteVerifyMock = vi.fn(async () => undefined);

vi.mock("@/hooks/use-toast", () => ({
  toast: (...args: unknown[]) => toastMock(...args),
}));

vi.mock("../lib/agregarAdminAuth", () => ({
  getAgregarAdminBearerToken: () => getTokenMock(),
}));

vi.mock("../services/postAdminInvite", () => ({
  postAdminInvite: (...args: unknown[]) => postAdminInviteMock(...args),
}));

vi.mock("../services/postAdminInviteVerify", () => ({
  postAdminInviteVerify: (...args: unknown[]) => postAdminInviteVerifyMock(...args),
}));

import { useAgregarAdminPage } from "./useAgregarAdminPage";

function makeEvent(): React.FormEvent<HTMLFormElement> {
  return { preventDefault: vi.fn() } as unknown as React.FormEvent<HTMLFormElement>;
}

describe("useAgregarAdminPage", () => {
  beforeEach(() => {
    toastMock.mockClear();
    getTokenMock.mockReturnValue(FIXTURE_ADMIN_TOKEN);
    postAdminInviteMock.mockClear();
    postAdminInviteMock.mockResolvedValue(undefined);
    postAdminInviteVerifyMock.mockClear();
    postAdminInviteVerifyMock.mockResolvedValue(undefined);
  });

  it("sendVerificationCode without token toasts Sign-in required", async () => {
    getTokenMock.mockReturnValue(null);
    const { result } = renderHook(() => useAgregarAdminPage());

    await act(async () => {
      await result.current.sendVerificationCode();
    });

    expect(postAdminInviteMock).not.toHaveBeenCalled();
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({
        variant: "destructive",
        title: "Sign-in required",
      }),
    );
  });

  it("sendVerificationCode with empty email toasts Incomplete form", async () => {
    const { result } = renderHook(() => useAgregarAdminPage());

    act(() => {
      result.current.form.setEmail("");
      result.current.form.setFullName(FIXTURE_ADMIN_FULL_NAME);
    });

    await act(async () => {
      await result.current.sendVerificationCode();
    });

    expect(postAdminInviteMock).not.toHaveBeenCalled();
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({
        variant: "destructive",
        title: "Incomplete form",
      }),
    );
  });

  it("sendVerificationCode success sets phase 2 and toasts Invitation sent", async () => {
    const { result } = renderHook(() => useAgregarAdminPage());

    act(() => {
      result.current.form.setEmail(`  ${FIXTURE_ADMIN_EMAIL.toUpperCase()}  `);
      result.current.form.setFullName(`  ${FIXTURE_ADMIN_FULL_NAME}  `);
    });

    await act(async () => {
      await result.current.sendVerificationCode();
    });

    expect(postAdminInviteMock).toHaveBeenCalledWith({
      email: FIXTURE_ADMIN_EMAIL,
      fullName: FIXTURE_ADMIN_FULL_NAME,
    });
    await waitFor(() => {
      expect(result.current.form.phase).toBe(2);
    });
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Invitation sent" }),
    );
  });

  it("onAddAdmin with bad code toasts Invalid code", async () => {
    const { result } = renderHook(() => useAgregarAdminPage());

    act(() => {
      result.current.form.setEmail(FIXTURE_ADMIN_EMAIL);
      result.current.form.setCode("12ab");
      result.current.form.setPassword(FIXTURE_ADMIN_PASSWORD);
    });

    await act(async () => {
      await result.current.onAddAdmin(makeEvent());
    });

    expect(postAdminInviteVerifyMock).not.toHaveBeenCalled();
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({
        variant: "destructive",
        title: "Invalid code",
      }),
    );
  });

  it("onAddAdmin success toasts Administrator created and resetFlow", async () => {
    const { result } = renderHook(() => useAgregarAdminPage());

    act(() => {
      result.current.form.setPhase(2);
      result.current.form.setEmail(FIXTURE_ADMIN_EMAIL);
      result.current.form.setFullName(FIXTURE_ADMIN_FULL_NAME);
      result.current.form.setCode(FIXTURE_INVITE_CODE);
      result.current.form.setPassword(FIXTURE_ADMIN_PASSWORD);
    });

    await act(async () => {
      await result.current.onAddAdmin(makeEvent());
    });

    expect(postAdminInviteVerifyMock).toHaveBeenCalledWith({
      email: FIXTURE_ADMIN_EMAIL,
      code: FIXTURE_INVITE_CODE,
      password: FIXTURE_ADMIN_PASSWORD,
    });
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Administrator created" }),
    );
    await waitFor(() => {
      expect(result.current.form.phase).toBe(1);
      expect(result.current.form.email).toBe("");
      expect(result.current.form.fullName).toBe("");
      expect(result.current.form.code).toBe("");
      expect(result.current.form.password).toBe("");
    });
  });
});
