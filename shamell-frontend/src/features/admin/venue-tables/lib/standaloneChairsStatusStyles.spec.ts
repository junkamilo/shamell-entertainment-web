import { describe, expect, it } from "vitest";
import {
  standaloneChairRowClassName,
  standaloneChairStatusBadgeClass,
  standaloneChairStatusLabel,
} from "./standaloneChairsStatusStyles";

describe("standaloneChairsStatusStyles", () => {
  it("returns Available label for unreserved chairs", () => {
    expect(standaloneChairStatusLabel(false)).toBe("Available");
  });

  it("returns Reserved label for reserved chairs", () => {
    expect(standaloneChairStatusLabel(true)).toBe("Reserved");
  });

  it("uses gold styling for available chairs", () => {
    expect(standaloneChairStatusBadgeClass(false)).toContain("gold");
  });

  it("uses emerald styling for reserved chairs", () => {
    expect(standaloneChairStatusBadgeClass(true)).toContain("emerald");
    expect(standaloneChairRowClassName(true)).toContain("emerald");
  });

  it("returns empty row class for available chairs", () => {
    expect(standaloneChairRowClassName(false)).toBe("");
  });
});
