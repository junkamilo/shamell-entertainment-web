/** @vitest-environment jsdom */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import {
  makeFloorLayout,
  makeFloorLayoutPalette,
  makeVenueAvailability,
} from "../../test/fixtures/onComingEvents.fixture";
import { FIXTURE_LAYOUT_ID, FIXTURE_TABLE_CONFIG_ID } from "../../test/fixtures/uuids.fixture";
import { SCENE_STAGE_SELECT_ID } from "../lib/floorSceneZones.defaults";

const toastMock = vi.fn();
const getTokenMock = vi.fn((): string | null => "token-1");
const routerPushMock = vi.fn();
const writeSeenMock = vi.fn();
const notifyBadgeMock = vi.fn();
const readSeenMock = vi.fn(() => 0);

const fetchLayoutMock = vi.fn();
const fetchPaletteMock = vi.fn();
const putLayoutMock = vi.fn();
const fetchAvailabilityMock = vi.fn();
const fetchTablesMock = vi.fn();
const fetchChairsMock = vi.fn();
const fetchReservationsMock = vi.fn();

vi.mock("@/hooks/use-toast", () => ({
  toast: (...args: unknown[]) => toastMock(...args),
}));

vi.mock("@/lib/admin/auth", () => ({
  getAdminBearerToken: () => getTokenMock(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: routerPushMock }),
}));

vi.mock("@/lib/on-coming-events/onComingEventsReservationsNotice", () => ({
  readLastSeenPaidReservationAtMs: () => readSeenMock(),
  writeLastSeenPaidReservationAtMs: (...args: unknown[]) => writeSeenMock(...args),
  notifyOnComingEventsBadgeRefresh: (...args: unknown[]) => notifyBadgeMock(...args),
}));

vi.mock("../services/fetchAdminFloorLayout", () => ({
  fetchAdminFloorLayout: (...args: unknown[]) => fetchLayoutMock(...args),
}));

vi.mock("../services/fetchAdminFloorLayoutPalette", () => ({
  fetchAdminFloorLayoutPalette: (...args: unknown[]) => fetchPaletteMock(...args),
}));

vi.mock("../services/putAdminFloorLayout", () => ({
  putAdminFloorLayout: (...args: unknown[]) => putLayoutMock(...args),
}));

vi.mock("../services/fetchAdminVenueAvailability", () => ({
  fetchAdminVenueAvailability: (...args: unknown[]) => fetchAvailabilityMock(...args),
}));

vi.mock("@/features/admin/venue-tables/services/fetchAdminVenueTables", () => ({
  fetchAdminVenueTables: (...args: unknown[]) => fetchTablesMock(...args),
}));

vi.mock("@/features/admin/venue-tables/services/fetchAdminStandaloneChairs", () => ({
  fetchAdminStandaloneChairs: (...args: unknown[]) => fetchChairsMock(...args),
}));

vi.mock("@/features/admin/venue-reservations/services/fetchAdminVenueReservations", () => ({
  fetchAdminVenueReservations: (...args: unknown[]) => fetchReservationsMock(...args),
}));

import { useFloorLayoutEditor } from "./useFloorLayoutEditor";

function defaultHappyMocks(layout = makeFloorLayout({ items: [] })) {
  const palette = makeFloorLayoutPalette();
  fetchLayoutMock.mockResolvedValue({ ok: true, layout, status: 200, data: layout });
  fetchPaletteMock.mockResolvedValue({ ok: true, palette, status: 200 });
  fetchAvailabilityMock.mockResolvedValue({
    ok: true,
    data: makeVenueAvailability({
      reservedLayoutItemIds: ["reserved-1"],
      pendingLayoutItemIds: ["pending-1"],
      paidSeatHolders: [
        { layoutItemId: "reserved-1", customerName: "  Ada  " },
        { layoutItemId: "  ", customerName: "Skip" },
      ],
    }),
  });
  fetchTablesMock.mockResolvedValue({
    ok: true,
    items: [
      {
        id: FIXTURE_TABLE_CONFIG_ID,
        tableName: "Large 1",
        size: "LARGE",
        includedChairs: 8,
        bundlePrice: 250,
        sortOrder: 0,
      },
    ],
  });
  fetchChairsMock.mockResolvedValue({
    ok: true,
    config: {
      chairs: [
        {
          id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
          chairName: "Chair 1",
          displayLabel: "Chair 1",
          unitPrice: 35,
          sortOrder: 0,
        },
      ],
    },
  });
  fetchReservationsMock.mockResolvedValue({
    ok: true,
    reservations: [{ createdAt: "2030-01-02T00:00:00.000Z" }],
  });
  putLayoutMock.mockResolvedValue({
    ok: true,
    layout: makeFloorLayout({ items: [] }),
    status: 200,
    data: {},
  });
}

