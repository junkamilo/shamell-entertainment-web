import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import { fetchPublicVenueTables } from "./fetchPublicVenueTables";
import { FIXTURE_TABLE_CONFIG_ID } from "../test/fixtures/uuids.fixture";

describe("fetchPublicVenueTables", () => {
  it("loads mapped venue tables", async () => {
    const tables = await fetchPublicVenueTables();
    expect(tables[0]?.id).toBe(FIXTURE_TABLE_CONFIG_ID);
    expect(tables[0]?.bundlePrice).toBe(250);
  });

  it("returns empty array on non-ok response", async () => {
    server.use(
      http.get("*/api/v1/venue-tables", () =>
        HttpResponse.json({ message: "down" }, { status: 500 }),
      ),
    );
    await expect(fetchPublicVenueTables()).resolves.toEqual([]);
  });
});
