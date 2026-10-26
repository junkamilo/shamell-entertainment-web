/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { createMockOccasionTypesPageState } from "@test/features/admin/occasion-types/support/helpers/mockOccasionTypesPage";
import { renderWithProviders } from "@test/features/admin/occasion-types/support/helpers/renderWithProviders";

vi.mock("@/features/admin/occasion-types/hooks/useOccasionTypesPage", () => ({
  useOccasionTypesPage: () => createMockOccasionTypesPageState(),
}));

vi.mock("@/features/admin/occasion-types/components/OccasionTypesPageContent", () => ({
  default: () => <div data-testid="occasion-types-page-content" />,
}));

import OccasionTypesPage from "@/features/admin/occasion-types/components/OccasionTypesPage";

describe("OccasionTypesPage", () => {
  it("renders OccasionTypesPageContent", () => {
    renderWithProviders(<OccasionTypesPage />);
    expect(
      screen.getByTestId("occasion-types-page-content"),
    ).toBeInTheDocument();
  });
});
