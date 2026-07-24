import { vi } from "vitest";
import {
  makeGalleryCategory,
  makeGalleryPhoto,
} from "../fixtures/gallery.fixture";
import {
  FIXTURE_CATEGORY_ID,
  FIXTURE_CATEGORY_ID_2,
  FIXTURE_PHOTO_ID_2,
} from "../fixtures/uuids.fixture";

export function createMockGalleryPageState(
  overrides: Record<string, unknown> = {},
) {
  const categories = [
    makeGalleryCategory(),
    makeGalleryCategory({
      id: FIXTURE_CATEGORY_ID_2,
      name: "Corporate",
      slug: "corporate",
      isActive: false,
    }),
  ];
  const photos = [
    makeGalleryPhoto(),
    makeGalleryPhoto({
      id: FIXTURE_PHOTO_ID_2,
      imageUrl: "https://cdn.example.com/gallery/photo-2.jpg",
      isActive: false,
      mediaType: "VIDEO",
    }),
  ];
  const activeCategories = categories.filter((c) => c.isActive);
  const sortedActiveCategories = activeCategories;

  const catalogOverride =
    (overrides.catalog as Record<string, unknown> | undefined) ?? {};
  const libraryOverride =
    (overrides.library as Record<string, unknown> | undefined) ?? {};
  const formOverride =
    (overrides.form as Record<string, unknown> | undefined) ?? {};
  const rest = { ...overrides };
  delete rest.catalog;
  delete rest.library;
  delete rest.form;

  return {
    catalog: {
      categories,
      photos,
      isLoading: false,
      loadData: vi.fn(async () => undefined),
      ...catalogOverride,
    },
    library: {
      searchQuery: "",
      setSearchQuery: vi.fn(),
      expandedAlbumIds: new Set<string>(),
      toggleAlbumExpanded: vi.fn(),
      activeCategories,
      sortedActiveCategories,
      categoriesForLibrary: sortedActiveCategories,
      countByCategory: { [FIXTURE_CATEGORY_ID]: 2 },
      stats: { total: 2, visible: 1, catsWith: 1 },
      filteredPhotos: photos,
      ...libraryOverride,
    },
    form: {
      editingPhotoId: null as string | null,
      originalCategoryId: null as string | null,
      selectedCategoryId: FIXTURE_CATEGORY_ID,
      setSelectedCategoryId: vi.fn(),
      imageFiles: [] as File[],
      setImageFiles: vi.fn(),
      canSubmitPhoto: false,
      resetPhotoForm: vi.fn(),
      openUploadToCategory: vi.fn(),
      openPhotoCreate: vi.fn(),
      startPhotoEdit: vi.fn(),
      selectedCategoryName: "Weddings",
      selectedCategorySlug: "weddings",
      ...formOverride,
    },
    isPhotoModalOpen: false,
    isSubmittingPhoto: false,
    openPhotoModalForCreate: vi.fn(),
    openUploadToCategory: vi.fn(),
    closePhotoModal: vi.fn(),
    startPhotoEdit: vi.fn(),
    onSubmitPhoto: vi.fn(),
    onTogglePhotoActive: vi.fn(),
    onDisablePhoto: vi.fn(),
    ...rest,
  };
}
