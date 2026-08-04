import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import { createFixedEventCheckoutSession } from "./createFixedEventCheckoutSession";
import { FIXTURE_CLIENT_SECRET, FIXTURE_EVENT_SLUG } from "../test/fixtures/uuids.fixture";

const body = {
  customerName: "Ada Lovelace",
  customerEmail: "ada@example.com",
};

describe("createFixedEventCheckoutSession", () => {
  it("returns client secret on success", async () => {
    const result = await createFixedEventCheckoutSession(FIXTURE_EVENT_SLUG, body);
    expect(result).toEqual({ ok: true, clientSecret: FIXTURE_CLIENT_SECRET });
  });

  it("returns server message on non-ok response", async () => {
    server.use(
      http.post("*/api/v1/upcoming-events/:slug/fixed-event/checkout-session", () =>
        HttpResponse.json({ message: "Sold out" }, { status: 409 }),
      ),
    );
    const result = await createFixedEventCheckoutSession(FIXTURE_EVENT_SLUG, body);
    expect(result).toEqual({ ok: false, message: "Sold out" });
  });

  it("returns invalid response when clientSecret is missing", async () => {
    server.use(
      http.post("*/api/v1/upcoming-events/:slug/fixed-event/checkout-session", () =>
        HttpResponse.json({}),
      ),
    );
    const result = await createFixedEventCheckoutSession(FIXTURE_EVENT_SLUG, body);
    expect(result).toEqual({ ok: false, message: "Invalid checkout response." });
  });
});
