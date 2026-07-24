/** @vitest-environment jsdom */

import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMockOccasionTypesPageState } from "../test/helpers/mockOccasionTypesPage";
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

vi.mock("./OccasionTypesToolbar", () => ({
  default: () => <div data-testid="toolbar" />,
}));

vi.mock("./OccasionTypesListSection", () => ({
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
          : "No occasion types to show."
        : "has-types"}
    </div>
  ),
}));

vi.mock("./OccasionTypesFormModal", () => ({
  default: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div data-testid="form-modal" /> : null,
}));

import OccasionTypesPageContent from "./OccasionTypesPageContent";

describe("OccasionTypesPageContent", () => {
  let state = createMockOccasionTypesPageState();

  beforeEach(() => {
    state = createMockOccasionTypesPageState();
  });

  it("renders Occasion types hero and shells", () => {
    renderWithProviders(<OccasionTypesPageContent state={state as never} />);
    expect(
      screen.getByRole("heading", { name: "Occasion types" }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("toolbar")).toBeInTheDocument();
    expect(screen.getByTestId("list-section")).toHaveTextContent("has-types");
  });

  it("opens create via hero action", async () => {
    const user = userEvent.setup();
    renderWithProviders(<OccasionTypesPageContent state={state as never} />);
    await user.click(screen.getByTestId("stub-new"));
    expect(state.openCreateModal).toHaveBeenCalled();
  });

  it("shows form modal when open", () => {
    state = createMockOccasionTypesPageState({ isModalOpen: true });
    renderWithProviders(<OccasionTypesPageContent state={state as never} />);
    expect(screen.getByTestId("form-modal")).toBeInTheDocument();
  });

  it("shows delete modal when pendingDelete is set", () => {
    state = createMockOccasionTypesPageState({
      pendingDelete: createMockOccasionTypesPageState().list.rows[0],
    });
    renderWithProviders(<OccasionTypesPageContent state={state as never} />);
    expect(screen.getByTestId("confirm-delete")).toBeInTheDocument();
  });
});
