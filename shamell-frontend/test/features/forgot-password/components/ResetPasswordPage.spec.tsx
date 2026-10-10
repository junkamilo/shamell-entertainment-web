/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@test/features/forgot-password/support/helpers/renderWithProviders";

vi.mock("@/features/forgot-password/components/ResetPasswordForm", () => ({
  default: () => <div data-testid="reset-password-form" />,
}));

import ResetPasswordPage from "@/features/forgot-password/components/ResetPasswordPage";

describe("ResetPasswordPage", () => {
  it("renders ResetPasswordForm inside Suspense", () => {
    renderWithProviders(<ResetPasswordPage />);
    expect(screen.getByTestId("reset-password-form")).toBeInTheDocument();
  });
});
