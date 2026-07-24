import { createRef } from "react";
import { vi } from "vitest";
import { makeHeaderPhoto } from "../fixtures/headerMedia.fixture";
import { FIXTURE_HEADER_PHOTO_ID_2 } from "../fixtures/uuids.fixture";

export function createMockHeaderMediaPageState(
  overrides: Record<string, unknown> = {},
) {
  const photos = [
    makeHeaderPhoto(),
    makeHeaderPhoto({
      id: FIXTURE_HEADER_PHOTO_ID_2,
      imageUrl: "https://cdn.example.com/header/video.mp4",
      mediaType: "VIDEO",
      isActive: false,
    }),
  ];

  const libraryOverride =
    (overrides.library as Record<string, unknown> | undefined) ?? {};
  const uploadOverride =
    (overrides.upload as Record<string, unknown> | undefined) ?? {};
  const focusOverride =
    (overrides.focus as Record<string, unknown> | undefined) ?? {};
  const rest = { ...overrides };
  delete rest.library;
  delete rest.upload;
  delete rest.focus;

  return {
    library: {
      photos,
      setPhotos: vi.fn(),
      isLoading: false,
      loadData: vi.fn(async () => undefined),
      page: 1,
      setPage: vi.fn(),
      perPage: 10,
      onPerPageChange: vi.fn(),
      paginationMeta: {
        page: 1,
        perPage: 10,
        totalItems: 2,
        totalPages: 1,
        hasPrev: false,
        hasNext: false,
      },
      pagedPhotos: photos,
      ...libraryOverride,
    },
    upload: {
      fileInputRef: createRef<HTMLInputElement>(),
      pendingFiles: [] as File[],
      pendingPreviews: {} as Record<string, string>,
      pendingTotalBytes: 0,
      formatFileSize: (bytes: number) => `${bytes} B`,
      dragOver: false,
      mergeFiles: vi.fn(),
      clearPending: vi.fn(),
      removePendingOne: vi.fn(),
      onPickFiles: vi.fn(),
      onInputChange: vi.fn(),
      onDropzoneDragOver: vi.fn(),
      onDropzoneDragLeave: vi.fn(),
      onDropzoneDrop: vi.fn(),
      ...uploadOverride,
    },
    focus: {
      editingFocusPhoto: null as ReturnType<typeof makeHeaderPhoto> | null,
      focusDraft: {
        desktopX: 50,
        desktopY: 35,
        mobileX: 50,
        mobileY: 35,
      },
      setFocusDraft: vi.fn(),
      isSavingFocus: false,
      focusEditorIsVideo: false,
      openFocusEditor: vi.fn(),
      closeFocusEditor: vi.fn(),
      setDraftFromPoint: vi.fn(),
      saveFocusEditor: vi.fn(async () => undefined),
      clearFocusIfDeleted: vi.fn(),
      ...focusOverride,
    },
    isSaving: false,
    pendingDelete: null as ReturnType<typeof makeHeaderPhoto> | null,
    isDeleting: false,
    onSubmit: vi.fn(),
    onToggle: vi.fn(),
    openDeleteConfirm: vi.fn(),
    closeDeleteModal: vi.fn(),
    onConfirmDelete: vi.fn(),
    ...rest,
  };
}
