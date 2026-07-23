import { vi } from "vitest";
import {
  makeEventTypeItem,
  makeOccasionCatalogItem,
} from "../fixtures/eventTypes.fixture";
import { FIXTURE_EVENT_TYPE_ID_2, FIXTURE_OCCASION_ID } from "../fixtures/uuids.fixture";

export function createMockEventTypesPageState(
  overrides: Record<string, unknown> = {},
) {
  const types = [
    makeEventTypeItem(),
    makeEventTypeItem({
      id: FIXTURE_EVENT_TYPE_ID_2,
      name: "Corporate gala",
      isActive: false,
      occasionAssignments: [],
    }),
  ];
  const occasions = [
    makeOccasionCatalogItem(),
    makeOccasionCatalogItem({
      id: "o2222222-2222-4222-8222-222222222222",
      name: "Anniversary",
    }),
  ];

  const listOverride =
    (overrides.list as Record<string, unknown> | undefined) ?? {};
  const formOverride =
    (overrides.form as Record<string, unknown> | undefined) ?? {};
  const { list: _l, form: _f, ...rest } = overrides;

  return {
    list: {
      types,
      isLoading: false,
      loadTypes: vi.fn(async () => undefined),
      searchQuery: "",
      setSearchQuery: vi.fn(),
      filterTab: "all" as const,
      setFilterTab: vi.fn(),
      page: 1,
      setPage: vi.fn(),
      perPage: 10,
      onPerPageChange: vi.fn(),
      filteredTypes: types,
      pagedTypes: types,
      paginationMeta: {
        page: 1,
        perPage: 10,
        totalItems: types.length,
        totalPages: 1,
        hasPrev: false,
        hasNext: false,
      },
      stats: { total: 2, active: 1, inactive: 1 },
      ...listOverride,
    },
    form: {
      name: "",
      setName: vi.fn(),
      contactInquiryCode: "",
      setContactInquiryCode: vi.fn(),
      editingId: null as string | null,
      editingRow: undefined,
      linkedOccasionIds: [] as string[],
      activeOccasionsCatalog: occasions.filter((o) => o.isActive),
      linkedOrphanIds: [] as string[],
      canSubmit: true,
      resetForm: vi.fn(),
      startEdit: vi.fn(),
      toggleLinkedOccasion: vi.fn(),
      getNameValidationError: vi.fn(() => null),
      buildUpsertBody: vi.fn(() => ({
        name: "Private weddings",
        occasions: [{ occasionTypeId: FIXTURE_OCCASION_ID, usage: "OCCASION_SINGLE" as const }],
        contactInquiryCode: "PRIVATE",
      })),
      ...formOverride,
    },
    occasionCatalog: occasions,
    isModalOpen: false,
    isSubmitting: false,
    togglingId: null as string | null,
    pendingDelete: null as ReturnType<typeof makeEventTypeItem> | null,
    isDeleting: false,
    openCreateModal: vi.fn(),
    closeModal: vi.fn(),
    onSubmit: vi.fn(),
    startEdit: vi.fn(),
    onToggleActive: vi.fn(),
    openDeleteConfirm: vi.fn(),
    onConfirmDelete: vi.fn(),
    closeDeleteModal: vi.fn(),
    cannotDeactivateWhileActive: vi.fn(() => false),
    canDeleteEventType: vi.fn(() => true),
    getDeactivateBlockedDescription: vi.fn(() => "blocked"),
    getDeleteBlockedDescription: vi.fn(() => "blocked"),
    ...rest,
  };
}
