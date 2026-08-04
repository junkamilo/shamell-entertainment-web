/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../test/utils/renderWithProviders";
import { makeGalleryTabItem } from "../test/fixtures/gallery.fixture";
import {
  FIXTURE_CATEGORY_SLUG,
  FIXTURE_CATEGORY_SLUG_2,
} from "../test/fixtures/uuids.fixture";

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

import { GalleryFilterTabs } from "./GalleryFilterTabs";

describe("GalleryFilterTabs", () => {
  it("renders category links with filter hrefs", () => {
    renderWithProviders(
      <GalleryFilterTabs
        categories={[
          { id: "all", label: "All" },
          makeGalleryTabItem(),
          makeGalleryTabItem({ id: FIXTURE_CATEGORY_SLUG_2, label: "Shows" }),
        ]}
        currentFilter={FIXTURE_CATEGORY_SLUG}
      />,
    );

    expect(screen.getByRole("link", { name: "ALL" })).toHaveAttribute(
      "href",
      "/gallery",
    );
    expect(screen.getByRole("link", { name: "WEDDINGS" })).toHaveAttribute(
      "href",
      `/gallery?filter=${FIXTURE_CATEGORY_SLUG}`,
    );
    expect(screen.getByRole("link", { name: "SHOWS" })).toBeInTheDocument();
  });
});
