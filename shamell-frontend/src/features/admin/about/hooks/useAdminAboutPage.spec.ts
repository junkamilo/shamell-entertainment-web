/** @vitest-environment jsdom */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { makeAdminAboutRow } from "../test/fixtures/about.fixture";

const record = makeAdminAboutRow({ title: "Page About" });
const reload = vi.fn(async () => undefined);
const syncFormFromRecord = vi.fn();
const resetFormOnClose = vi.fn();
const deleteSavedHeroMedia = vi.fn(async () => true);
const onSubmit = vi.fn(async () => true);
const closeHeroLightbox = vi.fn();
const openHeroLightbox = vi.fn();

let isDeletingHero = false;

vi.mock("./useAdminAboutRecord", () => ({
  useAdminAboutRecord: () => ({
    record,
    isLoading: false,
    reload,
    stats: {
      state: "Published",
      values: "2",
      media: "Photo",
      updated: "Just now",
    },
    coreValuesList: record.coreValues,
  }),
}));

vi.mock("./useAboutHeroLightbox", () => ({
  useAboutHeroLightbox: () => ({
    isPreviewLightboxOpen: false,
    lightboxDisplay: null,
    lightboxPortalReady: true,
    openHeroLightbox,
    closeHeroLightbox,
    onLightboxExitComplete: vi.fn(),
  }),
}));

vi.mock("./useAdminAboutForm", () => ({
  useAdminAboutForm: () => ({
    title: record.title,
    setTitle: vi.fn(),
    paragraph1: record.paragraph1,
    setParagraph1: vi.fn(),
    coreValuesText: record.coreValues.join("\n"),
    setCoreValuesText: vi.fn(),
    existingImageUrl: record.imageUrl,
    existingHeroMediaType: "IMAGE" as const,
    imageFile: null,
    setImageFile: vi.fn(),
    imagePreviewUrl: null,
    imageFileInputRef: { current: null },
    isSubmitting: false,
    get isDeletingHero() {
      return isDeletingHero;
    },
    syncFormFromRecord,
    resetFormOnClose,
    discardSelectedFile: vi.fn(),
    deleteSavedHeroMedia,
    onSubmit,
  }),
}));

import { useAdminAboutPage } from "./useAdminAboutPage";

function makeEvent(): React.FormEvent<HTMLFormElement> {
  return { preventDefault: vi.fn() } as unknown as React.FormEvent<HTMLFormElement>;
}

describe("useAdminAboutPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isDeletingHero = false;
    deleteSavedHeroMedia.mockResolvedValue(true);
    onSubmit.mockResolvedValue(true);
  });

  it("opens the edit modal and syncs the form", () => {
    const { result } = renderHook(() => useAdminAboutPage());

    act(() => {
      result.current.openAboutModal();
    });

    expect(syncFormFromRecord).toHaveBeenCalledWith(record);
    expect(closeHeroLightbox).toHaveBeenCalledWith(true);
    expect(result.current.isModalOpen).toBe(true);
  });

  it("closes the edit modal and resets form state", () => {
    const { result } = renderHook(() => useAdminAboutPage());

    act(() => {
      result.current.openAboutModal();
      result.current.openDeleteHeroConfirm();
    });
    act(() => {
      result.current.closeAboutModal();
    });

    expect(result.current.isModalOpen).toBe(false);
    expect(result.current.isDeleteHeroConfirmOpen).toBe(false);
    expect(closeHeroLightbox).toHaveBeenCalledWith(true);
    expect(resetFormOnClose).toHaveBeenCalledOnce();
  });

  it("opens and closes the delete-hero confirm", () => {
    const { result } = renderHook(() => useAdminAboutPage());

    act(() => {
      result.current.openDeleteHeroConfirm();
    });
    expect(result.current.isDeleteHeroConfirmOpen).toBe(true);

    act(() => {
      result.current.closeDeleteHeroModal();
    });
    expect(result.current.isDeleteHeroConfirmOpen).toBe(false);
  });

  it("does not close delete confirm while a delete is in flight", () => {
    isDeletingHero = true;
    const { result } = renderHook(() => useAdminAboutPage());

    act(() => {
      result.current.openDeleteHeroConfirm();
    });
    act(() => {
      result.current.closeDeleteHeroModal();
    });

    expect(result.current.isDeleteHeroConfirmOpen).toBe(true);
  });

  it("closes delete confirm after a successful delete", async () => {
    const { result } = renderHook(() => useAdminAboutPage());

    act(() => {
      result.current.openDeleteHeroConfirm();
    });

    await act(async () => {
      await result.current.confirmDeleteHero();
    });

    expect(deleteSavedHeroMedia).toHaveBeenCalledOnce();
    expect(result.current.isDeleteHeroConfirmOpen).toBe(false);
  });

  it("keeps delete confirm open when delete fails", async () => {
    deleteSavedHeroMedia.mockResolvedValueOnce(false);
    const { result } = renderHook(() => useAdminAboutPage());

    act(() => {
      result.current.openDeleteHeroConfirm();
    });

    await act(async () => {
      await result.current.confirmDeleteHero();
    });

    expect(result.current.isDeleteHeroConfirmOpen).toBe(true);
  });

  it("closes the edit modal after a successful submit", async () => {
    const { result } = renderHook(() => useAdminAboutPage());

    act(() => {
      result.current.openAboutModal();
    });

    await act(async () => {
      await result.current.handleSubmit(makeEvent());
    });

    expect(onSubmit).toHaveBeenCalledOnce();
    expect(result.current.isModalOpen).toBe(false);
  });

  it("leaves the edit modal open when submit fails", async () => {
    onSubmit.mockResolvedValueOnce(false);
    const { result } = renderHook(() => useAdminAboutPage());

    act(() => {
      result.current.openAboutModal();
    });

    await act(async () => {
      await result.current.handleSubmit(makeEvent());
    });

    expect(result.current.isModalOpen).toBe(true);
  });
});
