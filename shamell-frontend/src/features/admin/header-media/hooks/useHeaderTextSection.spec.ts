/** @vitest-environment jsdom */

import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { DEFAULT_HEADER_TEXT } from "@/lib/headerTextTypes";
import { FIXTURE_HEADER_TEXT_ID } from "../test/fixtures/uuids.fixture";

const toastMock = vi.fn();
const getTokenMock = vi.fn((): string | null => "token-1");

vi.mock("@/hooks/use-toast", () => ({
  toast: (...args: unknown[]) => toastMock(...args),
}));

vi.mock("../lib/headerMediaAuth", () => ({
  getHeaderMediaBearerToken: () => getTokenMock(),
}));

import { useHeaderTextForm, useHeaderTextSection } from "./useHeaderTextSection";

describe("useHeaderTextSection", () => {
  beforeEach(() => {
    toastMock.mockClear();
    getTokenMock.mockReturnValue("token-1");
  });

  it("loads header text via MSW", async () => {
    const { result } = renderHook(() => useHeaderTextSection());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.record?.id).toBe(FIXTURE_HEADER_TEXT_ID);
    expect(result.current.previewContent.headline).toBeTruthy();
  });

  it("openEditModal syncs form and opens modal", async () => {
    const { result } = renderHook(() => useHeaderTextSection());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => {
      result.current.openEditModal();
    });

    expect(result.current.isModalOpen).toBe(true);
    expect(result.current.form.headline).toBe(result.current.record?.headline);
  });

  it("stops loading when there is no token", async () => {
    getTokenMock.mockReturnValue(null);
    const { result } = renderHook(() => useHeaderTextSection());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.record).toBeNull();
  });
});

describe("useHeaderTextForm", () => {
  beforeEach(() => {
    toastMock.mockClear();
    getTokenMock.mockReturnValue("token-1");
  });

  it("validates required fields before submit", async () => {
    const onSaved = vi.fn(async () => undefined);
    const { result } = renderHook(() => useHeaderTextForm(onSaved));

    act(() => {
      result.current.setHeadline("");
    });

    await act(async () => {
      const ok = await result.current.onSubmit({
        preventDefault: vi.fn(),
      } as unknown as React.FormEvent<HTMLFormElement>);
      expect(ok).toBe(false);
    });

    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Check the form" }),
    );
    expect(onSaved).not.toHaveBeenCalled();
  });

  it("submits valid draft and calls onSaved", async () => {
    const onSaved = vi.fn(async () => undefined);
    const { result } = renderHook(() => useHeaderTextForm(onSaved));

    act(() => {
      result.current.syncFormFromRecord({
        id: FIXTURE_HEADER_TEXT_ID,
        ...DEFAULT_HEADER_TEXT,
        isActive: true,
        updatedAt: null,
      });
    });

    await act(async () => {
      const ok = await result.current.onSubmit({
        preventDefault: vi.fn(),
      } as unknown as React.FormEvent<HTMLFormElement>);
      expect(ok).toBe(true);
    });

    expect(onSaved).toHaveBeenCalled();
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Header text saved" }),
    );
  });
});
