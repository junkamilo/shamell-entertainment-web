import { vi } from "vitest";
import { makeServiceTypeItem } from "../fixtures/serviceTypes.fixture";
import { FIXTURE_SERVICE_TYPE_ID_2 } from "../fixtures/uuids.fixture";

export function createMockServiceTypesPageState(
  overrides: Record<string, unknown> = {},
) {
  const types = [
    makeServiceTypeItem(),
    makeServiceTypeItem({
      id: FIXTURE_SERVICE_TYPE_ID_2,
      name: "Private class",
      isActive: false,
      serviceCount: 1,
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
      stats: {
        total: 2,
        active: 1,
        inactive: 1,
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
      getNameValidationError: vi.fn(() => null),
      trimmedName: "",
      ...formOverride,
    },
    isModalOpen: false,
    isSubmitting: false,
    togglingId: null as string | null,
    pendingDelete: null as ReturnType<typeof makeServiceTypeItem> | null,
    isDeleting: false,
    openCreateModal: vi.fn(),
    closeModal: vi.fn(),
    onSubmit: vi.fn(),
    startEdit: vi.fn(),
    onToggleActive: vi.fn(),
    openDeleteConfirm: vi.fn(),
    onConfirmDelete: vi.fn(),
    closeDeleteModal: vi.fn(),
    canDeleteServiceType: vi.fn(() => true),
    cannotDeactivateWhileActive: vi.fn(() => false),
    getDeactivateBlockedDescription: vi.fn(() => "blocked"),
    getDeleteBlockedDescription: vi.fn(() => "blocked"),
    getDeleteBlockedTitle: vi.fn(() => "Cannot delete"),
    ...rest,
  };
}
