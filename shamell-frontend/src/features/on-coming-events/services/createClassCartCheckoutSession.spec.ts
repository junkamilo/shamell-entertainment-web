import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import { createClassCartCheckoutSession } from "./createClassCartCheckoutSession";
import {
  FIXTURE_CLIENT_SECRET,
  FIXTURE_EVENT_SLUG,
  FIXTURE_PACKAGE_ENROLLMENT_ID,
  FIXTURE_SESSION_ID,
} from "../test/fixtures/uuids.fixture";

const body = {
  sessionIds: [FIXTURE_SESSION_ID],
  customerName: "Ada Lovelace",
  customerEmail: "ada@example.com",
};

describe("createClassCartCheckoutSession", () => {
  it("returns client secret and package enrollment id on success", async () => {
    server.use(
      http.post(
        "*/api/v1/upcoming-events/:slug/sessions/cart-checkout-session",
        () =>
          HttpResponse.json({
            clientSecret: FIXTURE_CLIENT_SECRET,
            packageEnrollmentId: FIXTURE_PACKAGE_ENROLLMENT_ID,
          }),
      ),
    );
    const result = await createClassCartCheckoutSession(FIXTURE_EVENT_SLUG, body);
    expect(result).toEqual({
      ok: true,
      clientSecret: FIXTURE_CLIENT_SECRET,
      packageEnrollmentId: FIXTURE_PACKAGE_ENROLLMENT_ID,
    });
  });

  it("returns server message on non-ok response", async () => {
    server.use(
      http.post(
        "*/api/v1/upcoming-events/:slug/sessions/cart-checkout-session",
        () => HttpResponse.json({ message: "Sessions unavailable" }, { status: 400 }),
      ),
    );
    const result = await createClassCartCheckoutSession(FIXTURE_EVENT_SLUG, body);
    expect(result).toEqual({ ok: false, message: "Sessions unavailable" });
  });
});
