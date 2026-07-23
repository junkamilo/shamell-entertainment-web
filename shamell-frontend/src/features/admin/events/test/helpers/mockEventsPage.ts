import { vi } from "vitest";
import {
  makeAdminEvent,
  makeEventTypeOption,
} from "../fixtures/events.fixture";
import { FIXTURE_EVENT_ID_2, FIXTURE_EVENT_TYPE_ID } from "../fixtures/uuids.fixture";

export function createMockEventsPageState(
  overrides: Record<string, unknown> = {},
) {
  const events = [
    makeAdminEvent(),
    makeAdminEvent({
      id: FIXTURE_EVENT_ID_2,
      description: "Corporate gala night with VIP tables.",
      isActive: false,
      items: ["Host"],
      price: 1800,
      catalogImages: [],
    }),
  ];
  const eventTypes = [makeEventTypeOption()];

  const catalogOverride =
    (overrides.catalog as Record<string, unknown> | undefined) ?? {};
  const listOverride =
    (overrides.list as Record<string, unknown> | undefined) ?? {};
  const formOverride =
    (overrides.form as Record<string, unknown> | undefined) ?? {};
  const { catalog: _c, list: _l, form: _f, ...rest } = overrides;

  return {
    embedded: false,
    upcomingOnly: false,
    pageTitle: "Events",
    createLabel: "New event",
    catalog: {
      events,
      setEvents: vi.fn(),
      eventTypes,
      isLoading: false,
      loadAllData: vi.fn(async () => undefined),
      ...catalogOverride,
    },
    list: {
      searchQuery: "",
      setSearchQuery: vi.fn(),
      sectionFilter: "all" as const,
      setSectionFilter: vi.fn(),
      sectionEventsCount: events.length,
      searchedEvents: events,
      paginatedEvents: events,
      page: 1,
      setPage: vi.fn(),
      safePage: 1,
      totalPages: 1,
      pageOffset: 0,
      stats: {
        total: 2,
        activeCount: 1,
        inactiveCount: 1,
        itemsTotal: 3,
      },
      ...listOverride,
    },
    form: {
      eventName: "",
      setEventName: vi.fn(),
      description: "",
      setDescription: vi.fn(),
      itemsText: "",
      setItemsText: vi.fn(),
      priceInput: "",
      setPriceInput: vi.fn(),
      editingId: null as string | null,
      canSubmit: true,
      resetForm: vi.fn(),
      startEdit: vi.fn(),
      getValidationError: vi.fn(() => null),
      buildCreateBody: vi.fn(() => ({
        eventTypeId: FIXTURE_EVENT_TYPE_ID,
        description: "An elegant private wedding package with full staging.",
        items: ["Dance set"],
        showOnHome: true,
        publicSection: "GENERAL" as const,
      })),
      buildUpdateBody: vi.fn(),
      onPickCatalogImages: vi.fn(),
      removePendingAt: vi.fn(),
      isTypeDropdownOpen: false,
      setIsTypeDropdownOpen: vi.fn(),
      closeTypeDropdown: vi.fn(),
      activeEventTypes: eventTypes,
      selectedTypeName: "Private weddings",
      freeEventNameMode: false,
      pendingFiles: [] as File[],
      existingImages: [],
      ...formOverride,
    },
    eventTypeId: FIXTURE_EVENT_TYPE_ID,
    setEventTypeId: vi.fn(),
    isModalOpen: false,
    isSubmitting: false,
    submittingMessage: null as string | null,
    togglingId: null as string | null,
    pendingDelete: null as ReturnType<typeof makeAdminEvent> | null,
    isDeleting: false,
    viewEvent: null as ReturnType<typeof makeAdminEvent> | null,
    setViewEvent: vi.fn(),
    validationAlert: null as string | null,
    closeValidationAlert: vi.fn(),
    openCreateModal: vi.fn(),
    closeModal: vi.fn(),
    onSubmit: vi.fn(),
    startEdit: vi.fn(),
    removeExistingCatalogImage: vi.fn(),
    onToggleActive: vi.fn(),
    openDeleteConfirm: vi.fn(),
    onConfirmDelete: vi.fn(),
    closeDeleteModal: vi.fn(),
    canDeleteEvent: vi.fn(() => true),
    cannotDeactivateWhileActive: vi.fn(() => false),
    getDeactivateBlockedDescription: vi.fn(() => "blocked"),
    getDeleteBlockedDescription: vi.fn(() => "blocked"),
    ...rest,
  };
}
