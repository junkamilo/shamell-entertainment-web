import { vi } from "vitest";
import { makePeticionesList } from "../fixtures/peticiones.fixture";

export function createMockPeticionesPageState(
  overrides: Record<string, unknown> = {},
) {
  const list = makePeticionesList();
  const inboxOverride =
    (overrides.inbox as Record<string, unknown> | undefined) ?? {};
  const actionsOverride =
    (overrides.actions as Record<string, unknown> | undefined) ?? {};
  const catalogOverride =
    (overrides.catalog as Record<string, unknown> | undefined) ?? {};

  const rest = { ...overrides };
  delete rest.inbox;
  delete rest.actions;
  delete rest.catalog;

  return {
    page: 1,
    setPage: vi.fn(),
    perPage: 10,
    setPerPage: vi.fn(),
    activeLane: "bookings" as const,
    guidanceUnread: 0,
    privateClassesUnread: 0,
    onLaneChange: vi.fn(),
    expandedId: null as string | null,
    setExpandedId: vi.fn(),
    busyId: null as string | null,
    reservingContactId: null as string | null,
    confirmDelete: null as
      | {
          kind: "CONTACT" | "BOOKING";
          id: string;
          title: string;
          description: string;
          linkedContactId?: string;
        }
      | null,
    setConfirmDelete: vi.fn(),
    purgeLinkedInquiryOnDelete: true,
    setPurgeLinkedInquiryOnDelete: vi.fn(),
    pendingCount: 1,
    inbox: {
      rows: list.items,
      meta: list.meta,
      isLoading: false,
      error: null as string | null,
      reload: vi.fn(),
      ...inboxOverride,
    },
    catalog: {
      serviceByInquiryCode: new Map([["SHOW", "svc-1"]]),
      eventTypeContactCodeById: new Map([["et-1", "PRIVATE"]]),
      inquiryCodeByCatalogLineId: new Map([["line-1", "GUIDANCE"]]),
      fallbackServiceId: "svc-1",
      loading: false,
      ...catalogOverride,
    },
    actions: {
      bookingTz: "America/New_York",
      onReserveFromContact: vi.fn(),
      onCancelContact: vi.fn(),
      onRemove: vi.fn(),
      confirmRemoveContact: vi.fn(async () => undefined),
      onCancelBooking: vi.fn(),
      onRemoveBooking: vi.fn(),
      onSendBookingQuote: vi.fn(),
      onSendBalanceLink: vi.fn(),
      confirmRemoveBooking: vi.fn(async () => undefined),
      ...actionsOverride,
    },
    onConfirmDelete: vi.fn(async () => undefined),
    ...rest,
  };
}
