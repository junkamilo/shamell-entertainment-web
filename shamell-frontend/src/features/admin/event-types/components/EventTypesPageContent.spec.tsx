/** @vitest-environment jsdom */

import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMockEventTypesPageState } from "../test/helpers/mockEventTypesPage";
import { renderWithProviders } from "../test/utils/renderWithProviders";

vi.mock("@/components/admin/layout", () => ({
  ModuleHero: ({
    title,
    onAction,
  }: {
    title: string;
    onAction?: () => void;
  }) => (
    <div>
      <h1>{title}</h1>
      <button type="button" onClick={onAction} data-testid="stub-new">
        New type
      </button>
    </div>
  ),
}));

vi.mock("@/components/admin/overlays", () => ({
  useBlockedActionWarning: () => ({
    isOpen: false,
    title: "",
    description: "",
    openWarning: vi.fn(),
    closeWarning: vi.fn(),
  }),
  BlockedActionModal: ({ isOpen, title }: { isOpen: boolean; title: string }) =>
    isOpen ? <div data-testid="blocked">{title}</div> : null,
  ConfirmDeleteModal: ({
    isOpen,
    title,
    children,
    onConfirm,
    onClose,
  }: {
    isOpen: boolean;
    title: string;
    children: React.ReactNode;
    onConfirm: () => void;
    onClose: () => void;
  }) =>
    isOpen ? (
      <div data-testid="confirm-delete">
        <button type="button" onClick={onConfirm}>
          CONFIRM
        </button>
        <button type="button" onClick={onClose}>
          CLOSE
        </button>
        {title}
        {children}
      </div>
    ) : null,
  ConfirmDeleteMessage: ({ name }: { name: string }) => <p>{name}</p>,
}));

vi.mock("./EventTypesStatsBar", () => ({
  default: () => <div data-testid="stats-bar" />,
}));

vi.mock("./EventTypesToolbar", () => ({
  default: () => <div data-testid="toolbar" />,
}));

vi.mock("./EventTypesListSection", () => ({
  default: ({
    isLoading,
    filteredCount,
  }: {
    isLoading: boolean;
    filteredCount: number;
  }) => (
    <div data-testid="list-section">
      {filteredCount === 0
        ? isLoading
          ? "Loading..."
          : "No event types to show."
        : "has-types"}
    </div>
  ),
}));

vi.mock("./EventTypesFormModal", () => ({
  default: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div data-testid="form-modal" /> : null,
}));

import EventTypesPageContent from "./EventTypesPageContent";

describe("EventTypesPageContent", () => {
  let state = createMockEventTypesPageState();

  beforeEach(() => {
    state = createMockEventTypesPageState();
  });

  it('renders the "Event types" hero and list shells', () => {
    renderWithProviders(<EventTypesPageContent state={state as never} />);

    expect(screen.getByRole("heading", { name: "Event types" })).toBeInTheDocument();
    expect(screen.getByTestId("stats-bar")).toBeInTheDocument();
    expect(screen.getByTestId("toolbar")).toBeInTheDocument();
    expect(screen.getByTestId("list-section")).toHaveTextContent("has-types");
  });

  it("calls openCreateModal from stub-new", async () => {
    const user = userEvent.setup();
    renderWithProviders(<EventTypesPageContent state={state as never} />);

    await user.click(screen.getByTestId("stub-new"));
    expect(state.openCreateModal).toHaveBeenCalledOnce();
  });

  it("shows loading and empty via list stubs", () => {
    const loading = createMockEventTypesPageState({
      list: { isLoading: true, filteredTypes: [], pagedTypes: [] },
    });
    const { rerender } = renderWithProviders(
      <EventTypesPageContent state={loading as never} />,
    );
    expect(screen.getByTestId("list-section")).toHaveTextContent("Loading...");

    const empty = createMockEventTypesPageState({
      list: { isLoading: false, filteredTypes: [], pagedTypes: [] },
    });
    rerender(<EventTypesPageContent state={empty as never} />);
    expect(screen.getByTestId("list-section")).toHaveTextContent(
      "No event types to show.",
    );
  });
});
