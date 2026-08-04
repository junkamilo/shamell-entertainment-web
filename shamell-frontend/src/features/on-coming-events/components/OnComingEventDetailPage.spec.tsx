/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { FIXTURE_EVENT_SLUG } from "../test/fixtures/uuids.fixture";
import { renderWithProviders } from "../test/utils/renderWithProviders";

vi.mock("next/image", () => ({
  default: ({ alt = "" }: { alt?: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={alt} />
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
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock("@/components/Footer", () => ({
  default: () => <footer data-testid="site-footer" />,
}));

vi.mock("@/components/stripe/StripeCheckoutHost", () => ({
  StripeCheckoutHost: () => <div data-testid="stripe-checkout" />,
}));

vi.mock("@/hooks/use-media-query", () => ({
  useMediaQuery: () => true,
}));

vi.mock("@/components/shared/RevealOnView", () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import OnComingEventDetailPage from "./OnComingEventDetailPage";

describe("OnComingEventDetailPage", () => {
  it("loads event detail and renders hero title", async () => {
    renderWithProviders(<OnComingEventDetailPage slug={FIXTURE_EVENT_SLUG} />);
    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Weekly Bachata" }),
      ).toBeInTheDocument();
    });
    expect(screen.getByText(/beginner-friendly weekly class/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /what's included/i })).toBeInTheDocument();
    expect(screen.getByTestId("site-footer")).toBeInTheDocument();
  });
});
