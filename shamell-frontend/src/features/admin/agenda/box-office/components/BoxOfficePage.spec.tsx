/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../test/utils/renderWithProviders";

vi.mock("./BoxOfficePageContent", () => ({
  default: () => <div data-testid="box-office-page-content" />,
}));

import BoxOfficePage from "./BoxOfficePage";

describe("BoxOfficePage", () => {
  it("renders BoxOfficePageContent", () => {
    renderWithProviders(<BoxOfficePage />);
    expect(screen.getByTestId("box-office-page-content")).toBeInTheDocument();
  });
});
