import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import { postAdminRegenerateClassSessions } from "./postAdminRegenerateClassSessions";
import { FIXTURE_EVENT_ID } from "../test/fixtures/uuids.fixture";

const ROUTE =
  "*/api/v1/upcoming-events/admin/events/:eventId/sessions/regenerate";

describe("postAdminRegenerateClassSessions", () => {
  it("regenerates class sessions for the event", async () => {
    let eventId = "";
    server.use(
      http.post(ROUTE, ({ params }) => {
        eventId = String(params.eventId);
        return HttpResponse.json({ ok: true });
      }),
    );

    const result = await postAdminRegenerateClassSessions("token-1", FIXTURE_EVENT_ID);
    expect(eventId).toBe(FIXTURE_EVENT_ID);
    expect(result).toEqual({ ok: true });
  });

  it("returns ok:false with API message on error", async () => {
    server.use(
      http.post(ROUTE, () =>
        HttpResponse.json({ message: "No template linked" }, { status: 400 }),
      ),
    );
    const result = await postAdminRegenerateClassSessions("token-1", FIXTURE_EVENT_ID);
    expect(result).toEqual({
      ok: false,
      message: "No template linked",
    });
  });

  it("returns a default failure message when the error body has none", async () => {
    server.use(http.post(ROUTE, () => HttpResponse.json({}, { status: 500 })));
    const result = await postAdminRegenerateClassSessions("token-1", FIXTURE_EVENT_ID);
    expect(result).toEqual({
      ok: false,
      message: "Could not generate class sessions.",
    });
  });
});
