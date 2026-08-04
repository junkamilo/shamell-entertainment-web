/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    className,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
  }) => (
    <a href={href} className={className} {...rest}>
      {children}
    </a>
  ),
}));

import { BackButton } from "./BackButton";

describe("BackButton", () => {
  it("links to href with uppercased label", () => {
    render(<BackButton href="/admin/agenda" label="Back" />);
    const link = screen.getByRole("link", { name: /BACK/ });
    expect(link).toHaveAttribute("href", "/admin/agenda");
  });

  it("applies subtle variant classes", () => {
    render(<BackButton href="/admin" variant="subtle" />);
    expect(screen.getByRole("link")).toHaveClass("border-gold/20");
  });

  it("merges className", () => {
    render(<BackButton href="/admin" className="mb-4" />);
    expect(screen.getByRole("link")).toHaveClass("mb-4");
  });
});
