import { describe, it, expect } from "vitest";
import { formatSectionTime, inputClass } from "./bookClassDisplay";

describe("bookClassDisplay", () => {
  it("exports a non-empty input class string", () => {
    expect(inputClass.length).toBeGreaterThan(10);
    expect(inputClass).toContain("rounded-lg");
  });

  it("formats a section time range in en-US 12-hour style", () => {
    const formatted = formatSectionTime("18:00", "19:15");
    expect(formatted).toMatch(/6:00\s*PM/i);
    expect(formatted).toMatch(/7:15\s*PM/i);
    expect(formatted).toContain("–");
  });
});
