import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import {
  patchAdminServiceType,
  patchAdminServiceTypeActive,
} from "./patchAdminServiceType";
import { FIXTURE_SERVICE_TYPE_ID } from "../test/fixtures/uuids.fixture";

describe("patchAdminServiceType", () => {
  it("patches successfully", async () => {
    await expect(
      patchAdminServiceType("token-1", FIXTURE_SERVICE_TYPE_ID, {
        name: "Performance",
      }),
    ).resolves.toBeUndefined();
  });

  it("sends JSON body with bearer token", async () => {
    let auth: string | null = null;
    let received: unknown = null;
    let url = "";
    server.use(
      http.patch("*/api/v1/services/types/admin/:id", async ({ request }) => {
        auth = request.headers.get("Authorization");
        url = request.url;
        received = await request.json();
        return HttpResponse.json({ ok: true });
      }),
    );
    await patchAdminServiceType("token-1", FIXTURE_SERVICE_TYPE_ID, {
      name: "Updated",
    });
    expect(auth).toBe("Bearer token-1");
    expect(url).toContain(FIXTURE_SERVICE_TYPE_ID);
    expect(received).toEqual({ name: "Updated" });
  });

  it("throws on 500 with message", async () => {
    server.use(
      http.patch("*/api/v1/services/types/admin/:id", () =>
        HttpResponse.json({ message: "nope" }, { status: 500 }),
      ),
    );
    await expect(
      patchAdminServiceType("token-1", FIXTURE_SERVICE_TYPE_ID, {
        name: "Performance",
      }),
    ).rejects.toThrow(/nope/);
  });
});

describe("patchAdminServiceTypeActive", () => {
  it("patches isActive successfully", async () => {
    await expect(
      patchAdminServiceTypeActive("token-1", FIXTURE_SERVICE_TYPE_ID, false),
    ).resolves.toBeUndefined();
  });

  it("sends JSON body with bearer token", async () => {
    let received: unknown = null;
    server.use(
      http.patch("*/api/v1/services/types/admin/:id", async ({ request }) => {
        received = await request.json();
        return HttpResponse.json({ ok: true });
      }),
    );
    await patchAdminServiceTypeActive("token-1", FIXTURE_SERVICE_TYPE_ID, true);
    expect(received).toEqual({ isActive: true });
  });

  it("throws on 500 with message", async () => {
    server.use(
      http.patch("*/api/v1/services/types/admin/:id", () =>
        HttpResponse.json({ message: "nope" }, { status: 500 }),
      ),
    );
    await expect(
      patchAdminServiceTypeActive("token-1", FIXTURE_SERVICE_TYPE_ID, false),
    ).rejects.toThrow(/nope/);
  });
});
