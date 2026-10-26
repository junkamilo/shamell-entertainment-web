/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { FIXTURE_EVENT_SLUG } from "@test/features/on-coming-events/support/fixtures/uuids.fixture";
import { renderWithProviders } from "@test/features/on-coming-events/support/helpers/renderWithProviders";

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

vi.mock("@/components/shared", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/components/shared")>();
  return {
    ...actual,
    SiteHeader: () => <header data-testid="site-header" />,
    Footer: () => <footer data-testid="site-footer" />,
  };
});

vi.mock("@/components/stripe", () => ({
  StripeCheckoutHost: () => <div data-testid="stripe-checkout" />,
}));

import UpcomingClassesPublicPage from "@/features/on-coming-events/components/UpcomingClassesPublicPage";

describe("UpcomingClassesPublicPage", () => {
  it("loads sessions and renders event heading", async () => {
    renderWithProviders(<UpcomingClassesPublicPage slug={FIXTURE_EVENT_SLUG} />);
    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Weekly Bachata" }),
      ).toBeInTheDocument();
    });
    expect(screen.getByText(/\$25\.00 · 12 spots left/i)).toBeInTheDocument();
    expect(screen.getByTestId("site-header")).toBeInTheDocument();
  });
});
