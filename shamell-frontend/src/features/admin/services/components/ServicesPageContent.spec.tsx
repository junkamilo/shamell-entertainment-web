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
      onConfirm,
      onClose,
    }: {
      isOpen: boolean;
      onConfirm: () => void;
      onClose: () => void;
    }) =>
      isOpen ? (
        <div data-testid="confirm-delete-modal">
          <button type="button" onClick={onConfirm}>
            CONFIRM
          </button>
          <button type="button" onClick={onClose}>
            CLOSE
          </button>
        </div>
      ) : null,
    ConfirmDeleteMessage: () => null,
  };
});

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
    onDelete,
    onBlockedDeactivate,
    onToggle,
  }: {
    isLoading: boolean;
    filteredServices: unknown[];
    onDelete: (item: unknown) => void;
    onBlockedDeactivate: (item: unknown) => void;
    onToggle: (item: unknown) => void;
  }) => (
    <div data-testid="list-section">
      {filteredServices.length === 0
        ? isLoading
          ? "Loading..."
          : "No services to show."
        : "has-services"}
      <button type="button" onClick={() => onDelete({ id: "s1" })}>
        stub-delete
      </button>
      <button type="button" onClick={() => onBlockedDeactivate({ id: "s1" })}>
        stub-blocked-deact
      </button>
      <button type="button" onClick={() => onToggle({ id: "s1" })}>
        stub-toggle
      </button>
    </div>
  ),
}));

vi.mock("./ServicesFormModal", () => ({
  default: ({
    isOpen,
    onRequestClearSavedMedia,
  }: {
    isOpen: boolean;
    onRequestClearSavedMedia: () => void;
  }) =>
    isOpen ? (
      <div data-testid="form-modal">
        <button type="button" onClick={onRequestClearSavedMedia}>
          stub-clear-media
        </button>
      </div>
    ) : null,
}));

vi.mock("./ServicesFormLightbox", () => ({
  default: ({
    isOpen,
    onClose,
  }: {
    isOpen: boolean;
    onClose: () => void;
  }) =>
    isOpen ? (
      <div data-testid="lightbox">
        <button type="button" onClick={onClose}>
          stub-close-lightbox
        </button>
      </div>
    ) : null,
}));

vi.mock("./ServicesViewOverlay", () => ({
  default: ({
    service,
    onClose,
  }: {
    service: unknown;
    onClose: () => void;
  }) =>
    service ? (
      <div data-testid="view-overlay">
        <button type="button" onClick={onClose}>
          stub-close-view
        </button>
      </div>
    ) : null,
}));

vi.mock("./ServicesClearMediaModal", () => ({
  default: ({
    isOpen,
    onConfirm,
    onClose,
  }: {
    isOpen: boolean;
    onConfirm: () => void;
    onClose: () => void;
  }) =>
    isOpen ? (
      <div data-testid="clear-media-modal">
        <button type="button" onClick={onConfirm}>
          stub-confirm-clear
        </button>
        <button type="button" onClick={onClose}>
          stub-close-clear
        </button>
      </div>
    ) : null,
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

  it("shows no-types banner when there are no active types", () => {
    const none = createMockServicesPageState({
      catalog: { serviceTypes: [] },
    });
    renderWithProviders(<ServicesPageContent state={none as never} />);
    expect(screen.getByTestId("no-types-banner")).toBeInTheDocument();
  });

  it("shows form, lightbox, view, clear-media, and delete shells", async () => {
    const user = userEvent.setup();
    const open = createMockServicesPageState({
      isModalOpen: true,
      pendingDelete: createMockServicesPageState().catalog.services[0],
      viewService: createMockServicesPageState().catalog.services[0],
      pendingClearMedia: true,
      form: { isPreviewLightboxOpen: true },
    });
    renderWithProviders(<ServicesPageContent state={open as never} />);
    expect(screen.getByTestId("form-modal")).toBeInTheDocument();
    expect(screen.getByTestId("lightbox")).toBeInTheDocument();
    expect(screen.getByTestId("view-overlay")).toBeInTheDocument();
    expect(screen.getByTestId("clear-media-modal")).toBeInTheDocument();
    expect(screen.getByTestId("confirm-delete-modal")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "stub-clear-media" }));
    expect(open.setPendingClearMedia).toHaveBeenCalledWith(true);
    await user.click(screen.getByRole("button", { name: "stub-confirm-clear" }));
    expect(open.onConfirmClearMedia).toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "CONFIRM" }));
    expect(open.onConfirmDelete).toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "CLOSE" }));
    expect(open.closeDeleteModal).toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "stub-close-lightbox" }));
    expect(open.form.setIsPreviewLightboxOpen).toHaveBeenCalledWith(false);
    await user.click(screen.getByRole("button", { name: "stub-close-view" }));
    expect(open.setViewService).toHaveBeenCalledWith(null);
    await user.click(screen.getByRole("button", { name: "stub-close-clear" }));
    expect(open.closeClearMediaModal).toHaveBeenCalled();
  });

  it("opens delete confirm or blocked modal", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ServicesPageContent state={state as never} />);
    await user.click(screen.getByRole("button", { name: "stub-delete" }));
    expect(state.openDeleteConfirm).toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "stub-toggle" }));
    expect(state.onToggleActive).toHaveBeenCalled();
  });

  it("blocks delete and deactivate", async () => {
    const user = userEvent.setup();
    state.canDeleteService = vi.fn(() => false);
    renderWithProviders(<ServicesPageContent state={state as never} />);
    await user.click(screen.getByRole("button", { name: "stub-delete" }));
    expect(screen.getByTestId("blocked")).toHaveTextContent("Cannot delete");
    await user.click(screen.getByRole("button", { name: "stub-blocked-deact" }));
    expect(screen.getByTestId("blocked")).toHaveTextContent("Cannot deactivate");
  });
});
