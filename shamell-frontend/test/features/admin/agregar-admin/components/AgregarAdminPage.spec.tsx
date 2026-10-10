/** @vitest-environment jsdom */

import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@test/features/admin/agregar-admin/support/helpers/renderWithProviders";

vi.mock("@/features/admin/agregar-admin/components/AgregarAdminPageContent", () => ({
  default: () => (
    <div data-testid="agregar-admin-page-content">Page content</div>
  ),
}));

import AgregarAdminPage from "@/features/admin/agregar-admin/components/AgregarAdminPage";

describe("AgregarAdminPage", () => {
  it("renders page content", () => {
    renderWithProviders(<AgregarAdminPage />);
    expect(screen.getByTestId("agregar-admin-page-content")).toBeInTheDocument();
  });
});
