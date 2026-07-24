import { vi } from "vitest";
import {
  makeGalleryCategory,
  makeGalleryCategoryPhotoPreview,
} from "../fixtures/galleryCategories.fixture";
import {
  FIXTURE_CATEGORY_ID,
  FIXTURE_CATEGORY_ID_2,
} from "../fixtures/uuids.fixture";

export function createMockGalleryCategoriesPageState(
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
    makeGalleryCategoryPhotoPreview(),
    makeGalleryCategoryPhotoPreview({
      imageUrl: "https://cdn.example.com/gallery/preview-2.jpg",
    }),
  ];

  const catalogOverride =
    (overrides.catalog as Record<string, unknown> | undefined) ?? {};
  const listOverride =
    (overrides.list as Record<string, unknown> | undefined) ?? {};
  const formOverride =
    (overrides.form as Record<string, unknown> | undefined) ?? {};
  const rest = { ...overrides };
  delete rest.catalog;
  delete rest.list;
  delete rest.form;

  return {
    catalog: {
      categories,
      photos,
      isLoading: false,
      loadData: vi.fn(async () => undefined),
      ...catalogOverride,
    },
    list: {
      searchQuery: "",
      setSearchQuery: vi.fn(),
      filterTab: "all" as const,
      setFilterTab: vi.fn(),
      expandedCategoryIds: new Set<string>(),
      toggleCategoryExpanded: vi.fn(),
      photoCountByCategory: { [FIXTURE_CATEGORY_ID]: 2 },
      previewUrlsByCategory: {
        [FIXTURE_CATEGORY_ID]: [
          "https://cdn.example.com/gallery/preview.jpg",
          "https://cdn.example.com/gallery/preview-2.jpg",
        ],
      },
      spotlightCategoryId: FIXTURE_CATEGORY_ID,
      stats: {
        total: 2,
        active: 1,
        inactive: 1,
        withMedia: 1,
        star: "Weddings",
      },
      filteredCategories: categories,
      ...listOverride,
    },
    form: {
      isCategoryModalOpen: false,
      setIsCategoryModalOpen: vi.fn(),
      editingCategoryId: null as string | null,
      categoryName: "",
      setCategoryName: vi.fn(),
      resetCategoryForm: vi.fn(),
      openCategoryCreate: vi.fn(),
      startCategoryEdit: vi.fn(),
      closeCategoryModal: vi.fn(),
      ...formOverride,
    },
    isSubmittingCategory: false,
    togglingId: null as string | null,
    onSubmitCategory: vi.fn(),
    onToggleCategoryActive: vi.fn(),
    ...rest,
  };
}
