/** @vitest-environment jsdom */

import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@test/features/gallery/support/helpers/renderWithProviders";
import { GalleryPageFallback } from "@/features/gallery/components/GalleryPageFallback";

describe("GalleryPageFallback", () => {
  it("shows loading copy", () => {
    renderWithProviders(<GalleryPageFallback />);
    expect(screen.getByText("Loading gallery...")).toBeInTheDocument();
  });
});
