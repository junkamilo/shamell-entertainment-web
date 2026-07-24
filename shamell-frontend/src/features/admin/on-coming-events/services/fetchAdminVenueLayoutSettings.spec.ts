import { afterEach, describe, expect, it, vi } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import { fetchAdminVenueLayoutSettings } from "./fetchAdminVenueLayoutSettings";
import { FIXTURE_SETTINGS_ID } from "../test/fixtures/uuids.fixture";

const ROUTE = "*/api/v1/on-coming-events/settings/admin";

describe("fetchAdminVenueLayoutSettings", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("loads normalized settings on success", async () => {
    const result = await fetchAdminVenueLayoutSettings("token-1");
    expect(result.ok).toBe(true);
    expect(result.status).toBe(200);
    expect(result.settings?.id).toBe(FIXTURE_SETTINGS_ID);
    expect(result.settings?.clientEnabled).toBe(true);
  });

  it("sends bearer token", async () => {
    let auth: string | null = null;
    server.use(
      http.get(ROUTE, ({ request }) => {
        auth = request.headers.get("Authorization");
        return HttpResponse.json({ settings: { clientEnabled: true } });
      }),
    );
    await fetchAdminVenueLayoutSettings("token-1");
    expect(auth).toBe("Bearer token-1");
  });

  it("returns ok:false on API error", async () => {
    server.use(
      http.get(ROUTE, () => HttpResponse.json({ message: "nope" }, { status: 500 })),
    );
    const result = await fetchAdminVenueLayoutSettings("token-1");
    expect(result).toEqual({ ok: false, settings: null, status: 500 });
  });

  it("returns ok:false when offline", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("network down");
      }),
    );
    const result = await fetchAdminVenueLayoutSettings("token-1");
    expect(result).toEqual({ ok: false, settings: null, status: 0 });
  });
});
