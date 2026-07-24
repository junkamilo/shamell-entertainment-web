import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import {
  patchAdminOccasionType,
  patchAdminOccasionTypeActive,
} from "./patchAdminOccasionType";
import { FIXTURE_OCCASION_TYPE_ID } from "../test/fixtures/uuids.fixture";

describe("patchAdminOccasionType", () => {
  it("patches successfully", async () => {
    await expect(
      patchAdminOccasionType("token-1", FIXTURE_OCCASION_TYPE_ID, {
        name: "Birthday",
      }),
    ).resolves.toBeUndefined();
  });

  it("sends JSON body with bearer token", async () => {
    let auth: string | null = null;
    let received: unknown = null;
    let url = "";
    server.use(
      http.patch("*/api/v1/events/occasions/admin/:id", async ({ request }) => {
        auth = request.headers.get("Authorization");
        url = request.url;
        received = await request.json();
        return HttpResponse.json({ ok: true });
      }),
    );
    await patchAdminOccasionType("token-1", FIXTURE_OCCASION_TYPE_ID, {
      name: "Updated",
    });
    expect(auth).toBe("Bearer token-1");
    expect(url).toContain(FIXTURE_OCCASION_TYPE_ID);
    expect(received).toEqual({ name: "Updated" });
  });

  it("throws on 500 with message", async () => {
    server.use(
      http.patch("*/api/v1/events/occasions/admin/:id", () =>
        HttpResponse.json({ message: "nope" }, { status: 500 }),
      ),
    );
    await expect(
      patchAdminOccasionType("token-1", FIXTURE_OCCASION_TYPE_ID, {
        name: "Birthday",
      }),
    ).rejects.toThrow(/nope/);
  });
});

describe("patchAdminOccasionTypeActive", () => {
  it("patches isActive successfully", async () => {
    await expect(
      patchAdminOccasionTypeActive("token-1", FIXTURE_OCCASION_TYPE_ID, false),
    ).resolves.toBeUndefined();
  });

  it("sends JSON body with bearer token", async () => {
    let received: unknown = null;
    server.use(
      http.patch("*/api/v1/events/occasions/admin/:id", async ({ request }) => {
        received = await request.json();
        return HttpResponse.json({ ok: true });
      }),
    );
    await patchAdminOccasionTypeActive("token-1", FIXTURE_OCCASION_TYPE_ID, true);
    expect(received).toEqual({ isActive: true });
  });

  it("throws on 500 with message", async () => {
    server.use(
      http.patch("*/api/v1/events/occasions/admin/:id", () =>
        HttpResponse.json({ message: "nope" }, { status: 500 }),
      ),
    );
    await expect(
      patchAdminOccasionTypeActive("token-1", FIXTURE_OCCASION_TYPE_ID, false),
    ).rejects.toThrow(/nope/);
  });
});
