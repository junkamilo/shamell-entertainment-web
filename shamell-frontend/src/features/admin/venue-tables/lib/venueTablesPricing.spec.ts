import { describe, expect, it } from "vitest";
import { comboSummaryLabel } from "./venueTablesPricing";

describe("venueTablesPricing", () => {
  it("formats combo summary with price and chairs", () => {
    expect(comboSummaryLabel("Large 1", 8, 250)).toMatch(
      /Combo:.*250.*Large 1 \+ 8 chairs included/,
    );
  });

  it("uses singular chair label for count of 1", () => {
    expect(comboSummaryLabel("Small 1", 1, 100)).toMatch(/1 chair included/);
  });

  it("shows em dash when price is null", () => {
    expect(comboSummaryLabel("Large 1", 6, null)).toContain("—");
  });
});
