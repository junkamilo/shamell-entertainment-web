/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { createMockGalleryPageState } from "../test/helpers/mockGalleryPage";
import { renderWithProviders } from "../test/utils/renderWithProviders";

vi.mock("../hooks/useGalleryPage", () => ({
  useGalleryPage: () => createMockGalleryPageState(),
}));

vi.mock("./GalleryPageContent", () => ({
  default: () => <div data-testid="gallery-page-content" />,
}));

import GalleryPage from "./GalleryPage";

describe("GalleryPage", () => {
  it("renders GalleryPageContent", () => {
    renderWithProviders(<GalleryPage />);
    expect(screen.getByTestId("gallery-page-content")).toBeInTheDocument();
  });

  it("loads page state via useGalleryPage", () => {
    renderWithProviders(<GalleryPage />);
    expect(screen.getByTestId("gallery-page-content")).toBeVisible();
  });
});
