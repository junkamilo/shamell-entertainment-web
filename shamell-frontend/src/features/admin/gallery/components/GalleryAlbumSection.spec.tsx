/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  makeGalleryCategory,
  makeGalleryPhoto,
} from "../test/fixtures/gallery.fixture";
import { renderWithProviders } from "../test/utils/renderWithProviders";

vi.mock("./GalleryPhotoCard", () => ({
  default: ({ photo }: { photo: { id: string } }) => (
    <div data-testid={`photo-card-${photo.id}`} />
  ),
}));

import GalleryAlbumSection from "./GalleryAlbumSection";

function renderAlbum(
  overrides: Partial<React.ComponentProps<typeof GalleryAlbumSection>> = {},
) {
  const props: React.ComponentProps<typeof GalleryAlbumSection> = {
    category: makeGalleryCategory(),
    photos: [makeGalleryPhoto()],
    isExpanded: true,
    onToggleExpand: vi.fn(),
    onUploadHere: vi.fn(),
    onEditPhoto: vi.fn(),
    onDeletePhoto: vi.fn(),
    onTogglePhoto: vi.fn(),
    ...overrides,
  };
  return { ...renderWithProviders(<GalleryAlbumSection {...props} />), props };
}

describe("GalleryAlbumSection", () => {
  it("renders album name and file count", () => {
    renderAlbum();
    expect(screen.getByRole("heading", { name: "Weddings" })).toBeInTheDocument();
    expect(screen.getByText("1 file")).toBeInTheDocument();
  });

  it("calls onUploadHere", async () => {
    const user = userEvent.setup();
    const { props } = renderAlbum();
    await user.click(screen.getByRole("button", { name: /Upload here/i }));
    expect(props.onUploadHere).toHaveBeenCalled();
  });

  it("toggles expand", async () => {
    const user = userEvent.setup();
    const { props } = renderAlbum();
    await user.click(
      screen.getByRole("button", { name: /Hide album preview Weddings/i }),
    );
    expect(props.onToggleExpand).toHaveBeenCalled();
  });

  it("shows photo cards when expanded with photos", () => {
    const photo = makeGalleryPhoto();
    renderAlbum({ photos: [photo], isExpanded: true });
    expect(screen.getByTestId(`photo-card-${photo.id}`)).toBeInTheDocument();
  });

  it("shows empty state when expanded with no photos", () => {
    renderAlbum({ photos: [], isExpanded: true });
    expect(screen.getByText("No media in this album yet.")).toBeInTheDocument();
  });

  it("hides body when collapsed", () => {
    renderAlbum({ isExpanded: false });
    expect(screen.queryByText("No media in this album yet.")).not.toBeInTheDocument();
    expect(screen.queryByTestId(/photo-card-/)).not.toBeInTheDocument();
  });
});
