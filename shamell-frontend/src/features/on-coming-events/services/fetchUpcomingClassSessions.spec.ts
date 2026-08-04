import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import { fetchUpcomingClassSessions } from "./fetchUpcomingClassSessions";
import {
  FIXTURE_EVENT_SLUG,
  FIXTURE_SESSION_ID,
} from "../test/fixtures/uuids.fixture";

describe("fetchUpcomingClassSessions", () => {
  it("loads event metadata and sessions", async () => {
    const data = await fetchUpcomingClassSessions(FIXTURE_EVENT_SLUG);
    expect(data.event.slug).toBe(FIXTURE_EVENT_SLUG);
    expect(data.sessions[0]?.id).toBe(FIXTURE_SESSION_ID);
  });

  it("throws on non-ok response", async () => {
    server.use(
      http.get("*/api/v1/upcoming-events/:slug/sessions", () =>
        HttpResponse.json({ message: "down" }, { status: 500 }),
      ),
    );
    await expect(fetchUpcomingClassSessions(FIXTURE_EVENT_SLUG)).rejects.toThrow(
      /Could not load class sessions/,
    );
  });

  it("throws on invalid json body", async () => {
    server.use(
      http.get("*/api/v1/upcoming-events/:slug/sessions", () =>
        new HttpResponse("not-json", { status: 200 }),
      ),
    );
    await expect(fetchUpcomingClassSessions(FIXTURE_EVENT_SLUG)).rejects.toThrow(
      /Could not load class sessions/,
    );
  });
});
