import { describe, expect, it } from "vitest";
import { buildConfirmDeleteLabel } from "./confirmDeleteLabel";

describe("buildConfirmDeleteLabel", () => {
  it("returns Untitled for empty input", () => {
    expect(buildConfirmDeleteLabel("   ")).toEqual({
      display: "Untitled",
      full: "Untitled",
      truncated: false,
    });
  });

  it("leaves short names unchanged", () => {
    expect(buildConfirmDeleteLabel("Salsa night")).toEqual({
      display: "Salsa night",
      full: "Salsa night",
      truncated: false,
    });
  });

  it("truncates long names at a word boundary", () => {
    const full =
      "This is a very long event name that should be shortened for the delete confirmation dialog display";
    const result = buildConfirmDeleteLabel(full, 40);
    expect(result.truncated).toBe(true);
    expect(result.full).toBe(full.replace(/\s+/g, " ").trim());
    expect(result.display.endsWith("…")).toBe(true);
    expect(result.display.length).toBeLessThanOrEqual(41);
  });
});
