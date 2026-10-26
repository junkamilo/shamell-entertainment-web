/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { createMockServiceTypesPageState } from "@test/features/admin/service-types/support/helpers/mockServiceTypesPage";
import { renderWithProviders } from "@test/features/admin/service-types/support/helpers/renderWithProviders";

vi.mock("@/features/admin/service-types/hooks/useServiceTypesPage", () => ({
  useServiceTypesPage: () => createMockServiceTypesPageState(),
}));

vi.mock("@/features/admin/service-types/components/ServiceTypesPageContent", () => ({
  default: () => <div data-testid="service-types-page-content" />,
}));

import ServiceTypesPage from "@/features/admin/service-types/components/ServiceTypesPage";

describe("ServiceTypesPage", () => {
  it("renders ServiceTypesPageContent", () => {
    renderWithProviders(<ServiceTypesPage />);
    expect(
      screen.getByTestId("service-types-page-content"),
    ).toBeInTheDocument();
  });
});
