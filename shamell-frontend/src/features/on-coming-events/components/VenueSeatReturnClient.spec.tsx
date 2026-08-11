/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { FIXTURE_EVENT_SLUG } from "../test/fixtures/uuids.fixture";
import { renderWithProviders } from "../test/utils/renderWithProviders";

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

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams("session_id=cs_test_session"),
}));

vi.mock("@/components/shared", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/components/shared")>();
  return {
    ...actual,
    SiteHeader: () => <header data-testid="site-header" />,
    Footer: () => <footer data-testid="site-footer" />,
  };
});

vi.mock("next/image", () => ({
  default: ({ alt = "" }: { alt?: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={alt} />
  ),
}));

vi.mock("@/hooks/use-media-query", () => ({
  useMediaQuery: () => true,
}));

import VenueSeatReturnClient from "./VenueSeatReturnClient";

describe("VenueSeatReturnClient", () => {
  it("polls session status and shows paid confirmation", async () => {
    renderWithProviders(<VenueSeatReturnClient slug={FIXTURE_EVENT_SLUG} />);
    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Reservation confirmed" }),
      ).toBeInTheDocument();
    });
    expect(screen.getByText("Large 1")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /home/i })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /view floor plan/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /event details/i })).not.toBeInTheDocument();
  });
});
