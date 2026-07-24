/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { createMockGalleryCategoriesPageState } from "../test/helpers/mockGalleryCategoriesPage";
import { FIXTURE_CATEGORY_ID } from "../test/fixtures/uuids.fixture";
import { renderWithProviders } from "../test/utils/renderWithProviders";

vi.mock("./GalleryCategoriesCard", () => ({
  default: ({ category }: { category: { name: string } }) => (
    <div data-testid={`card-${category.name}`} />
  ),
}));

import GalleryCategoriesLibrarySection from "./GalleryCategoriesLibrarySection";

describe("GalleryCategoriesLibrarySection", () => {
  it("renders category cards", () => {
    const state = createMockGalleryCategoriesPageState();
    renderWithProviders(<GalleryCategoriesLibrarySection state={state as never} />);

    expect(screen.getByTestId("card-Weddings")).toBeInTheDocument();
    expect(screen.getByTestId("card-Corporate")).toBeInTheDocument();
  });

  it("shows Loading when catalog is loading", () => {
    const state = createMockGalleryCategoriesPageState({
      catalog: { isLoading: true },
      list: { filteredCategories: [] },
    });
    renderWithProviders(<GalleryCategoriesLibrarySection state={state as never} />);
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("shows empty catalog message", () => {
    const state = createMockGalleryCategoriesPageState({
      catalog: { categories: [], isLoading: false },
      list: { filteredCategories: [] },
    });
    renderWithProviders(<GalleryCategoriesLibrarySection state={state as never} />);
    expect(screen.getByText("No categories yet.")).toBeInTheDocument();
  });

  it("shows no-match message when filter empties results", () => {
    const state = createMockGalleryCategoriesPageState({
      list: { filteredCategories: [] },
    });
    renderWithProviders(<GalleryCategoriesLibrarySection state={state as never} />);
    expect(
      screen.getByText("Nothing matches your search or filter."),
    ).toBeInTheDocument();
  });

  it("passes spotlight category into the card grid", () => {
    const state = createMockGalleryCategoriesPageState({
      list: {
        filteredCategories: [
          createMockGalleryCategoriesPageState().catalog.categories[0]!,
        ],
        spotlightCategoryId: FIXTURE_CATEGORY_ID,
      },
    });
    renderWithProviders(<GalleryCategoriesLibrarySection state={state as never} />);
    expect(screen.getByTestId("card-Weddings")).toBeInTheDocument();
  });
});
