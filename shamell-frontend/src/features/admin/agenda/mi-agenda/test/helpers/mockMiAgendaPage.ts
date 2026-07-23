import { vi } from "vitest";
import type { EnrichedBooking } from "../../types/miAgenda.types";
import { makeEnrichedBooking } from "../fixtures/miAgenda.fixture";

export function createMockMiAgendaPageState(
  overrides: Record<string, unknown> = {},
) {
  const selected = (overrides.selected as EnrichedBooking | null | undefined) ?? null;
  return {
    calendar: {
      rangeText: "Jul 20 – Jul 26, 2026",
      viewMode: "week",
      setViewMode: vi.fn(),
      goPrev: vi.fn(),
      goNext: vi.fn(),
      goToday: vi.fn(),
      anchorIso: "2026-07-22",
      weekDays: [
        "2026-07-20",
        "2026-07-21",
        "2026-07-22",
        "2026-07-23",
        "2026-07-24",
        "2026-07-25",
        "2026-07-26",
      ],
      monthGrid: Array.from({ length: 42 }, (_, i) => {
        const d = new Date(Date.UTC(2026, 5, 29 + i));
        return d.toISOString().slice(0, 10);
      }),
      range: { fromIso: "2026-07-20", toIso: "2026-07-26" },
      tz: "America/New_York",
      ...(overrides.calendar as object | undefined),
    },
    bookings: {
      byDate: new Map<string, EnrichedBooking[]>([
        ["2026-07-22", [makeEnrichedBooking()]],
      ]),
      isLoading: false,
      error: null as string | null,
      items: [makeEnrichedBooking()],
      patchBooking: vi.fn(),
      ...(overrides.bookings as object | undefined),
    },
    edit: {
      isEditing: false,
      savingEdit: false,
      editDateIso: "2026-07-22",
      editStart: "10:00",
      editEnd: "11:30",
      editLocation: "Studio A",
      editNotes: "Bring shoes",
      toggleEditing: vi.fn(),
      setEditDateIso: vi.fn(),
      setEditStart: vi.fn(),
      setEditEnd: vi.fn(),
      setEditLocation: vi.fn(),
      setEditNotes: vi.fn(),
      ...(overrides.edit as object | undefined),
    },
    selectedId: selected?.id ?? null,
    setSelectedId: vi.fn(),
    selected,
    savingCancel: false,
    cancelModalOpen: false,
    setCancelModalOpen: vi.fn(),
    onSaveEdit: vi.fn(),
    onConfirmCancel: vi.fn(),
    ...overrides,
  };
}
