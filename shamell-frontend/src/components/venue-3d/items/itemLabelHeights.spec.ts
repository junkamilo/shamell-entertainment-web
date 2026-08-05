import { describe, expect, it } from "vitest";
import { itemLabelHeights } from "./itemLabelHeights";

describe("itemLabelHeights", () => {
  it("matches catalog table heights", () => {
    expect(itemLabelHeights("catalog_table", false)).toEqual({
      reservedBubbleHeight: 1.35,
      numberBubbleHeight: 0.95,
    });
    expect(itemLabelHeights("catalog_table", true)).toEqual({
      reservedBubbleHeight: 1.35,
      numberBubbleHeight: 0.72,
    });
  });

  it("matches standalone chair heights", () => {
    expect(itemLabelHeights("standalone_chair", false)).toEqual({
      reservedBubbleHeight: 1.05,
      numberBubbleHeight: 0.75,
    });
    expect(itemLabelHeights("standalone_chair", true)).toEqual({
      reservedBubbleHeight: 1.05,
      numberBubbleHeight: 0.58,
    });
  });
});
