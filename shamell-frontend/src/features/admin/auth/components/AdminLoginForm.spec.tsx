/** @vitest-environment jsdom */

import type { ReactNode } from "react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FORGOT_PASSWORD_PATH } from "@/features/forgot-password";
import { createMockAdminLoginState } from "../test/helpers/mockAdminLogin";
import { renderWithProviders } from "../test/utils/renderWithProviders";

vi.mock("next/image", () => ({
  default: ({
    alt = "",
    src,
    className,
  }: {
    alt?: string;
    src: string | { src: string };
    className?: string;
  }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      alt={alt}
      className={className}
      src={typeof src === "string" ? src : src.src}
    />
  ),
}));

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    className,
  }: {
    children: ReactNode;
    href: string;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

let loginState = createMockAdminLoginState();

vi.mock("../hooks/useAdminLogin", () => ({
  useAdminLogin: () => loginState,
}));

import { AdminLoginForm } from "./AdminLoginForm";

describe("AdminLoginForm", () => {
  beforeEach(() => {
    loginState = createMockAdminLoginState();
  });

  it("renders the heading and sign-in button", () => {
    renderWithProviders(<AdminLoginForm />);

    expect(
      screen.getByRole("heading", { name: "Shamell admin login" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Sign In as Admin" }),
    ).toBeInTheDocument();
  });

  it("renders the Forgot password? link", () => {
    renderWithProviders(<AdminLoginForm />);

    const link = screen.getByRole("link", { name: "Forgot password?" });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", FORGOT_PASSWORD_PATH);
  });

  it("shows error text when error is set", () => {
    loginState = createMockAdminLoginState({
      error: "Invalid credentials",
    });
    renderWithProviders(<AdminLoginForm />);

    expect(screen.getByText("Invalid credentials")).toBeInTheDocument();
  });

  it("shows Signing in... when isSubmitting", () => {
    loginState = createMockAdminLoginState({ isSubmitting: true });
    renderWithProviders(<AdminLoginForm />);

    expect(
      screen.getByRole("button", { name: "Signing in..." }),
    ).toBeInTheDocument();
  });

  it("calls onSubmit when the form is submitted", async () => {
    const user = userEvent.setup();
    loginState = createMockAdminLoginState({ password: "secret" });
    renderWithProviders(<AdminLoginForm />);

    await user.click(screen.getByRole("button", { name: "Sign In as Admin" }));
    expect(loginState.onSubmit).toHaveBeenCalled();
  });
});
