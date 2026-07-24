/** @vitest-environment jsdom */

import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import { makeHeaderPhotosApiPayload } from "../test/fixtures/headerMedia.fixture";
import {
  FIXTURE_HEADER_PHOTO_ID,
  FIXTURE_HEADER_PHOTO_ID_2,
} from "../test/fixtures/uuids.fixture";

const toastMock = vi.fn();
const getTokenMock = vi.fn((): string | null => "token-1");

vi.mock("@/hooks/use-toast", () => ({
  toast: (...args: unknown[]) => toastMock(...args),
}));

vi.mock("../lib/headerMediaAuth", () => ({
  getHeaderMediaBearerToken: () => getTokenMock(),
}));

import { useHeaderMediaPage } from "./useHeaderMediaPage";

describe("useHeaderMediaPage", () => {
  beforeEach(() => {
    toastMock.mockClear();
    getTokenMock.mockReturnValue("token-1");
    vi.stubGlobal(
      "URL",
      Object.assign(URL, {
        createObjectURL: vi.fn(() => "blob:preview"),
        revokeObjectURL: vi.fn(),
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("loads library after mount", async () => {
    const { result } = renderHook(() => useHeaderMediaPage());
    await waitFor(() => expect(result.current.library.isLoading).toBe(false));
    expect(result.current.library.photos.length).toBeGreaterThan(0);
  });

  it("onSubmit uploads pending files", async () => {
    const { result } = renderHook(() => useHeaderMediaPage());
    await waitFor(() => expect(result.current.library.isLoading).toBe(false));

    act(() => {
      result.current.upload.mergeFiles([
        new File(["x"], "a.jpg", { type: "image/jpeg" }),
      ]);
    });

    await act(async () => {
      await result.current.onSubmit({
        preventDefault: vi.fn(),
      } as unknown as React.FormEvent);
    });

    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Media uploaded" }),
    );
    expect(result.current.upload.pendingFiles).toHaveLength(0);
  });

  it("onToggle flips visibility via MSW", async () => {
    let photos = makeHeaderPhotosApiPayload();
    server.use(
      http.get("*/api/v1/header-media/admin", () => HttpResponse.json(photos)),
      http.patch("*/api/v1/header-media/admin/photos/:id", async ({ params, request }) => {
        const body = (await request.json()) as { isActive?: boolean };
        const id = String(params.id);
        if (typeof body.isActive === "boolean") {
          photos = photos.map((row) =>
            row.id === id ? { ...row, isActive: body.isActive! } : row,
          );
        }
        return HttpResponse.json({ ok: true });
      }),
    );

    const { result } = renderHook(() => useHeaderMediaPage());
    await waitFor(() => expect(result.current.library.isLoading).toBe(false));

    const inactive = result.current.library.photos.find(
      (p) => p.id === FIXTURE_HEADER_PHOTO_ID_2,
    );

    await act(async () => {
      await result.current.onToggle(inactive!);
    });

    await waitFor(() => {
      expect(
        result.current.library.photos.find((p) => p.id === FIXTURE_HEADER_PHOTO_ID_2)
          ?.isActive,
      ).toBe(true);
    });
  });

  it("openDeleteConfirm then onConfirmDelete removes media", async () => {
    let photos = makeHeaderPhotosApiPayload();
    server.use(
      http.get("*/api/v1/header-media/admin", () => HttpResponse.json(photos)),
      http.delete("*/api/v1/header-media/admin/photos/:id", ({ params }) => {
        photos = photos.filter((row) => row.id !== String(params.id));
        return HttpResponse.json({ ok: true });
      }),
    );

    const { result } = renderHook(() => useHeaderMediaPage());
    await waitFor(() => expect(result.current.library.isLoading).toBe(false));

    const photo = result.current.library.photos.find(
      (p) => p.id === FIXTURE_HEADER_PHOTO_ID,
    )!;

    act(() => {
      result.current.openDeleteConfirm(photo);
    });
    expect(result.current.pendingDelete?.id).toBe(FIXTURE_HEADER_PHOTO_ID);

    await act(async () => {
      await result.current.onConfirmDelete();
    });

    await waitFor(() => {
      expect(
        result.current.library.photos.find((p) => p.id === FIXTURE_HEADER_PHOTO_ID),
      ).toBeUndefined();
    });
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Item removed" }),
    );
  });
});
