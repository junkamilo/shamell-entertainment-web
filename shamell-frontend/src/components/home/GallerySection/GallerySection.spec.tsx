/** @vitest-environment jsdom */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  makeGalleryPhotoItem,
  makeGalleryTabItem,
} from "@/features/gallery/test/fixtures/gallery.fixture";
import {
  FIXTURE_CATEGORY_SLUG,
  FIXTURE_CATEGORY_SLUG_2,
  FIXTURE_PHOTO_ID_2,
} from "@/features/gallery/test/fixtures/uuids.fixture";

const photosState = {
  photos: [
    makeGalleryPhotoItem(),
    makeGalleryPhotoItem({
      id: FIXTURE_PHOTO_ID_2,
      src: "https://cdn.example.com/gallery/show-1.mp4",
      alt: "Shows — gallery",
      categorySlug: FIXTURE_CATEGORY_SLUG_2,
      mediaType: "VIDEO" as const,
      posterUrl: "https://cdn.example.com/gallery/show-poster.jpg",
    }),
  ],
  isLoading: false,
};

vi.mock("next/image", () => ({
  default: ({
    alt,
    src,
  }: {
    alt?: string;
    src?: string;
  }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={alt ?? ""} src={typeof src === "string" ? src : ""} />
  ),
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock("@/components/shared", () => ({
  RevealOnView: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  RevealStaggerGrid: ({
    children,
  }: {
    children: React.ReactNode;
  }) => <div data-testid="stagger-grid">{children}</div>,
}));

vi.mock("@/hooks/use-in-view-load", () => ({
  useInViewLoad: () => ({ ref: vi.fn(), inView: true }),
}));

vi.mock("@/features/gallery", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/features/gallery")>();
  return {
    ...actual,
    useGalleryCategories: () => ({
      categories: [
        { id: "all", label: "All" },
        makeGalleryTabItem({ id: FIXTURE_CATEGORY_SLUG, label: "Weddings" }),
        makeGalleryTabItem({ id: FIXTURE_CATEGORY_SLUG_2, label: "Shows" }),
      ],
      isLoading: false,
    }),
    useGalleryPhotos: (filter: string) => {
      if (photosState.isLoading) {
        return { photos: [], isLoading: true };
      }
      const photos =
        filter === "all"
          ? photosState.photos
          : photosState.photos.filter((p) => p.categorySlug === filter);
      return { photos, isLoading: false };
    },
  };
});

import GallerySection from "./GallerySection";

describe("GallerySection", () => {
  beforeEach(() => {
    photosState.isLoading = false;
  });

  afterEach(() => {
    cleanup();
    photosState.isLoading = false;
    photosState.photos = [
      makeGalleryPhotoItem(),
      makeGalleryPhotoItem({
        id: FIXTURE_PHOTO_ID_2,
        src: "https://cdn.example.com/gallery/show-1.mp4",
        alt: "Shows — gallery",
        categorySlug: FIXTURE_CATEGORY_SLUG_2,
        mediaType: "VIDEO" as const,
        posterUrl: "https://cdn.example.com/gallery/show-poster.jpg",
      }),
    ];
    vi.restoreAllMocks();
  });

  it("renders PERFORMANCE GALLERY heading and filter tabs", () => {
    const { container } = render(<GallerySection />);

    expect(container.querySelector("#gallery")).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: "PERFORMANCE GALLERY" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("tablist", { name: "Gallery filters" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "ALL" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByRole("link", { name: "View more" })).toHaveAttribute(
      "href",
      "/gallery",
    );
  });

  it("shows loading copy while photos load", () => {
    photosState.isLoading = true;
    render(<GallerySection />);
    expect(screen.getByText("Loading gallery...")).toBeInTheDocument();
  });

  it("updates filter selection and View more href", async () => {
    const user = userEvent.setup();
    render(<GallerySection />);

    await user.click(screen.getByRole("tab", { name: "SHOWS" }));
    expect(screen.getByRole("tab", { name: "SHOWS" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByRole("link", { name: "View more" })).toHaveAttribute(
      "href",
      `/gallery?filter=${FIXTURE_CATEGORY_SLUG_2}`,
    );
  });

  it("shows video on hover for VIDEO tiles and hides on mouse leave", async () => {
    const user = userEvent.setup();
    render(<GallerySection />);

    const tile = screen.getByAltText("Shows — gallery").closest(".group");
    expect(tile).toBeTruthy();
    await user.hover(tile!);
    expect(
      await screen.findByLabelText("Shows — gallery"),
    ).toBeInTheDocument();
    await user.unhover(tile!);
    await waitFor(() => {
      expect(screen.queryByLabelText("Shows — gallery")).toBeNull();
    });
  });

  it("layouts brick rows for 1, 2, and 8 photos", () => {
    photosState.photos = Array.from({ length: 8 }, (_, i) =>
      makeGalleryPhotoItem({
        id: `photo-${i}`,
        src: `https://cdn.example.com/g/${i}.jpg`,
        alt: `Photo ${i}`,
        categorySlug: FIXTURE_CATEGORY_SLUG,
        mediaType: "IMAGE",
        posterUrl: null,
      }),
    );
    const { rerender } = render(<GallerySection />);
    expect(screen.getByTestId("stagger-grid").children.length).toBe(3);

    photosState.photos = [
      makeGalleryPhotoItem({ id: "one", alt: "Only one" }),
    ];
    rerender(<GallerySection />);
    expect(screen.getByAltText("Only one")).toBeInTheDocument();

    photosState.photos = [
      makeGalleryPhotoItem({ id: "a", alt: "A" }),
      makeGalleryPhotoItem({ id: "b", alt: "B" }),
    ];
    rerender(<GallerySection />);
    expect(screen.getByAltText("A")).toBeInTheDocument();
    expect(screen.getByAltText("B")).toBeInTheDocument();
  });

  it("renders video tile without poster image", async () => {
    photosState.photos = [
      makeGalleryPhotoItem({
        id: "vid-noposter",
        src: "https://cdn.example.com/gallery/noposter.mp4",
        alt: "No poster video",
        mediaType: "VIDEO",
        posterUrl: null,
      }),
    ];
    const user = userEvent.setup();
    render(<GallerySection />);
    expect(screen.queryByAltText("No poster video")).toBeNull();
    const group = document.querySelector(".shamell-gallery-card-bg");
    expect(group).toBeTruthy();
    await user.hover(group!);
    expect(await screen.findByLabelText("No poster video")).toBeInTheDocument();
  });
});
