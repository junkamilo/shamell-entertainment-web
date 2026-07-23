import { describe, expect, it, vi } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import { fetchContactLinesInquiryMap } from "./fetchContactLinesInquiryMap";
import { FIXTURE_CONTACT_LINE_ID } from "../test/fixtures/uuids.fixture";

vi.mock("@/app/admin/shared/lib/adminAuth", () => ({
  getAdminBearerToken: () => null,
}));

describe("fetchContactLinesInquiryMap", () => {
  it("maps contact line ids to inquiry codes", async () => {
    const result = await fetchContactLinesInquiryMap("token-1");
    expect(result.get(FIXTURE_CONTACT_LINE_ID)).toBe("GUIDANCE");
  });

  it("returns an empty map when no bearer token is available", async () => {
    const result = await fetchContactLinesInquiryMap();
    expect(result.size).toBe(0);
  });

  it("returns an empty map when payload is invalid", async () => {
    server.use(
      http.get("*/api/v1/events/contact-lines", () => HttpResponse.json({})),
    );
    const result = await fetchContactLinesInquiryMap("token-empty");
    expect(result.size).toBe(0);
  });
});
