/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../test/utils/renderWithProviders";

vi.mock("./AdminLoginForm", () => ({
  AdminLoginForm: () => <div data-testid="admin-login-form" />,
}));

import { AdminLoginPage } from "./AdminLoginPage";

describe("AdminLoginPage", () => {
  it("renders AdminLoginForm", () => {
    renderWithProviders(<AdminLoginPage />);
    expect(screen.getByTestId("admin-login-form")).toBeInTheDocument();
  });
});
