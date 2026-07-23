/** @vitest-environment jsdom */

import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../test/utils/renderWithProviders";

vi.mock("./DisponibilidadPageContent", () => ({
  default: () => <div data-testid="disponibilidad-page-content" />,
}));

import DisponibilidadPage from "./DisponibilidadPage";

describe("DisponibilidadPage", () => {
  it("renders DisponibilidadPageContent", () => {
    renderWithProviders(<DisponibilidadPage />);
    expect(screen.getByTestId("disponibilidad-page-content")).toBeInTheDocument();
  });
});
