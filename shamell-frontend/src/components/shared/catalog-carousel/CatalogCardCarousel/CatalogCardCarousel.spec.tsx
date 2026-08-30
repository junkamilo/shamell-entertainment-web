/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { CatalogCardCarousel } from "./CatalogCardCarousel";

const mountedState = vi.hoisted(() => ({ value: true }));

vi.mock("@/hooks/use-has-mounted", () => ({
  useHasMounted: () => mountedState.value,
}));

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

  it("uses mobile layout before mount (no desktop arrows)", () => {
    mountedState.value = false;
    render(
      <CatalogCardCarousel ariaLabel="Pre-mount">
        <div>Card A</div>
        <div>Card B</div>
        <div>Card C</div>
        <div>Card D</div>
      </CatalogCardCarousel>,
    );
    expect(screen.queryByRole("button", { name: "Previous cards" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Next cards" })).toBeNull();
  });
});
