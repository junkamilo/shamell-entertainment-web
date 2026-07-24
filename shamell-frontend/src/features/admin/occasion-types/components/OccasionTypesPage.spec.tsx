/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { createMockOccasionTypesPageState } from "../test/helpers/mockOccasionTypesPage";
import { renderWithProviders } from "../test/utils/renderWithProviders";

vi.mock("../hooks/useOccasionTypesPage", () => ({
  useOccasionTypesPage: () => createMockOccasionTypesPageState(),
}));

vi.mock("./OccasionTypesPageContent", () => ({
  default: () => <div data-testid="occasion-types-page-content" />,
}));

import OccasionTypesPage from "./OccasionTypesPage";

describe("OccasionTypesPage", () => {
  it("renders OccasionTypesPageContent", () => {
    renderWithProviders(<OccasionTypesPage />);
    expect(
      screen.getByTestId("occasion-types-page-content"),
    ).toBeInTheDocument();
  });
});
