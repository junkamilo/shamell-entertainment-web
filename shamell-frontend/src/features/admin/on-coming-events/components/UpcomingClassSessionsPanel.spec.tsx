/** @vitest-environment jsdom */

import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import { FIXTURE_EVENT_ID } from "../test/fixtures/uuids.fixture";
import { renderWithProviders } from "../test/utils/renderWithProviders";
import { UpcomingClassSessionsPanel } from "./UpcomingClassSessionsPanel";

vi.mock("@/features/admin/events/lib/eventsAuth", () => ({
  getEventsBearerToken: () => "events-token",
}));

vi.mock("@/app/admin/shared/lib/adminApiBaseUrl", () => ({
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
