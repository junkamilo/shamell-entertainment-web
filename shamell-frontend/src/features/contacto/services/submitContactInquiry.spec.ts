import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import { submitContactInquiry } from "./submitContactInquiry";

describe("submitContactInquiry", () => {
  it("returns ok on success", async () => {
    const result = await submitContactInquiry({
      fullName: "Ada Lovelace",
      email: "ada@example.com",
      message: "Hello from the contact form.",
      inquiryDetails: { entrySource: "contact_page" },
    });
    expect(result).toEqual({ ok: true });
  });

  it("posts JSON without auth headers", async () => {
    let auth: string | null = null;
    let body: unknown = null;
    server.use(
      http.post("*/api/v1/contact", async ({ request }) => {
        auth = request.headers.get("Authorization");
        body = await request.json();
        return HttpResponse.json({ ok: true });
      }),
    );

    await submitContactInquiry({
      fullName: "Ada Lovelace",
      email: "ada@example.com",
      phone: "+15551234567",
      message: "Hello",
      inquiryDetails: {},
    });

    expect(auth).toBeNull();
    expect(body).toEqual({
      fullName: "Ada Lovelace",
      email: "ada@example.com",
      phone: "+15551234567",
      message: "Hello",
      inquiryDetails: {},
    });
  });

  it("returns string message on error", async () => {
    server.use(
      http.post("*/api/v1/contact", () =>
        HttpResponse.json({ message: "Invalid email" }, { status: 400 }),
      ),
    );

    const result = await submitContactInquiry({
      fullName: "Ada",
      email: "bad",
      message: "Hello",
      inquiryDetails: {},
    });

    expect(result).toEqual({ ok: false, message: "Invalid email" });
  });

  it("joins array message on error", async () => {
    server.use(
      http.post("*/api/v1/contact", () =>
        HttpResponse.json({ message: ["Email required", "Name too short"] }, { status: 400 }),
      ),
    );

    const result = await submitContactInquiry({
      fullName: "A",
      email: "",
      message: "Hello",
      inquiryDetails: {},
    });

    expect(result).toEqual({ ok: false, message: "Email required Name too short" });
  });

  it("returns fallback message when response has no message", async () => {
    server.use(
      http.post("*/api/v1/contact", () => HttpResponse.json({}, { status: 500 })),
    );

    const result = await submitContactInquiry({
      fullName: "Ada",
      email: "ada@example.com",
      message: "Hello",
      inquiryDetails: {},
    });

    expect(result).toEqual({
      ok: false,
      message: "Could not send your inquiry. Please try again.",
    });
  });
});
