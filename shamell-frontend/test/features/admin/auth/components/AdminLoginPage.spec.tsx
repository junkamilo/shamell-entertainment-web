/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@test/features/admin/auth/support/helpers/renderWithProviders";

vi.mock("@/features/admin/auth/components/AdminLoginForm", () => ({
  AdminLoginForm: () => <div data-testid="admin-login-form" />,
}));

import { AdminLoginPage } from "@/features/admin/auth/components/AdminLoginPage";

describe("AdminLoginPage", () => {
  it("renders AdminLoginForm", () => {
    renderWithProviders(<AdminLoginPage />);
    expect(screen.getByTestId("admin-login-form")).toBeInTheDocument();
  });
});
