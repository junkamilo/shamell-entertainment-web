/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../test/utils/renderWithProviders";

vi.mock("./PeticionesPageContent", () => ({
  default: () => <div data-testid="peticiones-page-content" />,
}));

import PeticionesPage from "./PeticionesPage";

describe("PeticionesPage", () => {
  it("renders the page content shell", () => {
    renderWithProviders(<PeticionesPage />);
    expect(screen.getByTestId("peticiones-page-content")).toBeInTheDocument();
  });
});
