/** @vitest-environment jsdom */

import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../test/utils/renderWithProviders";
import { GalleryPageFallback } from "./GalleryPageFallback";

describe("GalleryPageFallback", () => {
  it("shows loading copy", () => {
    renderWithProviders(<GalleryPageFallback />);
    expect(screen.getByText("Loading gallery...")).toBeInTheDocument();
  });
});
