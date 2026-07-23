/** @vitest-environment jsdom */

import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMockServicesPageState } from "../test/helpers/mockServicesPage";
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
      <button type="button" onClick={onAction} data-testid="stub-new-service">
        New service
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
  BlockedActionModal: () => null,
  ConfirmDeleteModal: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div data-testid="confirm-delete-modal" /> : null,
  ConfirmDeleteMessage: () => null,
}));

vi.mock("./ServicesStatsBar", () => ({
  default: () => <div data-testid="stats-bar" />,
}));

vi.mock("./ServicesToolbar", () => ({
  default: () => <div data-testid="toolbar" />,
}));

vi.mock("./ServicesListSection", () => ({
  default: ({
    isLoading,
    filteredServices,
  }: {
    isLoading: boolean;
    filteredServices: unknown[];
  }) => (
    <div data-testid="list-section">
      {filteredServices.length === 0
        ? isLoading
          ? "Loading..."
          : "No services to show."
        : "has-services"}
    </div>
  ),
}));

vi.mock("./ServicesFormModal", () => ({
  default: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div data-testid="form-modal" /> : null,
}));

vi.mock("./ServicesFormLightbox", () => ({
  default: () => null,
}));

vi.mock("./ServicesViewOverlay", () => ({
  default: () => null,
}));

vi.mock("./ServicesClearMediaModal", () => ({
  default: () => null,
}));

vi.mock("./ServicesNoTypesBanner", () => ({
  default: () => <div data-testid="no-types-banner" />,
}));

import ServicesPageContent from "./ServicesPageContent";

describe("ServicesPageContent", () => {
  let state = createMockServicesPageState();

  beforeEach(() => {
    state = createMockServicesPageState();
  });

  it("renders the Services hero and list shells", () => {
    renderWithProviders(<ServicesPageContent state={state as never} />);

    expect(screen.getByRole("heading", { name: "Services" })).toBeInTheDocument();
    expect(screen.getByTestId("stats-bar")).toBeInTheDocument();
    expect(screen.getByTestId("toolbar")).toBeInTheDocument();
    expect(screen.getByTestId("list-section")).toHaveTextContent("has-services");
  });

  it("calls openCreateModal from stub-new-service", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ServicesPageContent state={state as never} />);

    await user.click(screen.getByTestId("stub-new-service"));
    expect(state.openCreateModal).toHaveBeenCalledOnce();
  });

  it("shows loading and empty via list stubs", () => {
    const loading = createMockServicesPageState({
      catalog: { isLoading: true },
      list: { filteredServices: [], paginatedServices: [] },
    });
    const { rerender } = renderWithProviders(
      <ServicesPageContent state={loading as never} />,
    );
    expect(screen.getByTestId("list-section")).toHaveTextContent("Loading...");

    const empty = createMockServicesPageState({
      catalog: { isLoading: false },
      list: { filteredServices: [], paginatedServices: [] },
    });
    rerender(<ServicesPageContent state={empty as never} />);
    expect(screen.getByTestId("list-section")).toHaveTextContent(
      "No services to show.",
    );
  });
});
