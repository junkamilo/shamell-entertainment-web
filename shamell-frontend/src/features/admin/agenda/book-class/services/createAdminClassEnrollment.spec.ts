import { describe, it, expect, vi, afterEach } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import {
  createAdminClassCashEnrollment,
  createAdminClassCheckoutSession,
} from "./createAdminClassEnrollment";
import { makeCreateEnrollmentBody } from "../test/fixtures/bookClass.fixture";
import { FIXTURE_ENROLLMENT_ID } from "../test/fixtures/uuids.fixture";

describe("createAdminClassCashEnrollment", () => {
  it("posts to cash and returns enrollment success", async () => {
    let body: unknown;
    server.use(
      http.post(
        "*/api/v1/upcoming-events/admin/class-enrollments/cash",
        async ({ request }) => {
          body = await request.json();
          return HttpResponse.json({
            enrollmentId: FIXTURE_ENROLLMENT_ID,
            message: "Cash enrollment recorded.",
          });
        },
      ),
    );

    const payload = makeCreateEnrollmentBody();
    const result = await createAdminClassCashEnrollment("token-1", payload);

    expect(result).toEqual({
      ok: true,
      enrollmentId: FIXTURE_ENROLLMENT_ID,
      message: "Cash enrollment recorded.",
      payUrl: undefined,
    });
    expect(body).toMatchObject(payload);
  });

  it("returns ok false with API message on error", async () => {
    server.use(
      http.post("*/api/v1/upcoming-events/admin/class-enrollments/cash", () =>
        HttpResponse.json({ message: "Already enrolled" }, { status: 409 }),
      ),
    );

    const result = await createAdminClassCashEnrollment(
      "token-1",
      makeCreateEnrollmentBody(),
    );
    expect(result).toEqual({ ok: false, message: "Already enrolled" });
  });

  it("returns default failure message without API message", async () => {
    server.use(
      http.post("*/api/v1/upcoming-events/admin/class-enrollments/cash", () =>
        HttpResponse.json({}, { status: 500 }),
      ),
    );

    const result = await createAdminClassCashEnrollment(
      "token-1",
      makeCreateEnrollmentBody(),
    );
    expect(result).toEqual({ ok: false, message: "Request failed." });
  });
});

describe("createAdminClassCheckoutSession", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("posts to checkout-session and returns payUrl", async () => {
    const result = await createAdminClassCheckoutSession(
      "token-1",
      makeCreateEnrollmentBody(),
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.enrollmentId).toBe(FIXTURE_ENROLLMENT_ID);
      expect(result.payUrl).toBe("https://checkout.test/session_123");
      expect(result.message).toBe("Checkout session created.");
    }
  });

  it("defaults message when success body omits it", async () => {
    server.use(
      http.post(
        "*/api/v1/upcoming-events/admin/class-enrollments/checkout-session",
        () =>
          HttpResponse.json({
            enrollmentId: FIXTURE_ENROLLMENT_ID,
          }),
      ),
    );

    const result = await createAdminClassCheckoutSession(
      "token-1",
      makeCreateEnrollmentBody(),
    );
    expect(result).toEqual({
      ok: true,
      enrollmentId: FIXTURE_ENROLLMENT_ID,
      message: "Done.",
      payUrl: undefined,
    });
  });

  it("rejects success bodies without enrollmentId", async () => {
    server.use(
      http.post(
        "*/api/v1/upcoming-events/admin/class-enrollments/checkout-session",
        () => HttpResponse.json({ message: "weird" }),
      ),
    );

    const result = await createAdminClassCheckoutSession(
      "token-1",
      makeCreateEnrollmentBody(),
    );
    expect(result).toEqual({ ok: false, message: "Invalid response." });
  });

  it("returns offline message when fetch throws", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("network down");
      }),
    );

    const result = await createAdminClassCheckoutSession(
      "token-1",
      makeCreateEnrollmentBody(),
    );
    expect(result).toEqual({ ok: false, message: "Could not reach the server." });
  });
});
