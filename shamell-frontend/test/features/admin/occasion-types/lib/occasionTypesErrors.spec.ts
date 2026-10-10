import { describe, expect, it } from "vitest";
import { parseOccasionTypesError } from "@/features/admin/occasion-types/lib/occasionTypesErrors";

describe("parseOccasionTypesError", () => {
  it("returns Nest message when present", () => {
    expect(parseOccasionTypesError({ message: "boom" }, "fallback")).toBe("boom");
  });

  it("returns fallback when message is missing", () => {
    expect(parseOccasionTypesError({}, "fallback")).toBe("fallback");
  });

  it("joins Nest validation message arrays", () => {
    expect(parseOccasionTypesError({ message: ["A", "B"] }, "fallback")).toBe("A B");
  });
});
