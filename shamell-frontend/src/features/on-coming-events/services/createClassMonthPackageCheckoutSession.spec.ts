import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import { createClassMonthPackageCheckoutSession } from "./createClassMonthPackageCheckoutSession";
import {
  FIXTURE_CLIENT_SECRET,
  FIXTURE_EVENT_SLUG,
  FIXTURE_PACKAGE_ENROLLMENT_ID,
} from "../test/fixtures/uuids.fixture";

const body = {
  monthIso: "2030-08",
  customerName: "Ada Lovelace",
  customerEmail: "ada@example.com",
};

describe("createClassMonthPackageCheckoutSession", () => {
  it("returns client secret and package enrollment id on success", async () => {
    const result = await createClassMonthPackageCheckoutSession(FIXTURE_EVENT_SLUG, body);
    expect(result).toEqual({
      ok: true,
      clientSecret: FIXTURE_CLIENT_SECRET,
      packageEnrollmentId: FIXTURE_PACKAGE_ENROLLMENT_ID,
    });
  });

  it("returns server message on non-ok response", async () => {
    server.use(
      http.post(
        "*/api/v1/upcoming-events/:slug/class-package/checkout-session",
        () => HttpResponse.json({ message: "Package unavailable" }, { status: 400 }),
      ),
    );
    const result = await createClassMonthPackageCheckoutSession(FIXTURE_EVENT_SLUG, body);
    expect(result).toEqual({ ok: false, message: "Package unavailable" });
  });

  it("returns invalid response when clientSecret is missing", async () => {
    server.use(
      http.post(
        "*/api/v1/upcoming-events/:slug/class-package/checkout-session",
        () => HttpResponse.json({ packageEnrollmentId: FIXTURE_PACKAGE_ENROLLMENT_ID }),
      ),
    );
    const result = await createClassMonthPackageCheckoutSession(FIXTURE_EVENT_SLUG, body);
    expect(result).toEqual({ ok: false, message: "Invalid checkout response." });
  });
});
