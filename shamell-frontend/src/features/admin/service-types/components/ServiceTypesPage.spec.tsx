/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { createMockServiceTypesPageState } from "../test/helpers/mockServiceTypesPage";
import { renderWithProviders } from "../test/utils/renderWithProviders";

vi.mock("../hooks/useServiceTypesPage", () => ({
  useServiceTypesPage: () => createMockServiceTypesPageState(),
}));

vi.mock("./ServiceTypesPageContent", () => ({
  default: () => <div data-testid="service-types-page-content" />,
}));

import ServiceTypesPage from "./ServiceTypesPage";

describe("ServiceTypesPage", () => {
  it("renders ServiceTypesPageContent", () => {
    renderWithProviders(<ServiceTypesPage />);
    expect(
      screen.getByTestId("service-types-page-content"),
    ).toBeInTheDocument();
  });
});
