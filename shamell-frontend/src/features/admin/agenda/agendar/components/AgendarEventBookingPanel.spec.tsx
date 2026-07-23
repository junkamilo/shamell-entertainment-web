/** @vitest-environment jsdom */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { createMockAgendarFormState } from "../tests/helpers/mockAgendarFormState";
import { sampleAgendarCatalog } from "../tests/fixtures/catalog.fixture";
import type { AgendarAvailability } from "../types/agendarAvailability.types";

const useAgendarPageMock = vi.fn();

vi.mock("../hooks/useAgendarPage", () => ({
  useAgendarPage: () => useAgendarPageMock(),
}));

vi.mock("@/features/contacto/components/ContactDatePickerModal", () => ({
  default: () => null,
}));

vi.mock("@/features/contacto/components/ContactTimePickerModal", () => ({
  default: () => null,
}));

import { AgendarEventBookingPanel } from "./AgendarEventBookingPanel";

const availability = {
  bookingTz: "America/New_York",
  blockedIsoDates: new Set<string>(),
  blockedReasonByIso: new Map<string, string>(),
  startTimeClamp: undefined,
  minSelectableIso: "2026-07-01",
} as AgendarAvailability;

function makePage(overrides: Record<string, unknown> = {}) {
  return {
    form: createMockAgendarFormState(),
    catalog: sampleAgendarCatalog,
    catalogLoading: false,
    editLoading: false,
    availability,
    occupiedRanges: [],
    isMobileLayout: false,
    submitting: false,
    isEditMode: false,
    onSubmit: vi.fn((e: React.FormEvent) => e.preventDefault()),
    ...overrides,
  };
}

describe("AgendarEventBookingPanel", () => {
  beforeEach(() => {
    useAgendarPageMock.mockReset();
  });

  it("shows a spinner while catalog loads", () => {
    useAgendarPageMock.mockReturnValue(makePage({ catalogLoading: true }));
    const { container } = render(<AgendarEventBookingPanel />);
    expect(container.querySelector(".animate-spin")).toBeTruthy();
    expect(screen.queryByLabelText(/select event type/i)).not.toBeInTheDocument();
  });

  it("renders desktop event fields and submit", () => {
    useAgendarPageMock.mockReturnValue(makePage({ isMobileLayout: false }));
    render(<AgendarEventBookingPanel />);

    expect(screen.getByLabelText(/select event type/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/client — name/i)).toBeInTheDocument();
    expect(screen.getByTestId("agendar-submit")).toHaveTextContent(/create booking/i);
  });

  it("renders mobile section list instead of desktop fields", () => {
    useAgendarPageMock.mockReturnValue(makePage({ isMobileLayout: true }));
    render(<AgendarEventBookingPanel />);

    expect(screen.getByText(/event setup/i)).toBeInTheDocument();
    expect(screen.getByText(/when & where/i)).toBeInTheDocument();
    expect(screen.getByTestId("agendar-submit")).toBeInTheDocument();
    expect(screen.queryByLabelText(/select event type/i)).not.toBeInTheDocument();
  });
});
