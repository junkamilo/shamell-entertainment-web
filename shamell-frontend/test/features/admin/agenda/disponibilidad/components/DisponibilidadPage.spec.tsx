/** @vitest-environment jsdom */

import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@test/features/admin/agenda/disponibilidad/support/helpers/renderWithProviders";

vi.mock("@/features/admin/agenda/disponibilidad/components/DisponibilidadPageContent", () => ({
  default: () => <div data-testid="disponibilidad-page-content" />,
}));

import DisponibilidadPage from "@/features/admin/agenda/disponibilidad/components/DisponibilidadPage";

describe("DisponibilidadPage", () => {
  it("renders DisponibilidadPageContent", () => {
    renderWithProviders(<DisponibilidadPage />);
    expect(screen.getByTestId("disponibilidad-page-content")).toBeInTheDocument();
  });
});
