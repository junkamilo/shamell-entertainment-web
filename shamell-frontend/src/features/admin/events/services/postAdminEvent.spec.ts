import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import { postAdminEvent } from "./postAdminEvent";
import { FIXTURE_EVENT_ID, FIXTURE_EVENT_TYPE_ID } from "../test/fixtures/uuids.fixture";

const body = {
  eventTypeId: FIXTURE_EVENT_TYPE_ID,
  description: "An elegant private wedding package with full staging.",
  items: ["Dance set"],
  showOnHome: true,
  publicSection: "GENERAL" as const,
  price: 2500,
};

describe("postAdminEvent", () => {
  it("returns the created event id on success", async () => {
    const result = await postAdminEvent("token-1", body);
    expect(result).toEqual({ id: FIXTURE_EVENT_ID });
  });

  it("sends JSON body with bearer token", async () => {
    let auth: string | null = null;
    let received: unknown = null;
    server.use(
      http.post("*/api/v1/events/admin", async ({ request }) => {
        auth = request.headers.get("Authorization");
        received = await request.json();
        return HttpResponse.json({ event: { id: FIXTURE_EVENT_ID } });
      }),
    );

    await postAdminEvent("token-1", body);
    expect(auth).toBe("Bearer token-1");
    expect(received).toMatchObject(body);
  });

  it("throws on 500 with message", async () => {
    server.use(
      http.post("*/api/v1/events/admin", () =>
        HttpResponse.json({ message: "nope" }, { status: 500 }),
      ),
    );
    await expect(postAdminEvent("token-1", body)).rejects.toThrow(/nope/);
  });
});
