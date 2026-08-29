/** @vitest-environment jsdom */

import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMockGalleryCategoriesPageState } from "../test/helpers/mockGalleryCategoriesPage";
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
      <button type="button" onClick={onAction} data-testid="stub-new-category">
        {actionLabel ?? "New category"}
      </button>
    </div>
  ),
}));

vi.mock("./GalleryCategoriesGoToGalleryLink", () => ({
  default: () => <div data-testid="go-to-gallery" />,
}));

vi.mock("./GalleryCategoriesStatsBar", () => ({
  default: () => <div data-testid="stats-bar" />,
}));

vi.mock("./GalleryCategoriesToolbar", () => ({
  default: () => <div data-testid="toolbar" />,
}));

vi.mock("./GalleryCategoriesLibrarySection", () => ({
  default: () => <div data-testid="library-section" />,
}));

vi.mock("./GalleryCategoriesFormModal", () => ({
  default: ({
    isOpen,
    onSubmit,
    onClose,
  }: {
    isOpen: boolean;
    onSubmit: (event: { preventDefault: () => void }) => void;
    onClose: () => void;
  }) =>
    isOpen ? (
      <div data-testid="form-modal">
        <button
          type="button"
          onClick={() => onSubmit({ preventDefault: () => undefined })}
        >
          stub-submit
        </button>
        <button type="button" onClick={onClose}>
          stub-close
        </button>
      </div>
    ) : null,
}));

import GalleryCategoriesPageContent from "./GalleryCategoriesPageContent";

describe("GalleryCategoriesPageContent", () => {
  let state = createMockGalleryCategoriesPageState();

  beforeEach(() => {
    state = createMockGalleryCategoriesPageState();
  });

  it("renders the Gallery categories hero and shells", () => {
    renderWithProviders(<GalleryCategoriesPageContent state={state as never} />);

    expect(
      screen.getByRole("heading", { name: "Gallery categories" }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("go-to-gallery")).toBeInTheDocument();
    expect(screen.getByTestId("stats-bar")).toBeInTheDocument();
    expect(screen.getByTestId("toolbar")).toBeInTheDocument();
    expect(screen.getByTestId("library-section")).toBeInTheDocument();
  });

  it("opens create via hero action", async () => {
    const user = userEvent.setup();
    renderWithProviders(<GalleryCategoriesPageContent state={state as never} />);

    await user.click(screen.getByTestId("stub-new-category"));
    expect(state.form.openCategoryCreate).toHaveBeenCalled();
  });

  it("shows form modal when open", async () => {
    const user = userEvent.setup();
    state = createMockGalleryCategoriesPageState({
      form: { isCategoryModalOpen: true },
    });
    renderWithProviders(<GalleryCategoriesPageContent state={state as never} />);
    expect(screen.getByTestId("form-modal")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "stub-submit" }));
    expect(state.onSubmitCategory).toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "stub-close" }));
    expect(state.form.closeCategoryModal).toHaveBeenCalled();
  });
});
