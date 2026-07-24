/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../test/utils/renderWithProviders";

vi.mock("./ForgotPasswordForm", () => ({
  default: () => <div data-testid="forgot-password-form" />,
}));

import ForgotPasswordPage from "./ForgotPasswordPage";

describe("ForgotPasswordPage", () => {
  it("renders ForgotPasswordForm", () => {
    renderWithProviders(<ForgotPasswordPage />);
    expect(screen.getByTestId("forgot-password-form")).toBeInTheDocument();
  });
});
