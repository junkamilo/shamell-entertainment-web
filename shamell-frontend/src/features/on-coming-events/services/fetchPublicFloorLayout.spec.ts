import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import { fetchPublicFloorLayout } from "./fetchPublicFloorLayout";
import { FIXTURE_LAYOUT_ITEM_ID } from "../test/fixtures/uuids.fixture";

describe("fetchPublicFloorLayout", () => {
  it("loads mapped floor layout", async () => {
    const layout = await fetchPublicFloorLayout();
    expect(layout?.items[0]?.id).toBe(FIXTURE_LAYOUT_ITEM_ID);
    expect(layout?.items[0]?.kind).toBe("catalog_table");
  });

  it("returns null on non-ok response", async () => {
    server.use(
      http.get("*/api/v1/floor-layout", () =>
        HttpResponse.json({ message: "down" }, { status: 500 }),
      ),
    );
    await expect(fetchPublicFloorLayout()).resolves.toBeNull();
  });
});
