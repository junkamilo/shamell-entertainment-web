/** @vitest-environment jsdom */

import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { DEFAULT_HEADER_TEXT } from "@/lib/headerTextTypes";
import { renderWithProviders } from "../test/utils/renderWithProviders";
import HeaderTextPreview from "./HeaderTextPreview";

describe("HeaderTextPreview", () => {
  it("renders headline tagline and quote", () => {
    renderWithProviders(<HeaderTextPreview content={DEFAULT_HEADER_TEXT} />);
    expect(screen.getByRole("heading", { name: "SHAMELL" })).toBeInTheDocument();
    expect(
      screen.getByText("Exclusive Belly Dance Performance Artistry"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Dance is the hidden language of the soul/),
    ).toBeInTheDocument();
  });

  it("applies compact layout class path without crashing", () => {
    renderWithProviders(
      <HeaderTextPreview content={DEFAULT_HEADER_TEXT} compact />,
    );
    expect(screen.getByRole("heading", { name: "SHAMELL" })).toBeInTheDocument();
  });
});
