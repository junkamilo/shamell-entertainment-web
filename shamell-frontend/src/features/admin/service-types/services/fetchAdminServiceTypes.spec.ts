import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import { fetchAdminServiceTypes } from "./fetchAdminServiceTypes";
import { FIXTURE_SERVICE_TYPE_ID } from "../test/fixtures/uuids.fixture";
import { serviceTypesListHandler } from "../test/mocks/handlers";

describe("fetchAdminServiceTypes", () => {
  it("loads the service types list", async () => {
    server.use(serviceTypesListHandler());
    const result = await fetchAdminServiceTypes("token-1");
    expect(result[0]?.id).toBe(FIXTURE_SERVICE_TYPE_ID);
    expect(result.length).toBeGreaterThan(0);
  });

  it("sends bearer token", async () => {
    let auth: string | null = null;
    server.use(
      http.get("*/api/v1/services/types/admin", ({ request }) => {
        auth = request.headers.get("Authorization");
        return HttpResponse.json([]);
      }),
    );
    await fetchAdminServiceTypes("token-1");
    expect(auth).toBe("Bearer token-1");
  });

  it("throws on 500 with message", async () => {
    server.use(
      http.get("*/api/v1/services/types/admin", () =>
        HttpResponse.json({ message: "nope" }, { status: 500 }),
      ),
    );
    await expect(fetchAdminServiceTypes("token-1")).rejects.toThrow(/nope/);
  });
});
