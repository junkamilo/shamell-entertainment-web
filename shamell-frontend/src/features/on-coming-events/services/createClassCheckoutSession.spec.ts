import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import { createClassCheckoutSession } from "./createClassCheckoutSession";
import {
  FIXTURE_CLIENT_SECRET,
  FIXTURE_EVENT_SLUG,
  FIXTURE_SESSION_ID,
} from "../test/fixtures/uuids.fixture";

const body = {
  sessionId: FIXTURE_SESSION_ID,
  customerName: "Ada Lovelace",
  customerEmail: "ada@example.com",
};

describe("createClassCheckoutSession", () => {
  it("returns client secret on success", async () => {
    const result = await createClassCheckoutSession(FIXTURE_EVENT_SLUG, body);
    expect(result).toEqual({ ok: true, clientSecret: FIXTURE_CLIENT_SECRET });
  });

  it("returns server message on non-ok response", async () => {
    server.use(
      http.post("*/api/v1/upcoming-events/:slug/sessions/checkout-session", () =>
        HttpResponse.json({ message: "Session full" }, { status: 409 }),
      ),
    );
    const result = await createClassCheckoutSession(FIXTURE_EVENT_SLUG, body);
    expect(result).toEqual({ ok: false, message: "Session full" });
  });

  it("returns invalid response when clientSecret is missing", async () => {
    server.use(
      http.post("*/api/v1/upcoming-events/:slug/sessions/checkout-session", () =>
        HttpResponse.json({ reservationId: "x" }),
      ),
    );
    const result = await createClassCheckoutSession(FIXTURE_EVENT_SLUG, body);
    expect(result).toEqual({ ok: false, message: "Invalid checkout response." });
  });
});
