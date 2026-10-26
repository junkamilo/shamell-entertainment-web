/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@test/features/admin/agenda/peticiones/support/helpers/renderWithProviders";

vi.mock("@/features/admin/agenda/peticiones/components/PeticionesPageContent", () => ({
  default: () => <div data-testid="peticiones-page-content" />,
}));

import PeticionesPage from "@/features/admin/agenda/peticiones/components/PeticionesPage";

describe("PeticionesPage", () => {
  it("renders the page content shell", () => {
    renderWithProviders(<PeticionesPage />);
    expect(screen.getByTestId("peticiones-page-content")).toBeInTheDocument();
  });
});
