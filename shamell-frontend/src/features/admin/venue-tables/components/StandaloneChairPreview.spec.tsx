/** @vitest-environment jsdom */

import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { STANDALONE_CHAIR_DISPLAY_LABEL } from "../types/standaloneChairs.types";
import { renderWithProviders } from "../test/utils/renderWithProviders";
import StandaloneChairPreview from "./StandaloneChairPreview";

describe("StandaloneChairPreview", () => {
  it("renders chair label and singular quantity badge", () => {
    renderWithProviders(<StandaloneChairPreview addQuantity={1} />);

    expect(screen.getByText(STANDALONE_CHAIR_DISPLAY_LABEL)).toBeInTheDocument();
    expect(
      screen.getByText("Standalone seat — not tied to a table combo."),
    ).toBeInTheDocument();
    expect(screen.getByText("1 chair to add")).toBeInTheDocument();
  });

  it("uses plural quantity badge for multiple chairs", () => {
    renderWithProviders(<StandaloneChairPreview addQuantity={4} />);

    expect(screen.getByText("4 chairs to add")).toBeInTheDocument();
  });
});
