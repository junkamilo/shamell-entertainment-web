/** @vitest-environment jsdom */

import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../test/utils/renderWithProviders";

vi.mock("./AgregarAdminPageContent", () => ({
  default: () => (
    <div data-testid="agregar-admin-page-content">Page content</div>
  ),
}));

import AgregarAdminPage from "./AgregarAdminPage";

describe("AgregarAdminPage", () => {
  it("renders page content", () => {
    renderWithProviders(<AgregarAdminPage />);
    expect(screen.getByTestId("agregar-admin-page-content")).toBeInTheDocument();
  });
});
