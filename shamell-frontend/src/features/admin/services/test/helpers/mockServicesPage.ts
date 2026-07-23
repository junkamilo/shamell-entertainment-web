import { createRef } from "react";
import { vi } from "vitest";
import {
  makeAdminService,
  makeServiceType,
} from "../fixtures/services.fixture";
import { FIXTURE_SERVICE_ID, FIXTURE_SERVICE_TYPE_ID } from "../fixtures/uuids.fixture";

export function createMockServicesPageState(
  overrides: Record<string, unknown> = {},
) {
  const services = [makeAdminService(), makeAdminService({
    id: "s2222222-2222-4222-8222-222222222222",
    isActive: false,
    description: "Inactive package.",
    items: ["Extra"],
    price: 200,
  })];
  const serviceTypes = [
    makeServiceType(),
    makeServiceType({
      id: "t2222222-2222-4222-8222-222222222222",
      name: "Private class",
    }),
  ];

  const catalogOverride =
    (overrides.catalog as Record<string, unknown> | undefined) ?? {};
  const listOverride =
    (overrides.list as Record<string, unknown> | undefined) ?? {};
  const formOverride =
    (overrides.form as Record<string, unknown> | undefined) ?? {};

  const { catalog: _c, list: _l, form: _f, ...rest } = overrides;

  return {
    catalog: {
      services,
      serviceTypes,
      isLoading: false,
      loadAllData: vi.fn(async () => undefined),
      ...catalogOverride,
    },
    list: {
      searchQuery: "",
      setSearchQuery: vi.fn(),
      filterTab: "all" as const,
      setFilterTab: vi.fn(),
      typeFilterId: null as string | null,
      setTypeFilterId: vi.fn(),
      filtersOpen: false,
      setFiltersOpen: vi.fn(),
      page: 1,
      setPage: vi.fn(),
      searchedServices: services,
      tabCounts: { all: 2, active: 1, inactive: 1 },
      filteredServices: services,
      paginatedServices: services,
      pageOffset: 0,
      safePage: 1,
      totalPages: 1,
      stats: { total: 2, active: 1, inactive: 1, itemsTotal: 3 },
      ...listOverride,
    },
    form: {
      serviceTypeId: FIXTURE_SERVICE_TYPE_ID,
      setServiceTypeId: vi.fn(),
      clearMediaFileInput: vi.fn(),
      mediaFileInputRef: createRef<HTMLInputElement>(),
      description: "",
      setDescription: vi.fn(),
      itemsText: "",
      setItemsText: vi.fn(),
      priceInput: "",
      setPriceInput: vi.fn(),
      image: null,
      setImage: vi.fn(),
      existingImageUrl: null,
      setExistingImageUrl: vi.fn(),
      editingId: null as string | null,
      canSubmit: true,
      resetForm: vi.fn(),
      startEdit: vi.fn(),
      getValidationError: vi.fn(() => null),
      buildUpsertFormData: vi.fn(() => new FormData()),
      isTypeDropdownOpen: false,
      setIsTypeDropdownOpen: vi.fn(),
      imagePreviewUrl: null,
      isPreviewLightboxOpen: false,
      setIsPreviewLightboxOpen: vi.fn(),
      formPreviewMediaIsVideo: false,
      activeServiceTypes: serviceTypes,
      selectedTypeName: "Performance",
      ...formOverride,
    },
    isModalOpen: false,
    isSubmitting: false,
    togglingId: null as string | null,
    pendingDelete: null as ReturnType<typeof makeAdminService> | null,
    pendingDeleteTitle: "Delete service",
    isDeleting: false,
    viewService: null as ReturnType<typeof makeAdminService> | null,
    setViewService: vi.fn(),
    pendingClearMedia: false,
    setPendingClearMedia: vi.fn(),
    isClearingMedia: false,
    openCreateModal: vi.fn(),
    closeModal: vi.fn(),
    onSubmit: vi.fn(),
    startEdit: vi.fn(),
    onToggleActive: vi.fn(),
    openDeleteConfirm: vi.fn(),
    onConfirmDelete: vi.fn(),
    closeDeleteModal: vi.fn(),
    onConfirmClearMedia: vi.fn(),
    closeClearMediaModal: vi.fn(),
    canDeleteService: vi.fn(() => true),
    cannotDeactivateWhileActive: vi.fn(() => false),
    getDeactivateBlockedDescription: vi.fn(() => "blocked"),
    getDeleteBlockedDescription: vi.fn(() => "blocked"),
    getDeleteBlockedTitle: vi.fn(() => "Cannot delete"),
    ...rest,
  };
}

export { FIXTURE_SERVICE_ID };
