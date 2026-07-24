/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { makeGalleryCategory } from "../test/fixtures/galleryCategories.fixture";
import { FIXTURE_CATEGORY_ID } from "../test/fixtures/uuids.fixture";
import { renderWithProviders } from "../test/utils/renderWithProviders";

vi.mock("@/components/admin/overlays", () => ({
  Modal: ({
    isOpen,
    title,
    children,
    onClose,
  }: {
    isOpen: boolean;
    title: string;
    children: React.ReactNode;
    onClose: () => void;
  }) =>
    isOpen ? (
      <div role="dialog" aria-label={title}>
        {children}
        <button type="button" onClick={onClose}>
          x
        </button>
      </div>
    ) : null,
}));

import GalleryCategoriesFormModal from "./GalleryCategoriesFormModal";

function renderModal(
  overrides: Partial<React.ComponentProps<typeof GalleryCategoriesFormModal>> = {},
) {
  const props: React.ComponentProps<typeof GalleryCategoriesFormModal> = {
    isOpen: true,
    editingCategoryId: null,
    categoryName: "",
    onCategoryNameChange: vi.fn(),
    categories: [makeGalleryCategory()],
    isSubmitting: false,
    onClose: vi.fn(),
    onSubmit: vi.fn((e) => e.preventDefault()),
    ...overrides,
  };
  return {
    ...renderWithProviders(<GalleryCategoriesFormModal {...props} />),
    props,
  };
}

describe("GalleryCategoriesFormModal", () => {
  it("renders New category title when creating", () => {
    renderModal();
    expect(screen.getByRole("dialog", { name: "New category" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Create category" })).toBeInTheDocument();
  });

  it("renders Edit category title and published slug when editing", () => {
    renderModal({
      editingCategoryId: FIXTURE_CATEGORY_ID,
      categoryName: "Weddings",
    });
    expect(screen.getByRole("dialog", { name: "Edit category" })).toBeInTheDocument();
    expect(screen.getByText("/weddings")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save changes" })).toBeInTheDocument();
  });

  it("shows slug preview while creating", () => {
    renderModal({ categoryName: "Live Performance" });
    expect(screen.getByText("live-performance")).toBeInTheDocument();
  });

  it("calls onClose from Cancel", async () => {
    const user = userEvent.setup();
    const { props } = renderModal();
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(props.onClose).toHaveBeenCalled();
  });

  it("notifies onCategoryNameChange when typing", async () => {
    const user = userEvent.setup();
    const { props } = renderModal();
    await user.type(screen.getByPlaceholderText("e.g. Live performance"), "A");
    expect(props.onCategoryNameChange).toHaveBeenCalled();
  });

  it("disables submit when name is empty", () => {
    renderModal({ categoryName: "   " });
    expect(screen.getByRole("button", { name: "Create category" })).toBeDisabled();
  });

  it("shows Saving... while submitting", () => {
    renderModal({ categoryName: "Weddings", isSubmitting: true });
    expect(screen.getByRole("button", { name: "Saving..." })).toBeDisabled();
  });

  it("does not render when closed", () => {
    renderModal({ isOpen: false });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
