import type { PlacedLayoutItem } from "@/components/floor-layout/layoutTypes";
import { buildChairInstancesFromItems } from "./chairInstanceBuilder";

describe("buildChairInstancesFromItems", () => {
  const viewBoxWidth = 1000;
  const viewBoxHeight = 800;

  it("builds one instance per standalone chair", () => {
    const items: PlacedLayoutItem[] = [
      {
        id: "chair-1",
        kind: "standalone_chair",
        venueStandaloneChairId: "cfg-1",
        chairName: "Chair 1",
        x: 100,
        y: 200,
        rotation: 0,
      },
    ];

    const instances = buildChairInstancesFromItems(
      items,
      viewBoxWidth,
      viewBoxHeight,
      null,
      new Set(),
    );

    expect(instances).toHaveLength(1);
    expect(instances[0]?.state).toBe("available");
  });

  it("marks reserved standalone chairs as reserved", () => {
    const items: PlacedLayoutItem[] = [
      {
        id: "chair-2",
        kind: "standalone_chair",
        venueStandaloneChairId: "cfg-2",
        chairName: "Chair 2",
        x: 100,
        y: 200,
        rotation: 90,
      },
    ];

    const instances = buildChairInstancesFromItems(
      items,
      viewBoxWidth,
      viewBoxHeight,
      null,
      new Set(["chair-2"]),
    );

    expect(instances).toHaveLength(1);
    expect(instances[0]?.state).toBe("reserved");
  });

  it("builds included chairs for catalog tables with shared state", () => {
    const items: PlacedLayoutItem[] = [
      {
        id: "table-1",
        kind: "catalog_table",
        venueTableConfigId: "tbl-1",
        size: "SMALL",
        includedChairs: 4,
        tableName: "Small 1",
        x: 500,
        y: 400,
        rotation: 0,
      },
    ];

    const instances = buildChairInstancesFromItems(
      items,
      viewBoxWidth,
      viewBoxHeight,
      "table-1",
      new Set(),
    );

    expect(instances).toHaveLength(4);
    expect(instances.every((instance) => instance.state === "selected")).toBe(true);
  });
});
