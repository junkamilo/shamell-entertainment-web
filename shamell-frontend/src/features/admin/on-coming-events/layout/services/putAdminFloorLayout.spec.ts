import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import { putAdminFloorLayout } from "./putAdminFloorLayout";
import {
  makeFloorLayout,
  makeFloorLayoutApiPayload,
} from "../../test/fixtures/onComingEvents.fixture";
import { FIXTURE_LAYOUT_ID } from "../../test/fixtures/uuids.fixture";

const ROUTE = "*/api/v1/floor-layout/admin";

describe("putAdminFloorLayout", () => {
  it("saves layout and returns mapped result", async () => {
    const layout = makeFloorLayout();
    const result = await putAdminFloorLayout("token-1", {
      viewBoxWidth: layout.viewBoxWidth,
      viewBoxHeight: layout.viewBoxHeight,
      backgroundVersion: layout.backgroundVersion,
      items: layout.items,
      sceneZones: layout.sceneZones,
    });
    expect(result.ok).toBe(true);
    expect(result.layout?.id).toBe(FIXTURE_LAYOUT_ID);
  });

  it("serializes payload without read-only enrichments", async () => {
    let body: unknown;
    server.use(
      http.put(ROUTE, async ({ request }) => {
        body = await request.json();
        return HttpResponse.json(makeFloorLayoutApiPayload());
      }),
    );
    const layout = makeFloorLayout();
    await putAdminFloorLayout("token-1", {
      viewBoxWidth: layout.viewBoxWidth,
      viewBoxHeight: layout.viewBoxHeight,
      backgroundVersion: layout.backgroundVersion,
      items: layout.items,
      sceneZones: layout.sceneZones,
    });
    const chair = (body as { items: unknown[] }).items.find(
      (item) =>
        item &&
        typeof item === "object" &&
        (item as { kind?: string }).kind === "standalone_chair",
    ) as Record<string, unknown> | undefined;
    expect(chair).toBeDefined();
    expect(chair).not.toHaveProperty("unitPrice");
  });

  it("returns ok:false on API error", async () => {
    server.use(http.put(ROUTE, () => HttpResponse.json({}, { status: 500 })));
    const layout = makeFloorLayout();
    const result = await putAdminFloorLayout("token-1", {
      viewBoxWidth: layout.viewBoxWidth,
      viewBoxHeight: layout.viewBoxHeight,
      backgroundVersion: layout.backgroundVersion,
      items: layout.items,
    });
    expect(result.ok).toBe(false);
    expect(result.layout).toBeNull();
  });
});
