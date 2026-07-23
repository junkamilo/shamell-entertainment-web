import { http, HttpResponse } from "msw";
import { afterEach, describe, expect, it, vi } from "vitest";
import { server } from "@/test/server";
import { makeClassEnrollmentBody } from "../test/fixtures/boxOffice.fixture";
import { FIXTURE_ENROLLMENT_ID } from "../test/fixtures/uuids.fixture";
import {
  createBoxOfficeClassCash,
  createBoxOfficeClassCheckout,
} from "./createBoxOfficeClassEnrollment";

const CASH_ROUTE = "*/api/v1/upcoming-events/admin/class-enrollments/cash";
const CHECKOUT_ROUTE =
  "*/api/v1/upcoming-events/admin/class-enrollments/checkout-session";

describe("createBoxOfficeClassCash", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("posts the body and returns the enrollment on success", async () => {
    let body: unknown;
    server.use(
      http.post(CASH_ROUTE, async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({
          enrollmentId: FIXTURE_ENROLLMENT_ID,
          message: "Cash enrollment recorded.",
        });
      }),
    );

    const payload = makeClassEnrollmentBody();
    const result = await createBoxOfficeClassCash("token-1", payload);

    expect(result).toEqual({
      ok: true,
      enrollmentId: FIXTURE_ENROLLMENT_ID,
      message: "Cash enrollment recorded.",
      payUrl: undefined,
    });
    expect(body).toMatchObject(payload);
  });

  it("returns ok:false when the response body is missing enrollmentId", async () => {
    server.use(
      http.post(CASH_ROUTE, () => HttpResponse.json({ message: "weird" })),
    );
    const result = await createBoxOfficeClassCash(
      "token-1",
      makeClassEnrollmentBody(),
    );
    expect(result).toEqual({ ok: false, message: "Invalid response." });
  });

  it("returns ok:false when offline", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("network down");
      }),
    );
    const result = await createBoxOfficeClassCash(
      "token-1",
      makeClassEnrollmentBody(),
    );
    expect(result).toEqual({
      ok: false,
      message: "Could not reach the server.",
    });
  });
});

describe("createBoxOfficeClassCheckout", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("posts the body and returns the payUrl on success", async () => {
    server.use(
      http.post(CHECKOUT_ROUTE, () =>
        HttpResponse.json({
          enrollmentId: FIXTURE_ENROLLMENT_ID,
          message: "Checkout session created.",
          payUrl: "https://checkout.test/session_123",
        }),
      ),
    );

    const result = await createBoxOfficeClassCheckout(
      "token-1",
      makeClassEnrollmentBody(),
    );

    expect(result).toEqual({
      ok: true,
      enrollmentId: FIXTURE_ENROLLMENT_ID,
      message: "Checkout session created.",
      payUrl: "https://checkout.test/session_123",
    });
  });

  it("returns ok:false with the API message when the body is invalid", async () => {
    server.use(
      http.post(CHECKOUT_ROUTE, () =>
        HttpResponse.json({ message: "Bad request" }, { status: 400 }),
      ),
    );
    const result = await createBoxOfficeClassCheckout(
      "token-1",
      makeClassEnrollmentBody(),
    );
    expect(result).toEqual({ ok: false, message: "Bad request" });
  });

  it("returns ok:false when offline", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("network down");
      }),
    );
    const result = await createBoxOfficeClassCheckout(
      "token-1",
      makeClassEnrollmentBody(),
    );
    expect(result).toEqual({
      ok: false,
      message: "Could not reach the server.",
    });
  });
});
