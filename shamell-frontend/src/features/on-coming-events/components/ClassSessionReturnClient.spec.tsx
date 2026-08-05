/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import { renderWithProviders } from "../test/utils/renderWithProviders";

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

import { ClassSessionReturnClient } from "./ClassSessionReturnClient";

describe("ClassSessionReturnClient", () => {
  it("polls class enrollment status and shows confirmation", async () => {
    server.use(
      http.get("*/api/v1/class-enrollments/session-status", () =>
        HttpResponse.json({
          stripeStatus: "complete",
          enrollment: { status: "PAID" },
        }),
      ),
    );
    renderWithProviders(<ClassSessionReturnClient />);
    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "You're booked" }),
      ).toBeInTheDocument();
    });
  });
});
