/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { CatalogCardCarousel } from "./CatalogCardCarousel";

vi.mock("@/hooks/use-media-query", () => ({
  useMediaQuery: () => false,
}));

describe("CatalogCardCarousel", () => {
  it("exposes region aria-label and renders children", () => {
    render(
      <CatalogCardCarousel ariaLabel="Featured services">
        <div>Card A</div>
        <div>Card B</div>
        <div>Card C</div>
      </CatalogCardCarousel>,
    );
    expect(
      screen.getByRole("region", { name: "Featured services" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Card A")).toBeInTheDocument();
    expect(screen.getByText("Card B")).toBeInTheDocument();
    expect(screen.getByText("Card C")).toBeInTheDocument();
  });
});
