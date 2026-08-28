/** @vitest-environment jsdom */

import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMockEventsPageState } from "../test/helpers/mockEventsPage";
import { makeAdminEvent } from "../test/fixtures/events.fixture";
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

vi.mock("@/components/admin/overlays", async () => {
  const React = await import("react");
  return {
    useBlockedActionWarning: () => {
      const [w, setW] = React.useState({
        isOpen: false,
        title: "",
        description: "",
      });
      return {
        ...w,
        openWarning: (next: { title: string; description: string }) =>
          setW({ isOpen: true, ...next }),
        closeWarning: () => setW({ isOpen: false, title: "", description: "" }),
      };
    },
    BlockedActionModal: ({
      isOpen,
      title,
      onClose,
    }: {
      isOpen: boolean;
      title: string;
      onClose: () => void;
    }) =>
      isOpen ? (
        <div data-testid="blocked">
          {title}
          <button type="button" onClick={onClose}>
            close-blocked
          </button>
        </div>
      ) : null,
  };
});

vi.mock("./EventsStatsBar", () => ({
  default: ({ variant }: { variant: string }) => (
    <div data-testid="stats-bar">{variant}</div>
  ),
}));

vi.mock("./EventsSearchBar", () => ({
  default: () => <div data-testid="search-bar" />,
}));

vi.mock("./EventsListSection", () => ({
  default: ({
    isLoading,
    searchedCount,
    onDelete,
    onBlockedDeactivate,
    onToggleActive,
    onView,
    onEdit,
  }: {
    isLoading: boolean;
    searchedCount: number;
    onDelete: (item: unknown) => void;
    onBlockedDeactivate: (item: unknown) => void;
    onToggleActive: (item: unknown) => void;
    onView: (item: unknown) => void;
    onEdit: (item: unknown) => void;
  }) => (
    <div data-testid="list-section">
      {searchedCount === 0
        ? isLoading
          ? "Loading..."
          : "No events to show."
        : "has-events"}
      <button type="button" onClick={() => onDelete({ id: "e1" })}>
        stub-delete
      </button>
      <button type="button" onClick={() => onBlockedDeactivate({ id: "e1" })}>
        stub-blocked-deact
      </button>
      <button type="button" onClick={() => onToggleActive({ id: "e1" })}>
        stub-toggle
      </button>
      <button type="button" onClick={() => onView({ id: "e1" })}>
        stub-view
      </button>
      <button type="button" onClick={() => onEdit({ id: "e1" })}>
        stub-edit
      </button>
    </div>
  ),
}));

vi.mock("./EventsFormModal", () => ({
  default: ({
    isOpen,
    onTypeDropdownToggle,
    onSelectEventType,
    onRemoveExistingImage,
    onSubmit,
  }: {
    isOpen: boolean;
    onTypeDropdownToggle: () => void;
    onSelectEventType: (id: string) => void;
    onRemoveExistingImage: (id: string) => void;
    onSubmit: (event: { preventDefault: () => void }) => void;
  }) =>
    isOpen ? (
      <div data-testid="form-modal">
        <button type="button" onClick={onTypeDropdownToggle}>
          stub-toggle-type
        </button>
        <button type="button" onClick={() => onSelectEventType("type-9")}>
          stub-select-type
        </button>
        <button type="button" onClick={() => onRemoveExistingImage("img-9")}>
          stub-remove-img
        </button>
        <button
          type="button"
          onClick={() => onSubmit({ preventDefault: () => undefined })}
        >
          stub-submit
        </button>
      </div>
    ) : null,
}));

vi.mock("./EventsDeleteModal", () => ({
  default: ({
    pendingDelete,
    onConfirm,
    onClose,
  }: {
    pendingDelete: unknown;
    onConfirm: () => void;
    onClose: () => void;
  }) =>
    pendingDelete ? (
      <div data-testid="delete-modal">
        <button type="button" onClick={onConfirm}>
          stub-confirm-delete
        </button>
        <button type="button" onClick={onClose}>
          stub-close-delete
        </button>
      </div>
    ) : null,
}));

