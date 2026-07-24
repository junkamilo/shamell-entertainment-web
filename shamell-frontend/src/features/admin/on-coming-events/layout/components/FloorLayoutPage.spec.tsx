/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../../test/utils/renderWithProviders";

vi.mock("next/dynamic", () => ({
  default: () => {
    const MockContent = () => <div data-testid="floor-layout-page-content" />;
    return MockContent;
  },
}));

import FloorLayoutPage from "./FloorLayoutPage";

describe("FloorLayoutPage", () => {
  it("renders FloorLayoutPageContent", () => {
    renderWithProviders(<FloorLayoutPage />);
    expect(screen.getByTestId("floor-layout-page-content")).toBeInTheDocument();
  });
});
