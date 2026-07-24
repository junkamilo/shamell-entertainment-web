/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../test/utils/renderWithProviders";

vi.mock("./ResetPasswordForm", () => ({
  default: () => <div data-testid="reset-password-form" />,
}));

import ResetPasswordPage from "./ResetPasswordPage";

describe("ResetPasswordPage", () => {
  it("renders ResetPasswordForm inside Suspense", () => {
    renderWithProviders(<ResetPasswordPage />);
    expect(screen.getByTestId("reset-password-form")).toBeInTheDocument();
  });
});
