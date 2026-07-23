import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import { patchAdminEventType, patchAdminEventTypeActive } from "./patchAdminEventType";
import {
  FIXTURE_EVENT_TYPE_ID,
  FIXTURE_OCCASION_ID,
} from "../test/fixtures/uuids.fixture";

const body = {
  name: "Private weddings",
  occasions: [{ occasionTypeId: FIXTURE_OCCASION_ID, usage: "OCCASION_SINGLE" as const }],
};

describe("patchAdminEventType", () => {
  it("resolves for upsert patch", async () => {
    let receivedId = "";
    server.use(
      http.patch("*/api/v1/events/types/admin/:id", ({ params }) => {
        receivedId = String(params.id);
        return HttpResponse.json({ ok: true });
      }),
    );
    await expect(
      patchAdminEventType("token-1", FIXTURE_EVENT_TYPE_ID, body),
    ).resolves.toBeUndefined();
    expect(receivedId).toBe(FIXTURE_EVENT_TYPE_ID);
  });

  it("throws on 500 with message", async () => {
    server.use(
      http.patch("*/api/v1/events/types/admin/:id", () =>
        HttpResponse.json({ message: "nope" }, { status: 500 }),
      ),
    );
    await expect(
      patchAdminEventType("token-1", FIXTURE_EVENT_TYPE_ID, body),
    ).rejects.toThrow(/nope/);
  });
});

describe("patchAdminEventTypeActive", () => {
  it("resolves on success", async () => {
    await expect(
      patchAdminEventTypeActive("token-1", FIXTURE_EVENT_TYPE_ID, false),
    ).resolves.toBeUndefined();
  });

  it("throws with status message on 500", async () => {
    server.use(
      http.patch("*/api/v1/events/types/admin/:id", () =>
        HttpResponse.json({ message: "nope" }, { status: 500 }),
      ),
    );
    await expect(
      patchAdminEventTypeActive("token-1", FIXTURE_EVENT_TYPE_ID, true),
    ).rejects.toThrow(/nope/);
  });
});
