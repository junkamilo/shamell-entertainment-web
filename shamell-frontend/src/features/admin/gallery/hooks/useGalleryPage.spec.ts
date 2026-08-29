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
  FIXTURE_CATEGORY_ID_2,
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

    const active = result.current.catalog.photos.find((p) => p.isActive);
    await act(async () => {
      await result.current.onTogglePhotoActive(active!);
    });
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Hidden on site" }),
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

  it("validates photo submit and edits media", async () => {
    const { result } = renderHook(() => useGalleryPage());
    await waitFor(() => expect(result.current.catalog.isLoading).toBe(false));
    const event = { preventDefault: vi.fn() } as unknown as React.FormEvent<HTMLFormElement>;

    act(() => {
      result.current.openPhotoModalForCreate();
      result.current.closePhotoModal();
    });
    expect(result.current.isPhotoModalOpen).toBe(false);

    getTokenMock.mockReturnValue(null);
    await act(async () => {
      await result.current.onSubmitPhoto(event);
    });
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Sign-in required" }),
    );

    getTokenMock.mockReturnValue("token-1");
    act(() => {
      result.current.openPhotoModalForCreate();
      result.current.form.setSelectedCategoryId("");
    });
    await act(async () => {
      await result.current.onSubmitPhoto(event);
    });
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Choose category" }),
    );

    act(() => {
      result.current.openUploadToCategory(FIXTURE_CATEGORY_ID);
    });
    await act(async () => {
      await result.current.onSubmitPhoto(event);
    });
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: "File required" }),
    );

    act(() => {
      result.current.form.setImageFiles(
        Array.from({ length: 21 }, (_, i) => new File(["x"], `${i}.jpg`, { type: "image/jpeg" })),
      );
    });
    await act(async () => {
      await result.current.onSubmitPhoto(event);
    });
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Too many files" }),
    );

    const photo = result.current.catalog.photos[0]!;
    act(() => {
      result.current.startPhotoEdit(photo);
    });
    await act(async () => {
      await result.current.onSubmitPhoto(event);
    });
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: "No changes" }),
    );

    act(() => {
      result.current.startPhotoEdit(photo);
      result.current.form.setSelectedCategoryId(FIXTURE_CATEGORY_ID_2);
    });
    await act(async () => {
      await result.current.onSubmitPhoto(event);
    });
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Media updated" }),
    );
  });

  it("toasts empty batch and photo errors", async () => {
    server.use(
      http.post("*/api/v1/gallery/admin/photos", () => HttpResponse.json({ items: [] })),
    );
    const { result } = renderHook(() => useGalleryPage());
    await waitFor(() => expect(result.current.catalog.isLoading).toBe(false));
    const event = { preventDefault: vi.fn() } as unknown as React.FormEvent<HTMLFormElement>;

    act(() => {
      result.current.openUploadToCategory(FIXTURE_CATEGORY_ID);
      result.current.form.setImageFiles([
        new File(["x"], "a.jpg", { type: "image/jpeg" }),
      ]);
    });
    await act(async () => {
      await result.current.onSubmitPhoto(event);
    });
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({
        description: expect.stringContaining("The file was saved"),
      }),
    );

    server.use(http.post("*/api/v1/gallery/admin/photos", () => HttpResponse.error()));
    act(() => {
      result.current.openUploadToCategory(FIXTURE_CATEGORY_ID);
      result.current.form.setImageFiles([
        new File(["x"], "a.jpg", { type: "image/jpeg" }),
      ]);
    });
    await act(async () => {
      await result.current.onSubmitPhoto(event);
    });
    expect(toastMock).toHaveBeenCalledWith(expect.objectContaining({ title: "Offline" }));

    getTokenMock.mockReturnValue(null);
    await act(async () => {
      await result.current.onTogglePhotoActive(result.current.catalog.photos[0]!);
      await result.current.onDisablePhoto(FIXTURE_PHOTO_ID);
    });

    getTokenMock.mockReturnValue("token-1");
    server.use(
      http.patch("*/api/v1/gallery/admin/photos/:id", () =>
        HttpResponse.json({ message: "Nope" }, { status: 500 }),
      ),
      http.delete("*/api/v1/gallery/admin/photos/:id", () => HttpResponse.error()),
    );
    await act(async () => {
      await result.current.onDisablePhoto(FIXTURE_PHOTO_ID);
    });
    const activePhoto = result.current.catalog.photos.find((p) => p.isActive);
    if (activePhoto) {
      await act(async () => {
        await result.current.onTogglePhotoActive(activePhoto);
      });
    }
  });
});
