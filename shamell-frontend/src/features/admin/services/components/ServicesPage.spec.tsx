/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { createMockServicesPageState } from "../test/helpers/mockServicesPage";
import { renderWithProviders } from "../test/utils/renderWithProviders";

vi.mock("../hooks/useServicesPage", () => ({
  useServicesPage: () => createMockServicesPageState(),
}));

vi.mock("./ServicesPageContent", () => ({
  default: () => <div data-testid="services-page-content" />,
}));

import ServicesPage from "./ServicesPage";

describe("ServicesPage", () => {
  it("renders ServicesPageContent", () => {
    renderWithProviders(<ServicesPage />);
    expect(screen.getByTestId("services-page-content")).toBeInTheDocument();
  });
});
