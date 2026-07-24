/** @vitest-environment jsdom */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import {
  makeGalleryCategoriesApiPayload,
  makeGalleryCategoryPreviewsApiPayload,
} from "../test/fixtures/galleryCategories.fixture";
import {
  FIXTURE_CATEGORY_ID,
  FIXTURE_CATEGORY_ID_2,
} from "../test/fixtures/uuids.fixture";

const toastMock = vi.fn();
const getTokenMock = vi.fn((): string | null => "token-1");

vi.mock("@/hooks/use-toast", () => ({
  toast: (...args: unknown[]) => toastMock(...args),
}));

vi.mock("@/features/admin/gallery/lib/galleryAuth", () => ({
  getGalleryBearerToken: () => getTokenMock(),
}));

import { useGalleryCategoriesPage } from "./useGalleryCategoriesPage";

describe("useGalleryCategoriesPage", () => {
  beforeEach(() => {
    toastMock.mockClear();
    getTokenMock.mockReturnValue("token-1");
    server.use(
      http.get("*/api/v1/gallery/admin/categories", () =>
        HttpResponse.json(makeGalleryCategoriesApiPayload()),
      ),
      http.get("*/api/v1/gallery/admin/photos", () =>
        HttpResponse.json(makeGalleryCategoryPreviewsApiPayload()),
      ),
    );
  });

  it("loads catalog after mount", async () => {
    const { result } = renderHook(() => useGalleryCategoriesPage());

    await waitFor(() => expect(result.current.catalog.isLoading).toBe(false));
    expect(result.current.catalog.categories.length).toBeGreaterThan(0);
    expect(result.current.list.stats.total).toBeGreaterThan(0);
  });

  it("openCategoryCreate opens the modal", async () => {
    const { result } = renderHook(() => useGalleryCategoriesPage());
    await waitFor(() => expect(result.current.catalog.isLoading).toBe(false));

    act(() => {
      result.current.form.openCategoryCreate();
    });

    expect(result.current.form.isCategoryModalOpen).toBe(true);
    expect(result.current.form.editingCategoryId).toBeNull();
  });

  it("startCategoryEdit opens modal with name", async () => {
    const { result } = renderHook(() => useGalleryCategoriesPage());
    await waitFor(() =>
      expect(result.current.catalog.categories.length).toBeGreaterThan(0),
    );

    const category = result.current.catalog.categories[0]!;

    act(() => {
      result.current.form.startCategoryEdit(category);
    });

    expect(result.current.form.isCategoryModalOpen).toBe(true);
    expect(result.current.form.editingCategoryId).toBe(category.id);
    expect(result.current.form.categoryName).toBe(category.name);
  });

  it("onToggleCategoryActive flips visibility via MSW", async () => {
    let categories = makeGalleryCategoriesApiPayload();
    server.use(
      http.get("*/api/v1/gallery/admin/categories", () =>
        HttpResponse.json(categories),
      ),
      http.get("*/api/v1/gallery/admin/photos", () =>
        HttpResponse.json(makeGalleryCategoryPreviewsApiPayload()),
      ),
      http.patch("*/api/v1/gallery/admin/categories/:id", async ({ params, request }) => {
        const body = (await request.json()) as { isActive?: boolean };
        const id = String(params.id);
        if (typeof body.isActive === "boolean") {
          categories = categories.map((row) =>
            row.id === id ? { ...row, isActive: body.isActive! } : row,
          );
        }
        return HttpResponse.json({ ok: true });
      }),
    );

    const { result } = renderHook(() => useGalleryCategoriesPage());
    await waitFor(() => expect(result.current.catalog.isLoading).toBe(false));

    const inactive = result.current.catalog.categories.find(
      (c) => c.id === FIXTURE_CATEGORY_ID_2,
    );
    expect(inactive?.isActive).toBe(false);

    await act(async () => {
      await result.current.onToggleCategoryActive(inactive!);
    });

    await waitFor(() => {
      const updated = result.current.catalog.categories.find(
        (c) => c.id === FIXTURE_CATEGORY_ID_2,
      );
      expect(updated?.isActive).toBe(true);
    });
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Category visible" }),
    );
  });

  it("onSubmitCategory creates when name is valid", async () => {
    const { result } = renderHook(() => useGalleryCategoriesPage());
    await waitFor(() => expect(result.current.catalog.isLoading).toBe(false));

    act(() => {
      result.current.form.openCategoryCreate();
      result.current.form.setCategoryName("New album");
    });

    await act(async () => {
      const event = {
        preventDefault: vi.fn(),
      } as unknown as React.FormEvent<HTMLFormElement>;
      await result.current.onSubmitCategory(event);
    });

    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Category created" }),
    );
    expect(result.current.form.isCategoryModalOpen).toBe(false);
  });

  it("onSubmitCategory updates when editing", async () => {
    const { result } = renderHook(() => useGalleryCategoriesPage());
    await waitFor(() =>
      expect(result.current.catalog.categories.length).toBeGreaterThan(0),
    );

    act(() => {
      result.current.form.startCategoryEdit(
        result.current.catalog.categories.find((c) => c.id === FIXTURE_CATEGORY_ID)!,
      );
      result.current.form.setCategoryName("Renamed");
    });

    await act(async () => {
      const event = {
        preventDefault: vi.fn(),
      } as unknown as React.FormEvent<HTMLFormElement>;
      await result.current.onSubmitCategory(event);
    });

    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Category updated" }),
    );
  });
});
