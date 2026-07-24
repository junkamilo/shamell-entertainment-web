/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMockResetPasswordState } from "../test/helpers/mockForgotPassword";
import { renderWithProviders } from "../test/utils/renderWithProviders";

vi.mock("next/image", () => ({
  default: ({ alt = "" }: { alt?: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={alt} src="/bailarina.png" />
  ),
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

const useResetPasswordMock = vi.fn(() => createMockResetPasswordState());

vi.mock("../hooks/useResetPassword", () => ({
  useResetPassword: () => useResetPasswordMock(),
}));

import ResetPasswordForm from "./ResetPasswordForm";

describe("ResetPasswordForm", () => {
  it("renders choose password form", () => {
    useResetPasswordMock.mockReturnValue(createMockResetPasswordState());
    renderWithProviders(<ResetPasswordForm />);
    expect(
      screen.getByRole("heading", { name: /choose a new password/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /update password/i }),
    ).toBeInTheDocument();
  });

  it("disables submit and shows token error", () => {
    useResetPasswordMock.mockReturnValue(
      createMockResetPasswordState({
        token: "",
        tokenError: "Invalid or missing recovery link.",
      }),
    );
    renderWithProviders(<ResetPasswordForm />);
    expect(
      screen.getByText("Invalid or missing recovery link."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /update password/i }),
    ).toBeDisabled();
  });

  it("shows success state with admin sign-in link", () => {
    useResetPasswordMock.mockReturnValue(
      createMockResetPasswordState({
        message: "Password updated successfully.",
      }),
    );
    renderWithProviders(<ResetPasswordForm />);
    expect(
      screen.getByText("Password updated successfully."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /sign in as admin/i }),
    ).toBeInTheDocument();
  });

  it("submits via hook onSubmit", async () => {
    const user = userEvent.setup();
    const state = createMockResetPasswordState();
    useResetPasswordMock.mockReturnValue(state);
    renderWithProviders(<ResetPasswordForm />);
    await user.click(screen.getByRole("button", { name: /update password/i }));
    expect(state.onSubmit).toHaveBeenCalled();
  });
});
