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
  }: {
    isOpen: boolean;
    title: string;
  }) => (isOpen ? <div data-testid="confirm-delete">{title}</div> : null),
  ConfirmDeleteMessage: ({ name }: { name: string }) => <p>{name}</p>,
}));

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
  }: {
    isLoading: boolean;
    filteredCount: number;
  }) => (
    <div data-testid="list-section">
      {filteredCount === 0
        ? isLoading
          ? "Loading..."
          : "No service types to show."
        : "has-types"}
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

  it("shows delete modal when pendingDelete is set", () => {
    state = createMockServiceTypesPageState({
      pendingDelete: createMockServiceTypesPageState().list.types[0],
    });
    renderWithProviders(<ServiceTypesPageContent state={state as never} />);
    expect(screen.getByTestId("confirm-delete")).toBeInTheDocument();
  });
});
