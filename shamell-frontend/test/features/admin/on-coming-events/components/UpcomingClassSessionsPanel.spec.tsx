/** @vitest-environment jsdom */

import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { server } from "@test/support/server";
import { FIXTURE_EVENT_ID } from "@test/features/admin/on-coming-events/support/fixtures/uuids.fixture";
import { renderWithProviders } from "@test/features/admin/on-coming-events/support/helpers/renderWithProviders";
import { UpcomingClassSessionsPanel } from "@/features/admin/on-coming-events/components/UpcomingClassSessionsPanel";

vi.mock("@/features/admin/events/lib/eventsAuth", () => ({
  getEventsBearerToken: () => "events-token",
}));

vi.mock("@/lib/admin/apiBaseUrl", () => ({
  getAdminApiBaseUrl: () => "http://localhost:3001",
}));

describe("UpcomingClassSessionsPanel", () => {
  beforeEach(() => {
    server.use(
      http.get(
        "*/api/v1/upcoming-events/admin/events/:eventId/sessions",
        () => HttpResponse.json([]),
      ),
    );
  });

  it("renders class sessions heading and add form", async () => {
    renderWithProviders(
      <UpcomingClassSessionsPanel eventId={FIXTURE_EVENT_ID} />,
    );
    expect(
      screen.getByRole("heading", { name: "CLASS SESSIONS" }),
    ).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.queryByText("Loading…")).not.toBeInTheDocument();
    });
    expect(
      screen.getByRole("button", { name: "Add session" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Session starts")).toBeInTheDocument();
  });
});
