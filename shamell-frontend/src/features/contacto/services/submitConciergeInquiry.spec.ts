import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import { submitConciergeInquiry } from "./submitConciergeInquiry";

const completeBody = {
  fullName: "Ada Lovelace",
  email: "ada@example.com",
  phone: "+15551234567",
  eventDate: "2030-08-01",
  location: "Miami",
  message: "Need guidance planning a celebration.",
  emailVerificationToken: "a".repeat(40),
  inquiryDetails: {
    entrySource: "concierge_gate",
    planningStage: "EARLY_IDEA",
    guestCount: 12,
  },
};

describe("submitConciergeInquiry", () => {
  it("returns ok on success", async () => {
    const result = await submitConciergeInquiry(completeBody);
    expect(result).toEqual({ ok: true });
  });

  it("adds concierge serviceType and subject", async () => {
    let body: unknown = null;
    server.use(
      http.post("*/api/v1/contact", async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({ ok: true });
      }),
    );

    await submitConciergeInquiry(completeBody);

    expect(body).toEqual({
      ...completeBody,
      serviceType: "GENERAL",
      subject: "Concierge inquiry - client needs guidance",
    });
  });

  it("returns nestApiErrorMessage on failure", async () => {
    server.use(
      http.post("*/api/v1/contact", () =>
        HttpResponse.json({ message: "Rate limited" }, { status: 429 }),
      ),
    );

    const result = await submitConciergeInquiry(completeBody);

    expect(result).toEqual({ ok: false, message: "Rate limited" });
  });

  it("returns concierge fallback when response has no message", async () => {
    server.use(
      http.post("*/api/v1/contact", () => HttpResponse.json({}, { status: 500 })),
    );

    const result = await submitConciergeInquiry(completeBody);

    expect(result).toEqual({
      ok: false,
      message: "Could not send your concierge inquiry. Please try again.",
    });
  });
});
