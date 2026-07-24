import { vi } from "vitest";
import { makeOccasionTypeItem } from "../fixtures/occasionTypes.fixture";
import { FIXTURE_OCCASION_TYPE_ID_2 } from "../fixtures/uuids.fixture";

export function createMockOccasionTypesPageState(
  overrides: Record<string, unknown> = {},
) {
  const rows = [
    makeOccasionTypeItem(),
    makeOccasionTypeItem({
      id: FIXTURE_OCCASION_TYPE_ID_2,
      name: "Anniversary",
      isActive: false,
      eventTypeLinkCount: 1,
    }),
  ];

  const listOverride =
    (overrides.list as Record<string, unknown> | undefined) ?? {};
  const formOverride =
    (overrides.form as Record<string, unknown> | undefined) ?? {};
  const rest = { ...overrides };
  delete rest.list;
  delete rest.form;

  return {
    list: {
      rows,
      isLoading: false,
      loadRows: vi.fn(async () => undefined),
      searchQuery: "",
      setSearchQuery: vi.fn(),
      filterTab: "all" as const,
      setFilterTab: vi.fn(),
      page: 1,
      setPage: vi.fn(),
      perPage: 10,
      onPerPageChange: vi.fn(),
      filtered: rows,
      pagedRows: rows,
      paginationMeta: {
        page: 1,
        perPage: 10,
        totalItems: rows.length,
        totalPages: 1,
        hasPrev: false,
        hasNext: false,
      },
      ...listOverride,
    },
    form: {
      name: "",
      setName: vi.fn(),
      editingId: null as string | null,
      editingRow: undefined,
      canSubmit: true,
      resetForm: vi.fn(),
      startEdit: vi.fn(),
      getValidationError: vi.fn(() => null),
      trimmedName: "",
      ...formOverride,
    },
    isModalOpen: false,
    isSubmitting: false,
    togglingId: null as string | null,
    pendingDelete: null as ReturnType<typeof makeOccasionTypeItem> | null,
    isDeleting: false,
    openCreateModal: vi.fn(),
    closeModal: vi.fn(),
    onSubmit: vi.fn(),
    startEdit: vi.fn(),
    onToggleActive: vi.fn(),
    openDeleteConfirm: vi.fn(),
    onConfirmDelete: vi.fn(),
    closeDeleteModal: vi.fn(),
    canDeleteOccasionType: vi.fn(() => true),
    cannotDeactivateWhileActive: vi.fn(() => false),
    getDeactivateBlockedDescription: vi.fn(() => "blocked"),
    getDeleteBlockedDescription: vi.fn(() => "blocked"),
    ...rest,
  };
}
