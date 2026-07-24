/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { makeHeaderPhoto } from "../test/fixtures/headerMedia.fixture";
import { renderWithProviders } from "../test/utils/renderWithProviders";

vi.mock("@/components/admin/data-display", () => ({
  Pagination: () => <div data-testid="pagination" />,
}));

vi.mock("./HeaderMediaLibraryCard", () => ({
  default: ({ photo }: { photo: { id: string } }) => (
    <div data-testid={`card-${photo.id}`} />
  ),
}));

import HeaderMediaLibrarySection from "./HeaderMediaLibrarySection";

function renderLibrary(
  overrides: Partial<React.ComponentProps<typeof HeaderMediaLibrarySection>> = {},
) {
  const photos = [makeHeaderPhoto()];
  const props: React.ComponentProps<typeof HeaderMediaLibrarySection> = {
    isLoading: false,
    photos,
    pagedPhotos: photos,
    paginationMeta: {
      page: 1,
      perPage: 10,
      totalItems: 1,
      totalPages: 1,
      hasPrev: false,
      hasNext: false,
    },
    onPageChange: vi.fn(),
    onPerPageChange: vi.fn(),
    onView: vi.fn(),
    onFocus: vi.fn(),
    onToggle: vi.fn(),
    onDelete: vi.fn(),
    ...overrides,
  };
  return renderWithProviders(<HeaderMediaLibrarySection {...props} />);
}

describe("HeaderMediaLibrarySection", () => {
  it("renders Library heading and cards", () => {
    renderLibrary();
    expect(screen.getByRole("heading", { name: "Library" })).toBeInTheDocument();
    expect(screen.getByText("1 item")).toBeInTheDocument();
    expect(screen.getByTestId(`card-${makeHeaderPhoto().id}`)).toBeInTheDocument();
    expect(screen.getByTestId("pagination")).toBeInTheDocument();
  });

  it("shows empty state", () => {
    renderLibrary({ photos: [], pagedPhotos: [] });
    expect(
      screen.getByText("No media in the main header yet."),
    ).toBeInTheDocument();
  });

  it("shows loading spinner when loading with no photos", () => {
    const { container } = renderLibrary({
      isLoading: true,
      photos: [],
      pagedPhotos: [],
    });
    expect(container.querySelector(".animate-spin")).toBeTruthy();
  });
});
