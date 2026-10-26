/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { createMockServicesPageState } from "@test/features/admin/services/support/helpers/mockServicesPage";
import { renderWithProviders } from "@test/features/admin/services/support/helpers/renderWithProviders";

vi.mock("@/features/admin/services/hooks/useServicesPage", () => ({
  useServicesPage: () => createMockServicesPageState(),
}));

vi.mock("@/features/admin/services/components/ServicesPageContent", () => ({
  default: () => <div data-testid="services-page-content" />,
}));

import ServicesPage from "@/features/admin/services/components/ServicesPage";

describe("ServicesPage", () => {
  it("renders ServicesPageContent", () => {
    renderWithProviders(<ServicesPage />);
    expect(screen.getByTestId("services-page-content")).toBeInTheDocument();
  });
});
