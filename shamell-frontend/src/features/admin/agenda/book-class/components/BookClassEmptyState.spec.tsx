/** @vitest-environment jsdom */

import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../test/utils/renderWithProviders";
import { BOOK_CLASS_SETUP_PATH } from "../lib/bookClassRoutes";
import { BookClassEmptyState } from "./BookClassEmptyState";

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

describe("BookClassEmptyState", () => {
  it("explains that no bookable schedule exists", () => {
    renderWithProviders(<BookClassEmptyState />);
    expect(
      screen.getByText(/no bookable class schedule yet/i),
    ).toBeInTheDocument();
    expect(screen.getByText("Recurring Weekdays (Classes)")).toBeInTheDocument();
  });

  it("links to On Coming Events setup", () => {
    renderWithProviders(<BookClassEmptyState />);
    const link = screen.getByRole("link", {
      name: /create recurring weekdays \(classes\)/i,
    });
    expect(link).toHaveAttribute("href", BOOK_CLASS_SETUP_PATH);
  });
});
