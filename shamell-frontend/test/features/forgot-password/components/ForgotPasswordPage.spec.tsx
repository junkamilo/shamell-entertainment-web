/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@test/features/forgot-password/support/helpers/renderWithProviders";

vi.mock("@/features/forgot-password/components/ForgotPasswordForm", () => ({
  default: () => <div data-testid="forgot-password-form" />,
}));

import ForgotPasswordPage from "@/features/forgot-password/components/ForgotPasswordPage";

describe("ForgotPasswordPage", () => {
  it("renders ForgotPasswordForm", () => {
    renderWithProviders(<ForgotPasswordPage />);
    expect(screen.getByTestId("forgot-password-form")).toBeInTheDocument();
  });
});
