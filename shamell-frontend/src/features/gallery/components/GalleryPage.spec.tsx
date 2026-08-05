/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../test/utils/renderWithProviders";

vi.mock("@/components/shared", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/components/shared")>();
  return {
    ...actual,
    SiteHeader: () => <header data-testid="site-header" />,
    Footer: () => <footer data-testid="site-footer" />,
  };
});

vi.mock("./GalleryPageContent", () => ({
  GalleryPageContent: () => <div data-testid="gallery-page-content" />,
}));

vi.mock("./GalleryPageFallback", () => ({
  GalleryPageFallback: () => <div data-testid="gallery-page-fallback" />,
}));

import { GalleryPage } from "./GalleryPage";

describe("GalleryPage", () => {
  it("renders header, content, and footer", () => {
    renderWithProviders(<GalleryPage />);
    expect(screen.getByTestId("site-header")).toBeInTheDocument();
    expect(screen.getByTestId("gallery-page-content")).toBeInTheDocument();
    expect(screen.getByTestId("site-footer")).toBeInTheDocument();
  });
});
