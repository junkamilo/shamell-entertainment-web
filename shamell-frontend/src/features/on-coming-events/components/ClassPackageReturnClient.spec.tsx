/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import { renderWithProviders } from "../test/utils/renderWithProviders";

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams("session_id=cs_test_session"),
}));

vi.mock("@/components/SiteHeader", () => ({
  default: () => <header data-testid="site-header" />,
}));

vi.mock("@/components/Footer", () => ({
  default: () => <footer data-testid="site-footer" />,
}));

vi.mock("next/image", () => ({
  default: ({ alt = "" }: { alt?: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={alt} />
  ),
}));

vi.mock("@/hooks/use-media-query", () => ({
  useMediaQuery: () => true,
}));

import { ClassPackageReturnClient } from "./ClassPackageReturnClient";

describe("ClassPackageReturnClient", () => {
  it("polls package enrollment and shows package confirmation", async () => {
    server.use(
      http.get("*/api/v1/class-enrollments/session-status", () =>
        HttpResponse.json({
          stripeStatus: "complete",
          purchaseKind: "package",
          enrollment: {
            status: "PAID",
            sessions: [
              {
                sessionLabel: "Mon 7pm Beginner",
                confirmationReference: "ABC123",
              },
            ],
          },
        }),
      ),
    );
    renderWithProviders(<ClassPackageReturnClient />);
    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Package confirmed" }),
      ).toBeInTheDocument();
    });
    expect(screen.getByText(/Mon 7pm Beginner/i)).toBeInTheDocument();
  });
});
