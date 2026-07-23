/** @vitest-environment jsdom */

import type { ReactNode } from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../test/utils/renderWithProviders";
import { defaultWeekly } from "../lib/disponibilidadConstants";
import { makeAdminAvailabilitySnapshot } from "../test/fixtures/disponibilidad.fixture";

const useDisponibilidadPageMock = vi.fn();

vi.mock("../hooks/useDisponibilidadPage", () => ({
  useDisponibilidadPage: () => useDisponibilidadPageMock(),
}));

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock("./DisponibilidadPanelTabs", () => ({
  default: ({
    activePanel,
    onPanelChange,
  }: {
    activePanel: string;
    onPanelChange: (panel: string) => void;
  }) => (
    <div data-testid="disponibilidad-panel-tabs">
      <span>active:{activePanel}</span>
      <button onClick={() => onPanelChange("weekly")}>tab-weekly</button>
      <button onClick={() => onPanelChange("closures")}>tab-closures</button>
    </div>
  ),
}));

vi.mock("./DisponibilidadWeeklyPanel", () => ({
  default: () => <div data-testid="disponibilidad-weekly-panel" />,
}));

vi.mock("./DisponibilidadClosuresPanel", () => ({
  default: () => <div data-testid="disponibilidad-closures-panel" />,
}));

vi.mock("./DisponibilidadPickers", () => ({
  default: () => <div data-testid="disponibilidad-pickers" />,
}));

vi.mock("./DisponibilidadDeleteClosureModal", () => ({
  default: () => <div data-testid="disponibilidad-delete-closure-modal" />,
}));

import DisponibilidadPageContent from "./DisponibilidadPageContent";

function makePage(overrides: Record<string, unknown> = {}) {
  return {
    snapshot: makeAdminAvailabilitySnapshot(),
    isLoading: false,
    error: null,
    reload: vi.fn(),
    activePanel: "weekly" as const,
    setActivePanel: vi.fn(),
    timePickerTarget: null,
    setTimePickerTarget: vi.fn(),
    pickerValue: "",
    onSaveWeekly: vi.fn(),
    onAddClosure: vi.fn(),
    onConfirmDeleteClosure: vi.fn(),
    onTimePickerConfirm: vi.fn(),
    weekly: {
      weeklyDraft: defaultWeekly(),
      setWeeklyDraft: vi.fn(),
      savingWeekly: false,
      setSavingWeekly: vi.fn(),
      sortedRows: defaultWeekly(),
      updateRowClosed: vi.fn(),
      setRowTime: vi.fn(),
    },
    closure: {
      closureKind: "SPECIFIC_DATE" as const,
      setClosureKind: vi.fn(),
      closureDate: "",
      setClosureDate: vi.fn(),
      closureStartDate: "",
      setClosureStartDate: vi.fn(),
      closureEndDate: "",
      setClosureEndDate: vi.fn(),
      closureWeekday: 0,
      setClosureWeekday: vi.fn(),
      closureNote: "",
      setClosureNote: vi.fn(),
      addingClosure: false,
      setAddingClosure: vi.fn(),
      confirmClosureId: null,
      setConfirmClosureId: vi.fn(),
      closureDatePickerTarget: null,
      setClosureDatePickerTarget: vi.fn(),
      resetClosureFields: vi.fn(),
      onClosureKindChange: vi.fn(),
      onClosureDateConfirm: vi.fn(),
    },
    ...overrides,
  };
}

describe("DisponibilidadPageContent", () => {
  beforeEach(() => {
    useDisponibilidadPageMock.mockReset();
  });

  it("renders the Back link and the Availability hero title", () => {
    useDisponibilidadPageMock.mockReturnValue(makePage());
    renderWithProviders(<DisponibilidadPageContent />);

    expect(screen.getByRole("link", { name: /back/i })).toHaveAttribute(
      "href",
      "/admin/agenda",
    );
    expect(screen.getByRole("heading", { name: "Availability" })).toBeInTheDocument();
  });

  it("renders the weekly panel and not the closures panel by default", () => {
    useDisponibilidadPageMock.mockReturnValue(makePage({ activePanel: "weekly" }));
    renderWithProviders(<DisponibilidadPageContent />);

    expect(screen.getByTestId("disponibilidad-weekly-panel")).toBeInTheDocument();
    expect(screen.queryByTestId("disponibilidad-closures-panel")).not.toBeInTheDocument();
  });

  it("renders the closures panel and not the weekly panel when activePanel is 'closures'", () => {
    useDisponibilidadPageMock.mockReturnValue(makePage({ activePanel: "closures" }));
    renderWithProviders(<DisponibilidadPageContent />);

    expect(screen.getByTestId("disponibilidad-closures-panel")).toBeInTheDocument();
    expect(screen.queryByTestId("disponibilidad-weekly-panel")).not.toBeInTheDocument();
  });

  it("always renders the pickers and delete closure modal", () => {
    useDisponibilidadPageMock.mockReturnValue(makePage());
    renderWithProviders(<DisponibilidadPageContent />);

    expect(screen.getByTestId("disponibilidad-pickers")).toBeInTheDocument();
    expect(screen.getByTestId("disponibilidad-delete-closure-modal")).toBeInTheDocument();
  });

  it("wires the panel tabs to setActivePanel", async () => {
    const user = userEvent.setup();
    const setActivePanel = vi.fn();
    useDisponibilidadPageMock.mockReturnValue(makePage({ setActivePanel }));
    renderWithProviders(<DisponibilidadPageContent />);

    await user.click(screen.getByText("tab-closures"));
    expect(setActivePanel).toHaveBeenCalledWith("closures");

    await user.click(screen.getByText("tab-weekly"));
    expect(setActivePanel).toHaveBeenCalledWith("weekly");
  });
});
