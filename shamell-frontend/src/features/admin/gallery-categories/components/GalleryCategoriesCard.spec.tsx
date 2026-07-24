/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { makeGalleryCategory } from "../test/fixtures/galleryCategories.fixture";
import { renderWithProviders } from "../test/utils/renderWithProviders";
import GalleryCategoriesCard from "./GalleryCategoriesCard";

function renderCard(
  overrides: Partial<React.ComponentProps<typeof GalleryCategoriesCard>> = {},
) {
  const props: React.ComponentProps<typeof GalleryCategoriesCard> = {
    category: makeGalleryCategory(),
    count: 2,
    previews: [
      "https://cdn.example.com/gallery/preview.jpg",
      "https://cdn.example.com/gallery/preview-2.jpg",
    ],
    isSpotlight: false,
    isExpanded: true,
    isToggling: false,
    onToggleExpand: vi.fn(),
    onEdit: vi.fn(),
    onToggleActive: vi.fn(),
    ...overrides,
  };
  return { ...renderWithProviders(<GalleryCategoriesCard {...props} />), props };
}

describe("GalleryCategoriesCard", () => {
  it("renders category name, status, and item count", () => {
    renderCard();
    expect(screen.getByRole("heading", { name: "Weddings" })).toBeInTheDocument();
    expect(screen.getByText("ACTIVE")).toBeInTheDocument();
    expect(screen.getByText("2 items")).toBeInTheDocument();
  });

  it("shows INACTIVE when category is inactive", () => {
    renderCard({ category: makeGalleryCategory({ isActive: false }) });
    expect(screen.getByText("INACTIVE")).toBeInTheDocument();
  });

  it("shows previews when expanded", () => {
    renderCard({ isExpanded: true });
    expect(screen.getByText("PREVIEW")).toBeInTheDocument();
    expect(document.querySelectorAll("img")).toHaveLength(2);
  });

  it("shows empty preview state when expanded without media", () => {
    renderCard({ isExpanded: true, previews: [], count: 0 });
    expect(screen.getByText("No preview yet")).toBeInTheDocument();
    expect(screen.getByText("0 items")).toBeInTheDocument();
  });

  it("hides preview body when collapsed", () => {
    renderCard({ isExpanded: false });
    expect(screen.queryByText("PREVIEW")).not.toBeInTheDocument();
  });

  it("calls onToggleExpand, onEdit, and onToggleActive", async () => {
    const user = userEvent.setup();
    const { props } = renderCard();

    await user.click(
      screen.getByRole("button", { name: /Hide preview for Weddings/i }),
    );
    await user.click(screen.getByRole("button", { name: "Edit Weddings" }));
    await user.click(screen.getByRole("button", { name: "Hide Weddings" }));

    expect(props.onToggleExpand).toHaveBeenCalled();
    expect(props.onEdit).toHaveBeenCalled();
    expect(props.onToggleActive).toHaveBeenCalled();
  });
});
