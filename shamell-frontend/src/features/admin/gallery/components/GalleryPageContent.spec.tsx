/** @vitest-environment jsdom */

import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMockGalleryPageState } from "../test/helpers/mockGalleryPage";
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
      <button type="button" onClick={onAction} data-testid="stub-upload">
        {actionLabel ?? "Upload"}
      </button>
    </div>
  ),
}));

vi.mock("./GalleryManageCategoriesLink", () => ({
  default: () => <div data-testid="manage-categories" />,
}));

vi.mock("./GalleryNoCategoriesBanner", () => ({
  default: () => <div data-testid="no-categories-banner" />,
}));

vi.mock("./GalleryStatsBar", () => ({
  default: () => <div data-testid="stats-bar" />,
}));

vi.mock("./GalleryToolbar", () => ({
  default: () => <div data-testid="toolbar" />,
}));

vi.mock("./GalleryLibrarySection", () => ({
  default: ({ isLoading }: { isLoading: boolean }) => (
    <div data-testid="library-section">{isLoading ? "Loading..." : "ready"}</div>
  ),
}));

vi.mock("./GalleryPhotoModal", () => ({
  default: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div data-testid="photo-modal" /> : null,
}));

import GalleryPageContent from "./GalleryPageContent";

describe("GalleryPageContent", () => {
  let state = createMockGalleryPageState();

  beforeEach(() => {
    state = createMockGalleryPageState();
  });

  it("renders the Gallery hero and library shells", () => {
    renderWithProviders(<GalleryPageContent state={state as never} />);

    expect(screen.getByRole("heading", { name: "Gallery" })).toBeInTheDocument();
    expect(screen.getByTestId("manage-categories")).toBeInTheDocument();
    expect(screen.getByTestId("stats-bar")).toBeInTheDocument();
    expect(screen.getByTestId("toolbar")).toBeInTheDocument();
    expect(screen.getByTestId("library-section")).toHaveTextContent("ready");
  });

  it("shows no-categories banner when there are no active categories", () => {
    state = createMockGalleryPageState({
      library: { activeCategories: [] },
    });
    renderWithProviders(<GalleryPageContent state={state as never} />);
    expect(screen.getByTestId("no-categories-banner")).toBeInTheDocument();
  });

  it("hides no-categories banner when active categories exist", () => {
    renderWithProviders(<GalleryPageContent state={state as never} />);
    expect(screen.queryByTestId("no-categories-banner")).not.toBeInTheDocument();
  });

  it("opens upload via hero action", async () => {
    const user = userEvent.setup();
    renderWithProviders(<GalleryPageContent state={state as never} />);

    await user.click(screen.getByTestId("stub-upload"));
    expect(state.openPhotoModalForCreate).toHaveBeenCalled();
  });

  it("shows photo modal when open", () => {
    state = createMockGalleryPageState({ isPhotoModalOpen: true });
    renderWithProviders(<GalleryPageContent state={state as never} />);
    expect(screen.getByTestId("photo-modal")).toBeInTheDocument();
  });
});
