import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import { fetchPeticionesBadge } from "./fetchPeticionesBadge";
import { FIXTURE_PETICIONES_SINCE } from "../test/fixtures/uuids.fixture";

describe("fetchPeticionesBadge", () => {
  it("returns 0 when since is omitted", async () => {
    expect(await fetchPeticionesBadge("token-1")).toBe(0);
  });

  it("returns the badge count for a lane with since", async () => {
    expect(
      await fetchPeticionesBadge("token-1", {
        since: FIXTURE_PETICIONES_SINCE,
        lane: "bookings",
      }),
    ).toBe(5);
    expect(
      await fetchPeticionesBadge("token-1", {
        since: FIXTURE_PETICIONES_SINCE,
        lane: "private_classes",
      }),
    ).toBe(7);
  });

  it("returns 0 when the payload count is invalid", async () => {
    server.use(
      http.get("*/api/v1/contact/peticiones/badge", () =>
        HttpResponse.json({ count: "x" }),
      ),
    );
    expect(
      await fetchPeticionesBadge("token-1", { since: FIXTURE_PETICIONES_SINCE }),
    ).toBe(0);
  });
});
