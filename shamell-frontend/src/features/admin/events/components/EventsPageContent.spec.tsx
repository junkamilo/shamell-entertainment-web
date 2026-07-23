/** @vitest-environment jsdom */

import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMockEventsPageState } from "../test/helpers/mockEventsPage";
import { renderWithProviders } from "../test/utils/renderWithProviders";

vi.mock("@/components/admin/layout", () => ({
  ModuleHero: ({
    title,
    actionLabel,
    onAction,
  }: {
    title: string;
    actionLabel?: string;
    onAction?: () => void;
  }) => (
    <div>
      <h1>{title}</h1>
      <button type="button" onClick={onAction} data-testid="stub-new-event">
        {actionLabel ?? "New event"}
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
}));

vi.mock("./EventsStatsBar", () => ({
  default: () => <div data-testid="stats-bar" />,
}));

vi.mock("./EventsSearchBar", () => ({
  default: () => <div data-testid="search-bar" />,
}));

vi.mock("./EventsListSection", () => ({
  default: ({
    isLoading,
    searchedCount,
  }: {
    isLoading: boolean;
    searchedCount: number;
  }) => (
    <div data-testid="list-section">
      {searchedCount === 0
        ? isLoading
          ? "Loading..."
          : "No events to show."
        : "has-events"}
    </div>
  ),
}));

vi.mock("./EventsFormModal", () => ({
  default: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div data-testid="form-modal" /> : null,
}));

vi.mock("./EventsDeleteModal", () => ({
  default: ({
    pendingDelete,
  }: {
    pendingDelete: unknown;
  }) =>
    pendingDelete ? <div data-testid="delete-modal" /> : null,
}));

vi.mock("./EventsViewOverlay", () => ({
  default: ({ viewEvent }: { viewEvent: unknown }) =>
    viewEvent ? <div data-testid="view-overlay" /> : null,
}));

import EventsPageContent from "./EventsPageContent";

describe("EventsPageContent", () => {
  let state = createMockEventsPageState();

  beforeEach(() => {
    state = createMockEventsPageState();
  });

  it("renders the Events hero and list shells", () => {
    renderWithProviders(<EventsPageContent state={state as never} />);

    expect(screen.getByRole("heading", { name: "Events" })).toBeInTheDocument();
    expect(screen.getByTestId("stats-bar")).toBeInTheDocument();
    expect(screen.getByTestId("search-bar")).toBeInTheDocument();
    expect(screen.getByTestId("list-section")).toHaveTextContent("has-events");
  });

  it("calls openCreateModal from New event", async () => {
    const user = userEvent.setup();
    renderWithProviders(<EventsPageContent state={state as never} />);

    await user.click(screen.getByTestId("stub-new-event"));
    expect(state.openCreateModal).toHaveBeenCalledOnce();
  });

  it("shows loading and empty via list stubs", () => {
    const loading = createMockEventsPageState({
      catalog: { isLoading: true },
      list: { searchedEvents: [], paginatedEvents: [], sectionEventsCount: 0 },
    });
    const { rerender } = renderWithProviders(
      <EventsPageContent state={loading as never} />,
    );
    expect(screen.getByTestId("list-section")).toHaveTextContent("Loading...");

    const empty = createMockEventsPageState({
      catalog: { isLoading: false },
      list: { searchedEvents: [], paginatedEvents: [], sectionEventsCount: 0 },
    });
    rerender(<EventsPageContent state={empty as never} />);
    expect(screen.getByTestId("list-section")).toHaveTextContent(
      "No events to show.",
    );
  });

  it("shows form modal when isModalOpen", () => {
    const open = createMockEventsPageState({ isModalOpen: true });
    renderWithProviders(<EventsPageContent state={open as never} />);
    expect(screen.getByTestId("form-modal")).toBeInTheDocument();
  });
});
