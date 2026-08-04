/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../test/utils/renderWithProviders";

vi.mock("next/image", () => ({
  default: ({ alt = "" }: { alt?: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={alt} />
  ),
}));

import { OnComingEventsHubHero } from "./OnComingEventsHubHero";

describe("OnComingEventsHubHero", () => {
  it("renders hub title and back navigation", () => {
    renderWithProviders(<OnComingEventsHubHero />);
    expect(
      screen.getByRole("heading", { name: "ON COMING EVENTS" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /back/i })).toHaveAttribute(
      "href",
      "/",
    );
  });
});