describe("useFloorLayoutEditor", () => {
  let uuidSeq = 0;

  beforeEach(() => {
    toastMock.mockClear();
    getTokenMock.mockReturnValue("token-1");
    routerPushMock.mockClear();
    writeSeenMock.mockClear();
    notifyBadgeMock.mockClear();
    readSeenMock.mockReturnValue(0);
    uuidSeq = 0;
    vi.stubGlobal("crypto", {
      randomUUID: () => `uuid-test-${++uuidSeq}`,
    });
    defaultHappyMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("loads layout, palette, availability badge bump, and catalogs", async () => {
    const { result } = renderHook(() => useFloorLayoutEditor());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBeNull();
    expect(result.current.layoutMeta.id).toBe(FIXTURE_LAYOUT_ID);
    expect(writeSeenMock).toHaveBeenCalled();
    expect(notifyBadgeMock).toHaveBeenCalled();
    expect(result.current.tableBundlePriceByConfigId[FIXTURE_TABLE_CONFIG_ID]).toBe(250);
  });

  it("sets not signed in when token missing", async () => {
    getTokenMock.mockReturnValue(null);
    const { result } = renderHook(() => useFloorLayoutEditor());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe("Not signed in.");
  });

  it("handles layout 401 and generic load failure", async () => {
    fetchLayoutMock.mockResolvedValue({
      ok: false,
      status: 401,
      data: { message: "bad token" },
      layout: null,
    });
    const { result, unmount } = renderHook(() => useFloorLayoutEditor());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toMatch(/token|Invalid|bad token/i);
    unmount();

    fetchLayoutMock.mockResolvedValue({
      ok: false,
      status: 500,
      data: {},
      layout: null,
    });
    const second = renderHook(() => useFloorLayoutEditor());
    await waitFor(() => expect(second.result.current.loading).toBe(false));
    expect(second.result.current.error).toMatch(/Could not load floor layout/i);
  });

  it("handles invalid layout null body", async () => {
    fetchLayoutMock.mockResolvedValue({
      ok: true,
      status: 200,
      layout: null,
      data: {},
    });
    const { result } = renderHook(() => useFloorLayoutEditor());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe("Invalid layout response.");
  });

  it("clears reservation context when availability fails; clears catalogs on fail", async () => {
    fetchAvailabilityMock.mockResolvedValue({ ok: false, message: "nope" });
    fetchTablesMock.mockResolvedValue({ ok: false, items: [] });
    fetchChairsMock.mockResolvedValue({ ok: false, config: null });
    fetchPaletteMock.mockResolvedValue({ ok: false, palette: null });
    const { result } = renderHook(() => useFloorLayoutEditor());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.reservedLayoutItemIds).toEqual([]);
    expect(result.current.eventDateIso).toBeNull();
  });

  it("sets offline error when load throws", async () => {
    fetchLayoutMock.mockRejectedValue(new Error("network"));
    const { result } = renderHook(() => useFloorLayoutEditor());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe("Could not reach the server.");
  });

  it("places table and chair, edits, rotates, removes, clears", async () => {
    const { result } = renderHook(() => useFloorLayoutEditor());
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.placePaletteItem({ type: "table", size: "LARGE" }, 10, 20);
    });
    expect(result.current.items).toHaveLength(1);
    expect(result.current.dirty).toBe(true);
    const tableId = result.current.selectedId!;

    act(() => {
      result.current.moveItem(tableId, 30, 40);
      result.current.updateRotation(tableId, 200);
    });
    expect(result.current.items.find((i) => i.id === tableId)!.rotation).toBe(-160);
    act(() => {
      result.current.updateRotation(tableId, -200);
    });
    const table = result.current.items.find((i) => i.id === tableId)!;
    expect(table.x).toBe(30);
    expect(table.rotation).toBe(0);

    act(() => {
      result.current.placePaletteItemAtCenter({ type: "chair" });
    });
    expect(result.current.items.some((i) => i.kind === "standalone_chair")).toBe(true);

    act(() => {
      result.current.setSelectedId(SCENE_STAGE_SELECT_ID);
    });
    act(() => {
      result.current.moveStage(1, 2);
      result.current.rotateSelected(200);
      result.current.rotateSelected(-200);
    });

    act(() => {
      result.current.setSelectedId(tableId);
    });
    act(() => {
      result.current.rotateSelected(15);
      result.current.removeSelected();
    });
    expect(result.current.items.every((i) => i.id !== tableId)).toBe(true);

    act(() => {
      result.current.rotateSelected(10);
      result.current.removeSelected();
    });

    act(() => result.current.clearAllItems());
    expect(result.current.items).toHaveLength(0);
  });

  it("toasts when inventory is empty for table/chair", async () => {
    fetchPaletteMock.mockResolvedValue({
      ok: true,
      palette: makeFloorLayoutPalette({
        unplacedTables: [],
        unplacedChairs: [],
      }),
    });
    const { result } = renderHook(() => useFloorLayoutEditor());
    await waitFor(() => expect(result.current.loading).toBe(false));
    act(() => {
      result.current.placePaletteItem({ type: "table", size: "LARGE" }, 0, 0);
      result.current.placePaletteItem({ type: "chair" }, 0, 0);
    });
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: "No tables available" }),
    );
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: "No chairs available" }),
    );
  });

  it("handles reserve mode select paths and cash reservation", async () => {
    const { result } = renderHook(() => useFloorLayoutEditor());
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.placePaletteItem({ type: "table", size: "LARGE" }, 5, 5);
    });
    const id = result.current.selectedId!;

    act(() => result.current.setEditorMode("edit"));
    act(() => result.current.handlePlacedItemSelect(id));
    expect(result.current.selectedId).toBe(id);

    act(() => result.current.setEditorMode("reserve"));
    act(() => result.current.handlePlacedItemSelect("reserved-1"));
    expect(routerPushMock).toHaveBeenCalled();

    act(() => result.current.handlePlacedItemSelect("pending-1"));
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Seat pending payment" }),
    );

    act(() => result.current.handlePlacedItemSelect(id));
    expect(result.current.selectedId).toBe(id);

    act(() => result.current.applyCashReservation(id, "  "));
    expect(result.current.reservedLayoutItemIds).toContain(id);
    expect(result.current.reservedLabelsByLayoutItemId[id]).toBe("Guest");
    act(() => result.current.applyCashReservation(id, "Bob"));
    expect(result.current.reservedLabelsByLayoutItemId[id]).toBe("Bob");
    expect(notifyBadgeMock).toHaveBeenCalled();

    act(() => result.current.onReservedItemSelect(id));
    expect(routerPushMock).toHaveBeenCalled();
  });

  it("saves layout, handles no token, failure, and offline", async () => {
    const { result } = renderHook(() => useFloorLayoutEditor());
    await waitFor(() => expect(result.current.loading).toBe(false));
    act(() => {
      result.current.placePaletteItem({ type: "table", size: "LARGE" }, 1, 1);
    });

    await act(async () => {
      await result.current.save();
    });
    expect(putLayoutMock).toHaveBeenCalled();
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Layout saved" }),
    );

    getTokenMock.mockReturnValue(null);
    await act(async () => {
      await result.current.save();
    });
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Not signed in" }),
    );

    getTokenMock.mockReturnValue("token-1");
    putLayoutMock.mockResolvedValueOnce({
      ok: false,
      message: "nope",
      data: { message: "nope" },
      layout: null,
      status: 400,
    });
    await act(async () => {
      await result.current.save();
    });
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Save failed" }),
    );

    putLayoutMock.mockRejectedValueOnce(new Error("Failed to fetch"));
    await act(async () => {
      await result.current.save();
    });
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Offline" }),
    );
  });

  it("keyboard Delete/Backspace removes selection but ignores inputs", async () => {
    const { result } = renderHook(() => useFloorLayoutEditor());
    await waitFor(() => expect(result.current.loading).toBe(false));
    act(() => {
      result.current.placePaletteItem({ type: "table", size: "LARGE" }, 2, 2);
    });
    expect(result.current.items).toHaveLength(1);

    const input = document.createElement("input");
    document.body.appendChild(input);
    act(() => {
      input.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Delete", bubbles: true }),
      );
    });
    expect(result.current.items).toHaveLength(1);

    act(() => {
      window.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Delete", bubbles: true }),
      );
    });
    expect(result.current.items).toHaveLength(0);

    act(() => {
      result.current.placePaletteItem({ type: "table", size: "LARGE" }, 3, 3);
    });
    act(() => {
      window.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Backspace", bubbles: true }),
      );
    });
    expect(result.current.items).toHaveLength(0);
    input.remove();
  });

  it("exposes chairTotal and itemLabels", async () => {
    const { result } = renderHook(() => useFloorLayoutEditor());
    await waitFor(() => expect(result.current.loading).toBe(false));
    act(() => {
      result.current.placePaletteItem({ type: "table", size: "LARGE" }, 0, 0);
    });
    expect(result.current.chairTotal).toBeGreaterThan(0);
    expect(result.current.itemLabels.size).toBeGreaterThan(0);
  });

  it("places second table/chair to exercise inventory filters and move peers", async () => {
    fetchPaletteMock.mockResolvedValue({
      ok: true,
      palette: makeFloorLayoutPalette({
        unplacedTables: [
          {
            id: FIXTURE_TABLE_CONFIG_ID,
            tableName: "Large 1",
            size: "LARGE",
            includedChairs: 8,
            sortOrder: 0,
          },
          {
            id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaab",
            tableName: "Large 2",
            size: "LARGE",
            includedChairs: 8,
            sortOrder: 1,
          },
        ],
        unplacedChairs: [
          {
            id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
            chairName: "Chair 1",
            displayLabel: "Chair 1",
            unitPrice: 35,
            sortOrder: 0,
          },
          {
            id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbc",
            chairName: "Chair 2",
            displayLabel: "Chair 2",
            unitPrice: 35,
            sortOrder: 1,
          },
        ],
      }),
    });
    const { result } = renderHook(() => useFloorLayoutEditor());
    await waitFor(() => expect(result.current.loading).toBe(false));
    act(() => {
      result.current.placePaletteItem({ type: "table", size: "LARGE" }, 1, 1);
    });
    act(() => {
      result.current.placePaletteItem({ type: "table", size: "LARGE" }, 2, 2);
    });
    act(() => {
      result.current.placePaletteItem({ type: "chair" }, 3, 3);
    });
    act(() => {
      result.current.placePaletteItem({ type: "chair" }, 4, 4);
    });
    expect(result.current.items.filter((i) => i.kind === "catalog_table")).toHaveLength(2);
    expect(result.current.items.filter((i) => i.kind === "standalone_chair")).toHaveLength(2);
    const firstId = result.current.items[0]!.id;
    const secondId = result.current.items[1]!.id;
    act(() => result.current.moveItem(firstId, 9, 9));
    expect(result.current.items.find((i) => i.id === firstId)!.x).toBe(9);
    expect(result.current.items.find((i) => i.id === secondId)!.x).not.toBe(9);
  });

  it("save applies layout when present and skips palette refresh when palette fails", async () => {
    putLayoutMock.mockResolvedValueOnce({
      ok: true,
      layout: null,
      status: 200,
      data: {},
    });
    fetchPaletteMock.mockResolvedValueOnce({
      ok: true,
      palette: makeFloorLayoutPalette(),
      status: 200,
    });
    const { result } = renderHook(() => useFloorLayoutEditor());
    await waitFor(() => expect(result.current.loading).toBe(false));
    fetchPaletteMock.mockResolvedValueOnce({ ok: false, palette: null, status: 500 });
    await act(async () => {
      await result.current.save();
    });
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Layout saved" }),
    );
  });

  it("ignores Backspace on textarea and skips badge when paid list is stale", async () => {
    readSeenMock.mockReturnValue(Date.parse("2099-01-01T00:00:00.000Z"));
    fetchReservationsMock.mockResolvedValue({
      ok: true,
      reservations: [{ createdAt: "not-a-date" }, { createdAt: "2020-01-01T00:00:00.000Z" }],
    });
    fetchAvailabilityMock.mockResolvedValue({
      ok: true,
      data: makeVenueAvailability({
        paidSeatHolders: [{ layoutItemId: "guest-1", customerName: "   " }],
      }),
    });
    const { result } = renderHook(() => useFloorLayoutEditor());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.reservedLabelsByLayoutItemId["guest-1"]).toBe("Guest");
    expect(notifyBadgeMock).not.toHaveBeenCalled();

    act(() => {
      result.current.placePaletteItem({ type: "table", size: "LARGE" }, 1, 1);
    });
    const textarea = document.createElement("textarea");
    document.body.appendChild(textarea);
    act(() => {
      textarea.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Backspace", bubbles: true }),
      );
    });
    expect(result.current.items).toHaveLength(1);
    textarea.remove();
  });

  it("skips paid reservation badge fetch when availability ok but paid list fails", async () => {
    fetchReservationsMock.mockResolvedValue({ ok: false, reservations: [] });
    const { result } = renderHook(() => useFloorLayoutEditor());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(writeSeenMock).not.toHaveBeenCalled();
  });

  it("loads empty eventDate as null reservation context", async () => {
    fetchAvailabilityMock.mockResolvedValue({
      ok: true,
      data: makeVenueAvailability({ eventDate: "" }),
    });
    const { result } = renderHook(() => useFloorLayoutEditor());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.eventDateIso).toBeNull();
  });

  it("ignores unrelated keyboard keys", async () => {
    const { result } = renderHook(() => useFloorLayoutEditor());
    await waitFor(() => expect(result.current.loading).toBe(false));
    act(() => {
      result.current.placePaletteItem({ type: "table", size: "LARGE" }, 1, 1);
    });
    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "a", bubbles: true }));
    });
    expect(result.current.items).toHaveLength(1);
  });
});
