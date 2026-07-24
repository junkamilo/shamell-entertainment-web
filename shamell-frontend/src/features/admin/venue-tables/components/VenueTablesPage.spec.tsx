/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../test/utils/renderWithProviders";

vi.mock("next/dynamic", () => ({
  default: () => {
    const MockContent = () => <div data-testid="venue-tables-page-content" />;
    return MockContent;
  },
}));

import VenueTablesPage from "./VenueTablesPage";

describe("VenueTablesPage", () => {
  it("renders VenueTablesPageContent", () => {
    renderWithProviders(<VenueTablesPage />);
    expect(
      screen.getByTestId("venue-tables-page-content"),
    ).toBeInTheDocument();
  });
});
