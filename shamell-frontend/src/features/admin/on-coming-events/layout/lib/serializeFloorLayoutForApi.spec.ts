import { describe, expect, it } from "vitest";
import {
  serializeFloorLayoutPayloadForApi,
  serializePlacedLayoutItemForApi,
} from "./serializeFloorLayoutForApi";
import {
  makeCatalogTableItem,
  makeFloorLayout,
  makeStandaloneChairItem,
} from "../../test/fixtures/onComingEvents.fixture";

describe("serializeFloorLayoutForApi", () => {
  it("strips unitPrice from standalone chairs", () => {
    const item = makeStandaloneChairItem({ unitPrice: 35 });
    expect(serializePlacedLayoutItemForApi(item)).toEqual({
      id: item.id,
      kind: "standalone_chair",
      venueStandaloneChairId: item.venueStandaloneChairId,
      chairName: item.chairName,
      x: item.x,
      y: item.y,
      rotation: item.rotation,
    });
  });

  it("serializes layout payload with scene zones", () => {
    const layout = makeFloorLayout();
    const payload = serializeFloorLayoutPayloadForApi({
      viewBoxWidth: layout.viewBoxWidth,
      viewBoxHeight: layout.viewBoxHeight,
      backgroundVersion: layout.backgroundVersion,
      items: layout.items,
      sceneZones: layout.sceneZones,
    });
    expect(payload.items).toHaveLength(2);
    expect(payload.sceneZones).toEqual(layout.sceneZones);
  });
});
