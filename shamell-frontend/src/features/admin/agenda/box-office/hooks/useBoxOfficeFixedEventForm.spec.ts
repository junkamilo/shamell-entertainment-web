/** @vitest-environment jsdom */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import {
  makeBoxOfficePackage,
  makeFixedTicketEvent,
  makePackagesFixedTicketEvent,
} from "../test/fixtures/boxOffice.fixture";
import {
  FIXTURE_FIXED_EVENT_ID,
  FIXTURE_PACKAGE_ID,
  FIXTURE_PACKAGE_ID_2,
} from "../test/fixtures/uuids.fixture";

const toastMock = vi.fn();
const getTokenMock = vi.fn((): string | null => "token-1");
const fetchEventsMock = vi.fn(async () => [makeFixedTicketEvent()]);
const cashMock = vi.fn(async () => ({ ok: true as const, message: "Ticket reserved." }));
const checkoutMock = vi.fn(async () => ({
  ok: true as const,
  message: "Payment link sent.",
}));
const venueCashMock = vi.fn(async () => ({ ok: true as const, message: "Seat reserved." }));
const venueCheckoutMock = vi.fn(async () => ({
  ok: true as const,
  message: "Payment link sent.",
}));
const layoutMock = vi.fn();
const tablesMock = vi.fn();
const chairsMock = vi.fn();
const availabilityMock = vi.fn();

vi.mock("@/hooks/use-toast", () => ({
  toast: (...args: unknown[]) => toastMock(...args),
}));

vi.mock("@/lib/admin/auth", () => ({
  getAdminBearerToken: () => getTokenMock(),
}));

vi.mock("../services/fetchBoxOfficeFixedEvents", () => ({
  fetchBoxOfficeFixedEvents: (...args: unknown[]) => fetchEventsMock(...args),
}));

vi.mock("../services/createBoxOfficeFixedTicket", () => ({
  createBoxOfficeFixedTicketCash: (...args: unknown[]) => cashMock(...args),
  createBoxOfficeFixedTicketCheckout: (...args: unknown[]) => checkoutMock(...args),
}));

vi.mock("../services/createBoxOfficeVenueReservation", () => ({
  createBoxOfficeVenueCash: (...args: unknown[]) => venueCashMock(...args),
  createBoxOfficeVenueCheckout: (...args: unknown[]) => venueCheckoutMock(...args),
}));

vi.mock("@/features/admin/on-coming-events/layout/services/fetchAdminFloorLayout", () => ({
  fetchAdminFloorLayout: (...args: unknown[]) => layoutMock(...args),
}));

vi.mock("@/features/admin/venue-tables/services/fetchAdminVenueTables", () => ({
  fetchAdminVenueTables: (...args: unknown[]) => tablesMock(...args),
}));

vi.mock("@/features/admin/venue-tables/services/fetchAdminStandaloneChairs", () => ({
  fetchAdminStandaloneChairs: (...args: unknown[]) => chairsMock(...args),
}));

vi.mock("../services/fetchBoxOfficeSeatAvailability", () => ({
  fetchBoxOfficeSeatAvailability: (...args: unknown[]) => availabilityMock(...args),
}));

import { useBoxOfficeFixedEventForm } from "./useBoxOfficeFixedEventForm";

function makeFormEvent(): React.FormEvent {
  return { preventDefault: vi.fn() } as unknown as React.FormEvent;
}

const tableItem = {
  id: FIXTURE_LAYOUT_TABLE_ID,
  kind: "catalog_table" as const,
  venueTableConfigId: FIXTURE_VENUE_TABLE_CONFIG_ID,
  tableName: "Large 1",
  size: "LARGE" as const,
  includedChairs: 1,
  x: 0,
  y: 0,
  rotation: 0,
};

const unnamedTable = {
  ...tableItem,
  id: "li_table_anon",
  tableName: "",
  includedChairs: 8,
};

const chairItem = {
  id: FIXTURE_LAYOUT_CHAIR_ID,
  kind: "standalone_chair" as const,
  venueStandaloneChairId: "sc_1",
  chairName: "",
  unitPrice: 35,
  x: 1,
  y: 1,
  rotation: 0,
};

function okLayout(items = [tableItem, unnamedTable, chairItem]) {
  return { ok: true, layout: { items } };
}

function okTables() {
  return {
    ok: true,
    items: [
      {
        id: FIXTURE_VENUE_TABLE_CONFIG_ID,
        tableName: "Large 1",
        size: "LARGE",
        sortOrder: 0,
        isActive: true,
        bundlePrice: 250,
      },
    ],
  };
}

