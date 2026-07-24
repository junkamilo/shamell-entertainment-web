/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { makeGalleryCategory } from "../test/fixtures/gallery.fixture";
import {
  FIXTURE_CATEGORY_ID,
  FIXTURE_CATEGORY_ID_2,
} from "../test/fixtures/uuids.fixture";
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

vi.mock("@/components/admin/media", () => ({
  MediaPickControl: () => <div data-testid="media-pick" />,
}));

import GalleryPhotoModal from "./GalleryPhotoModal";

function renderModal(
  overrides: Partial<React.ComponentProps<typeof GalleryPhotoModal>> = {},
) {
  const props: React.ComponentProps<typeof GalleryPhotoModal> = {
    isOpen: true,
    isSubmitting: false,
    editingId: null,
    canSubmitPhoto: true,
    selectedCategoryId: FIXTURE_CATEGORY_ID,
    onSelectedCategoryIdChange: vi.fn(),
    imageFiles: [],
    onImageFilesChange: vi.fn(),
    sortedActiveCategories: [
      makeGalleryCategory(),
      makeGalleryCategory({
        id: FIXTURE_CATEGORY_ID_2,
        name: "Corporate",
        slug: "corporate",
      }),
    ],
    onClose: vi.fn(),
    onSubmit: vi.fn((e) => e.preventDefault()),
    ...overrides,
  };
  return { ...renderWithProviders(<GalleryPhotoModal {...props} />), props };
}

describe("GalleryPhotoModal", () => {
  it("renders upload title when creating", () => {
    renderModal();
    expect(
      screen.getByRole("dialog", { name: "Upload to a category" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Upload to this category" }),
    ).toBeInTheDocument();
  });

  it("renders edit title when editing", () => {
    renderModal({ editingId: "photo-1" });
    expect(screen.getByRole("dialog", { name: "Edit media" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save changes" })).toBeInTheDocument();
  });

  it("calls onClose from Cancel", async () => {
    const user = userEvent.setup();
    const { props } = renderModal();
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(props.onClose).toHaveBeenCalled();
  });

  it("selects a category", async () => {
    const user = userEvent.setup();
    const { props } = renderModal();
    await user.click(screen.getByRole("button", { name: "Corporate" }));
    expect(props.onSelectedCategoryIdChange).toHaveBeenCalledWith(
      FIXTURE_CATEGORY_ID_2,
    );
  });

  it("disables submit when canSubmitPhoto is false", () => {
    renderModal({ canSubmitPhoto: false });
    expect(
      screen.getByRole("button", { name: "Upload to this category" }),
    ).toBeDisabled();
  });

  it("shows Saving... while submitting", () => {
    renderModal({ isSubmitting: true });
    expect(screen.getByRole("button", { name: "Saving..." })).toBeDisabled();
  });

  it("lists selected file names when creating", () => {
    renderModal({
      imageFiles: [
        new File(["a"], "one.jpg", { type: "image/jpeg" }),
        new File(["b"], "two.jpg", { type: "image/jpeg" }),
      ],
    });
    expect(screen.getByText("one.jpg")).toBeInTheDocument();
    expect(screen.getByText("two.jpg")).toBeInTheDocument();
  });

  it("does not render when closed", () => {
    renderModal({ isOpen: false });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
