import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import { fetchServicesInquiryMap } from "./fetchServicesInquiryMap";
import { FIXTURE_SERVICE_ID } from "../test/fixtures/uuids.fixture";

describe("fetchServicesInquiryMap", () => {
  it("maps inquiry codes to service ids", async () => {
    const result = await fetchServicesInquiryMap("token-1");
    expect(result.serviceByInquiryCode.get("SHOW")).toBe(FIXTURE_SERVICE_ID);
    expect(result.fallbackServiceId).toBe(FIXTURE_SERVICE_ID);
  });

  it("returns an empty map when services payload is invalid", async () => {
    server.use(
      http.get("*/api/v1/services/admin", () => HttpResponse.json({})),
    );
    const result = await fetchServicesInquiryMap("token-empty");
    expect(result.serviceByInquiryCode.size).toBe(0);
    expect(result.fallbackServiceId).toBeUndefined();
  });
});
