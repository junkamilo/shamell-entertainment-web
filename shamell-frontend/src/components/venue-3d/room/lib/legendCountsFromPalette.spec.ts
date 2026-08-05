import { describe, expect, it } from "vitest";
import { legendCountsFromPalette } from "./legendCountsFromPalette";

describe("legendCountsFromPalette", () => {
  it("reads from palette when present", () => {
    expect(
      legendCountsFromPalette({
        tablesBySize: { LARGE: 2, MEDIUM: 3, SMALL: 1 },
        standaloneChairsAvailable: 4,
        unplacedTables: [],
        unplacedChairs: [],
      }),
    ).toEqual({ large: 2, medium: 3, small: 1, chairs: 4 });
  });

  it("falls back to placed summary", () => {
    expect(
      legendCountsFromPalette(null, {
        large: 1,
        medium: 0,
        small: 2,
        chairs: 5,
      }),
    ).toEqual({ large: 1, medium: 0, small: 2, chairs: 5 });
  });
});
