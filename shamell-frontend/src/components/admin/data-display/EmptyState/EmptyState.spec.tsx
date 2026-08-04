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

import { EmptyState } from "./EmptyState";

describe("EmptyState", () => {
  it("exposes role=status and title", () => {
    render(<EmptyState title="No items yet" />);
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByText("No items yet")).toBeInTheDocument();
  });

  it("renders action as link when href is set", () => {
    render(
      <EmptyState
        title="Empty"
        action={{ label: "Add item", href: "/admin/items" }}
      />,
    );
    const link = screen.getByRole("link", { name: "Add item" });
    expect(link).toHaveAttribute("href", "/admin/items");
  });

  it("renders action as button when onClick is set", async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(
      <EmptyState title="Empty" action={{ label: "Retry", onClick }} />,
    );
    await user.click(screen.getByRole("button", { name: "Retry" }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("renders muted tone without crashing", () => {
    render(<EmptyState title="No matches" tone="muted" description="Try another filter." />);
    expect(screen.getByText("No matches")).toBeInTheDocument();
    expect(screen.getByText("Try another filter.")).toBeInTheDocument();
  });
});
