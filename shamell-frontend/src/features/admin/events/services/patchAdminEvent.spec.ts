import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import { patchAdminEvent, patchAdminEventActive } from "./patchAdminEvent";
import { FIXTURE_EVENT_ID, FIXTURE_EVENT_TYPE_ID } from "../test/fixtures/uuids.fixture";

const body = {
  eventTypeId: FIXTURE_EVENT_TYPE_ID,
  description: "An elegant private wedding package with full staging.",
  items: ["Dance set"],
  showOnHome: true,
  publicSection: "GENERAL" as const,
  price: 2500,
};

describe("patchAdminEvent", () => {
  it("resolves for upsert patch", async () => {
    let receivedId = "";
    server.use(
      http.patch("*/api/v1/events/admin/:id", ({ params }) => {
        receivedId = String(params.id);
        return HttpResponse.json({ ok: true });
      }),
    );
    await expect(patchAdminEvent("token-1", FIXTURE_EVENT_ID, body)).resolves.toBeUndefined();
    expect(receivedId).toBe(FIXTURE_EVENT_ID);
  });

  it("throws on 500 with message", async () => {
    server.use(
      http.patch("*/api/v1/events/admin/:id", () =>
        HttpResponse.json({ message: "nope" }, { status: 500 }),
      ),
    );
    await expect(patchAdminEvent("token-1", FIXTURE_EVENT_ID, body)).rejects.toThrow(/nope/);
  });
});

describe("patchAdminEventActive", () => {
  it("resolves on success", async () => {
    let received: unknown = null;
    server.use(
      http.patch("*/api/v1/events/admin/:id", async ({ request }) => {
        received = await request.json();
        return HttpResponse.json({ ok: true });
      }),
    );
    await expect(
      patchAdminEventActive("token-1", FIXTURE_EVENT_ID, false),
    ).resolves.toBeUndefined();
    expect(received).toEqual({ isActive: false });
  });

  it("throws with status message on 500", async () => {
    server.use(
      http.patch("*/api/v1/events/admin/:id", () =>
        HttpResponse.json({ message: "nope" }, { status: 500 }),
      ),
    );
    await expect(
      patchAdminEventActive("token-1", FIXTURE_EVENT_ID, true),
    ).rejects.toThrow(/nope/);
  });
});