vi.mock("./EventsViewOverlay", () => ({
  default: ({
    viewEvent,
    onClose,
  }: {
    viewEvent: unknown;
    onClose: () => void;
  }) =>
    viewEvent ? (
      <div data-testid="view-overlay">
        <button type="button" onClick={onClose}>
          stub-close-view
        </button>
      </div>
    ) : null,
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
    expect(screen.getByTestId("stats-bar")).toHaveTextContent("general");
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

  it("shows form modal when isModalOpen and wires form callbacks", async () => {
    const user = userEvent.setup();
    const open = createMockEventsPageState({ isModalOpen: true });
    open.form.setIsTypeDropdownOpen.mockImplementation(
      (next: boolean | ((prev: boolean) => boolean)) => {
        if (typeof next === "function") next(false);
      },
    );
    renderWithProviders(<EventsPageContent state={open as never} />);
    expect(screen.getByTestId("form-modal")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "stub-toggle-type" }));
    expect(open.form.setIsTypeDropdownOpen).toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "stub-select-type" }));
    expect(open.setEventTypeId).toHaveBeenCalledWith("type-9");
    expect(open.form.closeTypeDropdown).toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "stub-remove-img" }));
    expect(open.removeExistingCatalogImage).toHaveBeenCalledWith("img-9");
    await user.click(screen.getByRole("button", { name: "stub-submit" }));
    expect(open.onSubmit).toHaveBeenCalled();
  });

  it("uses embedded chrome without ModuleHero", async () => {
    const user = userEvent.setup();
    const embedded = createMockEventsPageState({
      embedded: true,
      createLabel: "New upcoming event",
    });
    renderWithProviders(<EventsPageContent state={embedded as never} />);
    expect(screen.queryByRole("heading", { name: "Events" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "New upcoming event" }));
    expect(embedded.openCreateModal).toHaveBeenCalled();
  });

  it("uses upcoming stats variant", () => {
    const upcoming = createMockEventsPageState({ upcomingOnly: true });
    renderWithProviders(<EventsPageContent state={upcoming as never} />);
    expect(screen.getByTestId("stats-bar")).toHaveTextContent("upcomingSite");
  });

  it("opens delete confirm when canDeleteEvent is true", async () => {
    const user = userEvent.setup();
    renderWithProviders(<EventsPageContent state={state as never} />);
    await user.click(screen.getByRole("button", { name: "stub-delete" }));
    expect(state.openDeleteConfirm).toHaveBeenCalled();
  });

  it("shows Cannot delete blocked modal when canDeleteEvent is false", async () => {
    const user = userEvent.setup();
    state.canDeleteEvent = vi.fn(() => false);
    renderWithProviders(<EventsPageContent state={state as never} />);
    await user.click(screen.getByRole("button", { name: "stub-delete" }));
    expect(screen.getByTestId("blocked")).toHaveTextContent("Cannot delete");
    expect(state.openDeleteConfirm).not.toHaveBeenCalled();
  });

  it("shows Cannot deactivate blocked modal", async () => {
    const user = userEvent.setup();
    renderWithProviders(<EventsPageContent state={state as never} />);
    await user.click(screen.getByRole("button", { name: "stub-blocked-deact" }));
    expect(screen.getByTestId("blocked")).toHaveTextContent("Cannot deactivate");
    await user.click(screen.getByRole("button", { name: "close-blocked" }));
    expect(screen.queryByTestId("blocked")).not.toBeInTheDocument();
  });

  it("forwards toggle/view/edit and delete confirm", async () => {
    const user = userEvent.setup();
    const withDelete = createMockEventsPageState({
      pendingDelete: makeAdminEvent(),
      viewEvent: makeAdminEvent(),
    });
    renderWithProviders(<EventsPageContent state={withDelete as never} />);
    await user.click(screen.getByRole("button", { name: "stub-toggle" }));
    expect(withDelete.onToggleActive).toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "stub-view" }));
    expect(withDelete.setViewEvent).toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "stub-edit" }));
    expect(withDelete.startEdit).toHaveBeenCalled();
    expect(screen.getByTestId("delete-modal")).toBeInTheDocument();
    expect(screen.getByTestId("view-overlay")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "stub-confirm-delete" }));
    expect(withDelete.onConfirmDelete).toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "stub-close-delete" }));
    expect(withDelete.closeDeleteModal).toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "stub-close-view" }));
    expect(withDelete.setViewEvent).toHaveBeenCalledWith(null);
  });

  it("shows validation alert blocked modal", async () => {
    const user = userEvent.setup();
    const alert = createMockEventsPageState({
      validationAlert: "Enter a name",
    });
    renderWithProviders(<EventsPageContent state={alert as never} />);
    expect(screen.getByTestId("blocked")).toHaveTextContent("Missing required fields");
    await user.click(screen.getByRole("button", { name: "close-blocked" }));
    expect(alert.closeValidationAlert).toHaveBeenCalled();
  });
});
