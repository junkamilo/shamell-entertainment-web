/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

import { AppStatusScreen } from "./AppStatusScreen";

describe("AppStatusScreen", () => {
  it("renders title, message, primary action, and home link", async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(
      <AppStatusScreen
        title="Something went wrong"
        message="An unexpected error occurred."
        primaryAction={{ label: "Try again", onClick }}
      />,
    );
    expect(
      screen.getByRole("heading", { name: "Something went wrong" }),
    ).toBeInTheDocument();
    expect(screen.getByText("An unexpected error occurred.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute("href", "/");
    await user.click(screen.getByRole("button", { name: "Try again" }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("omits primary action when not provided", () => {
    render(
      <AppStatusScreen
        title="Page not found"
        message="This page does not exist or was moved."
      />,
    );
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Home" })).toBeInTheDocument();
  });
});
