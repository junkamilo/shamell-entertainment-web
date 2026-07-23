/** @vitest-environment jsdom */

import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../test/utils/renderWithProviders";
import { BOOK_CLASS_SETUP_PATH } from "../lib/bookClassRoutes";
import { BookClassSetupNotice } from "./BookClassSetupNotice";

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

describe("BookClassSetupNotice", () => {
  it("lists readiness issues", () => {
    renderWithProviders(
      <BookClassSetupNotice
        issues={["Event slug is missing.", "No upcoming sessions with available seats."]}
      />,
    );

    expect(
      screen.getByText(/this class event is not ready to book/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/event slug is missing/i)).toBeInTheDocument();
    expect(
      screen.getByText(/no upcoming sessions with available seats/i),
    ).toBeInTheDocument();
  });

  it("links to edit the event", () => {
    renderWithProviders(<BookClassSetupNotice issues={[]} />);
    const link = screen.getByRole("link", {
      name: /edit event in on coming events/i,
    });
    expect(link).toHaveAttribute("href", BOOK_CLASS_SETUP_PATH);
  });
});