function okChairs() {
  return {
    ok: true,
    config: {
      chairs: [{ id: "sc_1", chairName: "Chair 1", sortOrder: 0, isActive: true }],
    },
  };
}

function okAvailability() {
  return { ok: true as const, data: makeSeatAvailability() };
}

async function selectVenueEvent() {
  const { result } = renderHook(() => useBoxOfficeFixedEventForm());
  await waitFor(() => expect(result.current.eventsLoading).toBe(false));
  act(() => {
    result.current.onSelectEvent(FIXTURE_VENUE_EVENT_ID);
  });
  await waitFor(() => expect(result.current.seatsLoading).toBe(false));
  return result;
}

describe("useBoxOfficeFixedEventForm", () => {
  beforeEach(() => {
    toastMock.mockClear();
    getTokenMock.mockReturnValue("token-1");
    fetchEventsMock.mockReset();
    fetchEventsMock.mockResolvedValue([makeFixedTicketEvent(), makeVenueFixedEvent()]);
    cashMock.mockReset();
    cashMock.mockResolvedValue({ ok: true, message: "Ticket reserved." });
    checkoutMock.mockReset();
    checkoutMock.mockResolvedValue({ ok: true, message: "Payment link sent." });
    venueCashMock.mockReset();
    venueCashMock.mockResolvedValue({ ok: true, message: "Seat reserved." });
    venueCheckoutMock.mockReset();
    venueCheckoutMock.mockResolvedValue({ ok: true, message: "Payment link sent." });
    layoutMock.mockReset();
    layoutMock.mockResolvedValue(okLayout());
    tablesMock.mockReset();
    tablesMock.mockResolvedValue(okTables());
    chairsMock.mockReset();
    chairsMock.mockResolvedValue(okChairs());
    availabilityMock.mockReset();
    availabilityMock.mockResolvedValue(okAvailability());
  });

  it("loads fixed events on mount", async () => {
    const { result } = renderHook(() => useBoxOfficeFixedEventForm());

    await waitFor(() => expect(result.current.eventsLoading).toBe(false));
    expect(fetchEventsMock).toHaveBeenCalledWith("token-1");
    expect(result.current.eventsError).toBeNull();
  });

  it("shows a sign-in error when events cannot load without a token", async () => {
    getTokenMock.mockReturnValue(null);
    const { result } = renderHook(() => useBoxOfficeFixedEventForm());
    await waitFor(() => expect(result.current.eventsLoading).toBe(false));
    expect(result.current.eventsError).toBe("Not signed in.");
  });

  it("surfaces a typed error when events fail to load", async () => {
    fetchEventsMock.mockRejectedValueOnce(new Error("down"));
    const { result } = renderHook(() => useBoxOfficeFixedEventForm());
    await waitFor(() => expect(result.current.eventsLoading).toBe(false));
    expect(result.current.eventsError).toBe("down");
    expect(result.current.events).toEqual([]);
  });

  it("surfaces a fallback error when events fail without an Error", async () => {
    fetchEventsMock.mockRejectedValueOnce("nope");
    const { result } = renderHook(() => useBoxOfficeFixedEventForm());
    await waitFor(() => expect(result.current.eventsLoading).toBe(false));
    expect(result.current.eventsError).toBe("Could not load events.");
  });

  it("requires a name and email before submitting", async () => {
    const { result } = renderHook(() => useBoxOfficeFixedEventForm());
    await waitFor(() => expect(result.current.eventsLoading).toBe(false));

    act(() => {
      result.current.onSelectEvent(FIXTURE_FIXED_EVENT_ID);
    });

    await act(async () => {
      await result.current.onSubmit(makeFormEvent());
    });

    expect(result.current.formError).toBe("Name and email are required.");
  });

  it("requires a selected event and a signed-in admin", async () => {
    const { result } = renderHook(() => useBoxOfficeFixedEventForm());
    await waitFor(() => expect(result.current.eventsLoading).toBe(false));

    getTokenMock.mockReturnValue(null);
    await act(async () => {
      await result.current.onSubmit(makeFormEvent());
    });
    expect(result.current.formError).toBe("Not signed in.");

    getTokenMock.mockReturnValue("token-1");
    await act(async () => {
      await result.current.onSubmit(makeFormEvent());
    });
    expect(result.current.formError).toBe("Select an event.");
  });

  it("requires cash confirmation", async () => {
    const { result } = renderHook(() => useBoxOfficeFixedEventForm());
    await waitFor(() => expect(result.current.eventsLoading).toBe(false));
    act(() => {
      result.current.onSelectEvent(FIXTURE_FIXED_EVENT_ID);
      result.current.setCustomerName("Jane");
      result.current.setCustomerEmail("jane@example.com");
    });
    await act(async () => {
      await result.current.onSubmit(makeFormEvent());
    });
    expect(result.current.formError).toBe("Confirm that cash payment was received.");
  });

  it("reserves a fixed ticket with cash and reloads events", async () => {
    const { result } = renderHook(() => useBoxOfficeFixedEventForm());
    await waitFor(() => expect(result.current.eventsLoading).toBe(false));

    act(() => {
      result.current.onSelectEvent(FIXTURE_FIXED_EVENT_ID);
      result.current.setCustomerName("Jane Doe");
      result.current.setCustomerEmail("jane@example.com");
      result.current.setCustomerPhone("555");
      result.current.setCashConfirmed(true);
    });

    await act(async () => {
      await result.current.onSubmit(makeFormEvent());
    });

    expect(cashMock).toHaveBeenCalled();
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Ticket reserved" }),
    );
    expect(fetchEventsMock).toHaveBeenCalledTimes(2);
  });

  it("sends a fixed-ticket checkout link", async () => {
    const { result } = renderHook(() => useBoxOfficeFixedEventForm());
    await waitFor(() => expect(result.current.eventsLoading).toBe(false));
    act(() => {
      result.current.onSelectEvent(FIXTURE_FIXED_EVENT_ID);
      result.current.setCustomerName("Jane");
      result.current.setCustomerEmail("jane@example.com");
      result.current.setPaymentMethod("card");
    });
    await act(async () => {
      await result.current.onSubmit(makeFormEvent());
    });
    expect(checkoutMock).toHaveBeenCalled();
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Payment link sent" }),
    );
  });

  it("surfaces the error message when the cash reservation fails", async () => {
    const { result } = renderHook(() => useBoxOfficeFixedEventForm());
    await waitFor(() => expect(result.current.eventsLoading).toBe(false));

    cashMock.mockImplementation(async () => ({
      ok: false as const,
      message: "Sold out",
    }));

    act(() => {
      result.current.onSelectEvent(FIXTURE_FIXED_EVENT_ID);
      result.current.setCustomerName("Jane Doe");
      result.current.setCustomerEmail("jane@example.com");
      result.current.setCashConfirmed(true);
    });

    await act(async () => {
      await result.current.onSubmit(makeFormEvent());
    });

    expect(result.current.formError).toBe("Sold out");
  });

  it("rejects a missing or sold-out ticket price", async () => {
    fetchEventsMock.mockResolvedValue([
      makeFixedTicketEvent({ price: 0.2 }),
      makeFixedTicketEvent({ id: "sold", price: 45, ticketsRemaining: 0 }),
    ]);
    const { result } = renderHook(() => useBoxOfficeFixedEventForm());
    await waitFor(() => expect(result.current.eventsLoading).toBe(false));

    act(() => {
      result.current.onSelectEvent(FIXTURE_FIXED_EVENT_ID);
      result.current.setCustomerName("Jane");
      result.current.setCustomerEmail("jane@example.com");
      result.current.setCashConfirmed(true);
    });
    await act(async () => {
      await result.current.onSubmit(makeFormEvent());
    });
    expect(result.current.formError).toBe("Event ticket price is not configured.");

    act(() => {
      result.current.onSelectEvent("sold");
      result.current.setCashConfirmed(true);
    });
    await act(async () => {
      await result.current.onSubmit(makeFormEvent());
    });
    expect(result.current.formError).toBe("Tickets sold out.");
  });

  it("falls back to size labels when catalog names are missing", async () => {
    tablesMock.mockResolvedValue({ ok: true, items: [] });
    chairsMock.mockResolvedValue({ ok: true, config: { chairs: [] } });
    layoutMock.mockResolvedValue(
      okLayout([
        unnamedTable,
        { ...unnamedTable, id: "li_named_table", tableName: "VIP", includedChairs: 2 },
        { ...chairItem, chairName: "Window", unitPrice: undefined },
        { ...chairItem, id: "li_chair_anon", chairName: "", unitPrice: 10 },
      ]),
    );
    fetchEventsMock.mockResolvedValue([
      makeVenueFixedEvent({ slug: null }),
    ]);
    const result = await selectVenueEvent();
    expect(result.current.seats.length).toBeGreaterThanOrEqual(2);
    expect(result.current.seats.some((s) => s.kind === "standalone_chair")).toBe(true);
  });

  it("builds seat options for tables and chairs", async () => {
    const result = await selectVenueEvent();
    expect(result.current.seats.length).toBe(3);
    expect(result.current.seats.some((s) => s.kind === "catalog_table")).toBe(true);
    expect(result.current.seats.some((s) => s.kind === "standalone_chair")).toBe(true);
  });

  it("clears seats when layout or availability fails", async () => {
    layoutMock.mockResolvedValueOnce({ ok: false, layout: null });
    const result = await selectVenueEvent();
    expect(result.current.seats).toEqual([]);

    layoutMock.mockResolvedValue(okLayout());
    availabilityMock.mockResolvedValueOnce({ ok: false, message: "No seats" });
    const second = renderHook(() => useBoxOfficeFixedEventForm());
    await waitFor(() => expect(second.result.current.eventsLoading).toBe(false));
    act(() => {
      second.result.current.onSelectEvent(FIXTURE_VENUE_EVENT_ID);
    });
    await waitFor(() => expect(second.result.current.seatsLoading).toBe(false));
    expect(second.result.current.formError).toBe("No seats");
  });

  it("skips seat loading without a token and when catalogs fail", async () => {
    tablesMock.mockResolvedValue({ ok: false, items: [] });
    chairsMock.mockResolvedValue({ ok: false, config: null });
    const result = await selectVenueEvent();
    expect(result.current.seats.length).toBeGreaterThan(0);

    getTokenMock.mockReturnValue(null);
    act(() => {
      result.current.onSelectEvent("");
    });
    act(() => {
      result.current.onSelectEvent(FIXTURE_VENUE_EVENT_ID);
    });
    await waitFor(() => expect(result.current.seatsLoading).toBe(false));
  });

  it("clears seats for a fixed-ticket event", async () => {
    const { result } = renderHook(() => useBoxOfficeFixedEventForm());
    await waitFor(() => expect(result.current.eventsLoading).toBe(false));
    act(() => {
      result.current.onSelectEvent(FIXTURE_FIXED_EVENT_ID);
    });
    expect(result.current.seats).toEqual([]);
  });

  it("requires an available priced seat for venue checkout", async () => {
    const result = await selectVenueEvent();
    act(() => {
      result.current.setCustomerName("Jane");
      result.current.setCustomerEmail("jane@example.com");
      result.current.setPaymentMethod("card");
    });
    await act(async () => {
      await result.current.onSubmit(makeFormEvent());
    });
    expect(result.current.formError).toBe("Select an available table or chair.");

    act(() => {
      result.current.setSelectedSeatId(FIXTURE_LAYOUT_TABLE_ID);
    });
    await waitFor(() => expect(result.current.selectedSeat?.amount).toBe(250));
    await act(async () => {
      await result.current.onSubmit(makeFormEvent());
    });
    expect(venueCheckoutMock).toHaveBeenCalled();
  });

  it("rejects reserved, pending, or unpriced seats", async () => {
    availabilityMock.mockResolvedValue({
      ok: true,
      data: makeSeatAvailability({
        reservedLayoutItemIds: [FIXTURE_LAYOUT_TABLE_ID],
        pendingLayoutItemIds: [FIXTURE_LAYOUT_CHAIR_ID],
      }),
    });
    const result = await selectVenueEvent();
    act(() => {
      result.current.setCustomerName("Jane");
      result.current.setCustomerEmail("jane@example.com");
      result.current.setCashConfirmed(true);
      result.current.setSelectedSeatId(FIXTURE_LAYOUT_TABLE_ID);
    });
    await act(async () => {
      await result.current.onSubmit(makeFormEvent());
    });
    expect(result.current.formError).toBe("Select an available table or chair.");
  });

  it("rejects a seat without a valid price", async () => {
    tablesMock.mockResolvedValue({ ok: true, items: [] });
    layoutMock.mockResolvedValue(
      okLayout([
        {
          ...tableItem,
          venueTableConfigId: "missing",
        },
      ]),
    );
    const result = await selectVenueEvent();
    act(() => {
      result.current.setCustomerName("Jane");
      result.current.setCustomerEmail("jane@example.com");
      result.current.setCashConfirmed(true);
      result.current.setSelectedSeatId(FIXTURE_LAYOUT_TABLE_ID);
    });
    await waitFor(() => expect(result.current.selectedSeat).toBeTruthy());
    await act(async () => {
      await result.current.onSubmit(makeFormEvent());
    });
    expect(result.current.formError).toBe("Selected seat has no valid price.");
  });

  it("reserves a venue seat with cash", async () => {
    const result = await selectVenueEvent();
    act(() => {
      result.current.setCustomerName("Jane");
      result.current.setCustomerEmail("jane@example.com");
      result.current.setCustomerPhone("555");
      result.current.setCashConfirmed(true);
      result.current.setSelectedSeatId(FIXTURE_LAYOUT_TABLE_ID);
    });
    await act(async () => {
      await result.current.onSubmit(makeFormEvent());
    });
    expect(venueCashMock).toHaveBeenCalled();
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Seat reserved" }),
    );
  });

  it("sends venue cash without a slug or phone", async () => {
    fetchEventsMock.mockResolvedValue([makeVenueFixedEvent({ slug: null })]);
    const result = await selectVenueEvent();
    act(() => {
      result.current.setCustomerName("Jane");
      result.current.setCustomerEmail("jane@example.com");
      result.current.setCashConfirmed(true);
      result.current.setSelectedSeatId(FIXTURE_LAYOUT_TABLE_ID);
    });
    await act(async () => {
      await result.current.onSubmit(makeFormEvent());
    });
    expect(venueCashMock).toHaveBeenCalledWith(
      "token-1",
      expect.objectContaining({
        customerPhone: undefined,
        upcomingEventSlug: undefined,
      }),
    );
  });

  it("surfaces a venue reservation error", async () => {
    const result = await selectVenueEvent();
    venueCashMock.mockImplementation(async () => ({
      ok: false as const,
      message: "Taken",
    }));
    act(() => {
      result.current.setCustomerName("Jane");
      result.current.setCustomerEmail("jane@example.com");
      result.current.setCashConfirmed(true);
      result.current.setSelectedSeatId(FIXTURE_LAYOUT_CHAIR_ID);
    });
    await act(async () => {
      await result.current.onSubmit(makeFormEvent());
    });
    expect(result.current.formError).toBe("Taken");
  });

  it("requires a package before submitting a PACKAGES event", async () => {
    fetchEventsMock.mockResolvedValue([
      makePackagesFixedTicketEvent({
        packages: [
          makeBoxOfficePackage(),
          makeBoxOfficePackage({
            id: FIXTURE_PACKAGE_ID_2,
            title: "General",
            price: 45,
          }),
        ],
      }),
    ]);
    const { result } = renderHook(() => useBoxOfficeFixedEventForm());
    await waitFor(() => expect(result.current.eventsLoading).toBe(false));

    act(() => {
      result.current.onSelectEvent(FIXTURE_FIXED_EVENT_ID);
      result.current.setCustomerName("Jane Doe");
      result.current.setCustomerEmail("jane@example.com");
      result.current.setCashConfirmed(true);
    });

    await act(async () => {
      await result.current.onSubmit(makeFormEvent());
    });

    expect(result.current.formError).toBe("Select a ticket package.");
    expect(cashMock).not.toHaveBeenCalled();
  });

  it("preselects the only package and submits packageId", async () => {
    fetchEventsMock.mockResolvedValue([makePackagesFixedTicketEvent()]);
    const { result } = renderHook(() => useBoxOfficeFixedEventForm());
    await waitFor(() => expect(result.current.eventsLoading).toBe(false));

    act(() => {
      result.current.onSelectEvent(FIXTURE_FIXED_EVENT_ID);
      result.current.setCustomerName("Jane Doe");
      result.current.setCustomerEmail("jane@example.com");
      result.current.setCashConfirmed(true);
    });

    await waitFor(() =>
      expect(result.current.selectedPackageId).toBe(FIXTURE_PACKAGE_ID),
    );

    await act(async () => {
      await result.current.onSubmit(makeFormEvent());
    });

    expect(cashMock).toHaveBeenCalledWith(
      "token-1",
      expect.objectContaining({
        upcomingEventId: FIXTURE_FIXED_EVENT_ID,
        packageId: FIXTURE_PACKAGE_ID,
        boxOfficeDetails: expect.objectContaining({
          selection: expect.objectContaining({
            packageId: FIXTURE_PACKAGE_ID,
            packageTitle: "VIP Early Entry",
            amount: 85,
          }),
        }),
      }),
    );
  });
});
