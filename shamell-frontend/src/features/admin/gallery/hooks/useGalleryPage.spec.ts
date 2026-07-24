/** @vitest-environment jsdom */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import {
  makeGalleryCategoriesApiPayload,
  makeGalleryPhotosApiPayload,
} from "../test/fixtures/gallery.fixture";
import {
  FIXTURE_CATEGORY_ID,
  FIXTURE_PHOTO_ID,
  FIXTURE_PHOTO_ID_2,
} from "../test/fixtures/uuids.fixture";

const toastMock = vi.fn();
const getTokenMock = vi.fn((): string | null => "token-1");

vi.mock("@/hooks/use-toast", () => ({
  toast: (...args: unknown[]) => toastMock(...args),
}));

vi.mock("../lib/galleryAuth", () => ({
  getGalleryBearerToken: () => getTokenMock(),
}));

import { useGalleryPage } from "./useGalleryPage";

describe("useGalleryPage", () => {
  beforeEach(() => {
    toastMock.mockClear();
    getTokenMock.mockReturnValue("token-1");
  });

  it("loads catalog after mount", async () => {
    const { result } = renderHook(() => useGalleryPage());

    await waitFor(() => expect(result.current.catalog.isLoading).toBe(false));
    expect(result.current.catalog.photos.length).toBeGreaterThan(0);
    expect(result.current.library.stats.total).toBeGreaterThan(0);
  });

  it("openPhotoModalForCreate opens the modal", async () => {
    const { result } = renderHook(() => useGalleryPage());
    await waitFor(() => expect(result.current.catalog.isLoading).toBe(false));

    act(() => {
      result.current.openPhotoModalForCreate();
    });

    expect(result.current.isPhotoModalOpen).toBe(true);
    expect(result.current.form.editingPhotoId).toBeNull();
  });

  it("startPhotoEdit opens the modal with editing id", async () => {
    const { result } = renderHook(() => useGalleryPage());
    await waitFor(() =>
      expect(result.current.catalog.photos.length).toBeGreaterThan(0),
    );

    const photo = result.current.catalog.photos[0]!;

    act(() => {
      result.current.startPhotoEdit(photo);
    });

    expect(result.current.isPhotoModalOpen).toBe(true);
    expect(result.current.form.editingPhotoId).toBe(photo.id);
  });

  it("onTogglePhotoActive flips visibility via MSW", async () => {
    let photos = makeGalleryPhotosApiPayload();
    server.use(
      http.get("*/api/v1/gallery/admin/categories", () =>
        HttpResponse.json(makeGalleryCategoriesApiPayload()),
      ),
      http.get("*/api/v1/gallery/admin/photos", () => HttpResponse.json(photos)),
      http.patch("*/api/v1/gallery/admin/photos/:id", async ({ params, request }) => {
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

    const { result } = renderHook(() => useGalleryPage());
    await waitFor(() => expect(result.current.catalog.isLoading).toBe(false));

    const inactive = result.current.catalog.photos.find(
      (p) => p.id === FIXTURE_PHOTO_ID_2,
    );
    expect(inactive?.isActive).toBe(false);

    await act(async () => {
      await result.current.onTogglePhotoActive(inactive!);
    });

    await waitFor(() => {
      const updated = result.current.catalog.photos.find(
        (p) => p.id === FIXTURE_PHOTO_ID_2,
      );
      expect(updated?.isActive).toBe(true);
    });
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Visible on site" }),
    );
  });

  it("onDisablePhoto removes media via MSW", async () => {
    let photos = makeGalleryPhotosApiPayload();
    server.use(
      http.get("*/api/v1/gallery/admin/categories", () =>
        HttpResponse.json(makeGalleryCategoriesApiPayload()),
      ),
      http.get("*/api/v1/gallery/admin/photos", () => HttpResponse.json(photos)),
      http.delete("*/api/v1/gallery/admin/photos/:id", ({ params }) => {
        const id = String(params.id);
        photos = photos.filter((row) => row.id !== id);
        return HttpResponse.json({ ok: true });
      }),
    );

    const { result } = renderHook(() => useGalleryPage());
    await waitFor(() => expect(result.current.catalog.isLoading).toBe(false));

    await act(async () => {
      await result.current.onDisablePhoto(FIXTURE_PHOTO_ID);
    });

    await waitFor(() => {
      expect(
        result.current.catalog.photos.find((p) => p.id === FIXTURE_PHOTO_ID),
      ).toBeUndefined();
    });
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Media removed" }),
    );
  });

  it("onSubmitPhoto uploads when create form is valid", async () => {
    const { result } = renderHook(() => useGalleryPage());
    await waitFor(() => expect(result.current.catalog.isLoading).toBe(false));

    act(() => {
      result.current.openUploadToCategory(FIXTURE_CATEGORY_ID);
      result.current.form.setImageFiles([
        new File(["x"], "a.jpg", { type: "image/jpeg" }),
      ]);
    });

    await act(async () => {
      const event = {
        preventDefault: vi.fn(),
      } as unknown as React.FormEvent<HTMLFormElement>;
      await result.current.onSubmitPhoto(event);
    });

    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Upload complete" }),
    );
    expect(result.current.isPhotoModalOpen).toBe(false);
  });
});
