/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMockForgotPasswordState } from "../test/helpers/mockForgotPassword";
import { renderWithProviders } from "../test/utils/renderWithProviders";
import { makeDevResetLink } from "../test/helpers/mockForgotPassword";

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

const useForgotPasswordMock = vi.fn(() => createMockForgotPasswordState());

vi.mock("../hooks/useForgotPassword", () => ({
  useForgotPassword: () => useForgotPasswordMock(),
}));

import ForgotPasswordForm from "./ForgotPasswordForm";

describe("ForgotPasswordForm", () => {
  it("renders title and submit button", () => {
    useForgotPasswordMock.mockReturnValue(createMockForgotPasswordState());
    renderWithProviders(<ForgotPasswordForm />);
    expect(
      screen.getByRole("heading", { name: /reset your password/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /send recovery link/i }),
    ).toBeInTheDocument();
  });

  it("shows error and message from hook state", () => {
    useForgotPasswordMock.mockReturnValue(
      createMockForgotPasswordState({
        error: "Please enter your email address.",
        message: null,
      }),
    );
    renderWithProviders(<ForgotPasswordForm />);
    expect(
      screen.getByText("Please enter your email address."),
    ).toBeInTheDocument();
  });

  it("shows development reset link when present", () => {
    useForgotPasswordMock.mockReturnValue(
      createMockForgotPasswordState({
        message: "Link sent.",
        resetLink: makeDevResetLink(),
      }),
    );
    renderWithProviders(<ForgotPasswordForm />);
    expect(screen.getByText(/development only/i)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /open reset page/i }),
    ).toHaveAttribute("href", makeDevResetLink());
  });

  it("submits via hook onSubmit", async () => {
    const user = userEvent.setup();
    const state = createMockForgotPasswordState();
    useForgotPasswordMock.mockReturnValue(state);
    renderWithProviders(<ForgotPasswordForm />);
    await user.click(
      screen.getByRole("button", { name: /send recovery link/i }),
    );
    expect(state.onSubmit).toHaveBeenCalled();
  });
});
