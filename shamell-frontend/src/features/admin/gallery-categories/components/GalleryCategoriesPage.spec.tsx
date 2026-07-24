/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { createMockGalleryCategoriesPageState } from "../test/helpers/mockGalleryCategoriesPage";
import { renderWithProviders } from "../test/utils/renderWithProviders";

vi.mock("../hooks/useGalleryCategoriesPage", () => ({
  useGalleryCategoriesPage: () => createMockGalleryCategoriesPageState(),
}));

vi.mock("./GalleryCategoriesPageContent", () => ({
  default: () => <div data-testid="gallery-categories-page-content" />,
}));

import GalleryCategoriesPage from "./GalleryCategoriesPage";

describe("GalleryCategoriesPage", () => {
  it("renders GalleryCategoriesPageContent", () => {
    renderWithProviders(<GalleryCategoriesPage />);
    expect(
      screen.getByTestId("gallery-categories-page-content"),
    ).toBeInTheDocument();
  });

  it("loads page state via useGalleryCategoriesPage", () => {
    renderWithProviders(<GalleryCategoriesPage />);
    expect(
      screen.getByTestId("gallery-categories-page-content"),
    ).toBeVisible();
  });
});
