/** @vitest-environment jsdom */

import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMockServiceTypesPageState } from "../test/helpers/mockServiceTypesPage";
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
    BlockedActionModal: ({ isOpen, title }: { isOpen: boolean; title: string }) =>
      isOpen ? <div data-testid="blocked">{title}</div> : null,
    ConfirmDeleteModal: ({
      isOpen,
      title,
      onConfirm,
      onClose,
    }: {
      isOpen: boolean;
      title: string;
      onConfirm: () => void;
      onClose: () => void;
    }) =>
      isOpen ? (
        <div data-testid="confirm-delete">
          {title}
          <button type="button" onClick={onConfirm}>
            CONFIRM
          </button>
          <button type="button" onClick={onClose}>
            CLOSE
          </button>
        </div>
      ) : null,
    ConfirmDeleteMessage: ({ name }: { name: string }) => <p>{name}</p>,
  };
});

vi.mock("./ServiceTypesStatsBar", () => ({
  default: () => <div data-testid="stats-bar" />,
}));

vi.mock("./ServiceTypesToolbar", () => ({
  default: () => <div data-testid="toolbar" />,
}));

vi.mock("./ServiceTypesListSection", () => ({
  default: ({
    isLoading,
    filteredCount,
    onDelete,
    onBlockedDeactivate,
    onToggleActive,
  }: {
    isLoading: boolean;
    filteredCount: number;
    onDelete: (item: unknown) => void;
    onBlockedDeactivate: (item: unknown) => void;
    onToggleActive: (item: unknown) => void;
  }) => (
    <div data-testid="list-section">
      {filteredCount === 0
        ? isLoading
          ? "Loading..."
          : "No service types to show."
        : "has-types"}
      <button type="button" onClick={() => onDelete({ id: "t1" })}>
        stub-delete
      </button>
      <button type="button" onClick={() => onBlockedDeactivate({ id: "t1" })}>
        stub-blocked-deact
      </button>
      <button type="button" onClick={() => onToggleActive({ id: "t1" })}>
        stub-toggle
      </button>
    </div>
  ),
}));

vi.mock("./ServiceTypesFormModal", () => ({
  default: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div data-testid="form-modal" /> : null,
}));

import ServiceTypesPageContent from "./ServiceTypesPageContent";

describe("ServiceTypesPageContent", () => {
  let state = createMockServiceTypesPageState();

  beforeEach(() => {
    state = createMockServiceTypesPageState();
  });

  it("renders Service types hero and shells", () => {
    renderWithProviders(<ServiceTypesPageContent state={state as never} />);
    expect(
      screen.getByRole("heading", { name: "Service types" }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("stats-bar")).toBeInTheDocument();
    expect(screen.getByTestId("toolbar")).toBeInTheDocument();
    expect(screen.getByTestId("list-section")).toHaveTextContent("has-types");
  });

  it("opens create via hero action", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ServiceTypesPageContent state={state as never} />);
    await user.click(screen.getByTestId("stub-new"));
    expect(state.openCreateModal).toHaveBeenCalled();
  });

  it("shows form modal when open", () => {
    state = createMockServiceTypesPageState({ isModalOpen: true });
    renderWithProviders(<ServiceTypesPageContent state={state as never} />);
    expect(screen.getByTestId("form-modal")).toBeInTheDocument();
  });

  it("shows delete modal when pendingDelete is set", async () => {
    const user = userEvent.setup();
    state = createMockServiceTypesPageState({
      pendingDelete: createMockServiceTypesPageState().list.types[0],
    });
    renderWithProviders(<ServiceTypesPageContent state={state as never} />);
    expect(screen.getByTestId("confirm-delete")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "CONFIRM" }));
    expect(state.onConfirmDelete).toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "CLOSE" }));
    expect(state.closeDeleteModal).toHaveBeenCalled();
  });

  it("opens delete confirm or blocked modal", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ServiceTypesPageContent state={state as never} />);
    await user.click(screen.getByRole("button", { name: "stub-delete" }));
    expect(state.openDeleteConfirm).toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "stub-toggle" }));
    expect(state.onToggleActive).toHaveBeenCalled();
  });

  it("blocks delete and deactivate", async () => {
    const user = userEvent.setup();
    state.canDeleteServiceType = vi.fn(() => false);
    renderWithProviders(<ServiceTypesPageContent state={state as never} />);
    await user.click(screen.getByRole("button", { name: "stub-delete" }));
    expect(screen.getByTestId("blocked")).toHaveTextContent("Cannot delete");
    await user.click(screen.getByRole("button", { name: "stub-blocked-deact" }));
    expect(screen.getByTestId("blocked")).toHaveTextContent("Cannot deactivate");
  });
});
