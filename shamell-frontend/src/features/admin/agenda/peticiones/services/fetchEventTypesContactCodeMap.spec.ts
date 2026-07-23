import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import { fetchEventTypesContactCodeMap } from "./fetchEventTypesContactCodeMap";
import { FIXTURE_EVENT_TYPE_ID } from "../test/fixtures/uuids.fixture";

describe("fetchEventTypesContactCodeMap", () => {
  it("maps event type ids to contact inquiry codes", async () => {
    const result = await fetchEventTypesContactCodeMap("token-1");
    expect(result.get(FIXTURE_EVENT_TYPE_ID)).toBe("PRIVATE");
  });

  it("returns an empty map when payload is invalid", async () => {
    server.use(
      http.get("*/api/v1/events/types/admin", () => HttpResponse.json({})),
    );
    const result = await fetchEventTypesContactCodeMap("token-empty");
    expect(result.size).toBe(0);
  });
});
