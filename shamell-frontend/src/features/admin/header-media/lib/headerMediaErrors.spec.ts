import { describe, expect, it } from "vitest";
import { parseHeaderMediaError } from "./headerMediaErrors";

describe("parseHeaderMediaError", () => {
  it("returns Nest message when present", () => {
    expect(parseHeaderMediaError({ message: "boom" }, "fallback")).toBe("boom");
  });

  it("returns fallback when message is missing", () => {
    expect(parseHeaderMediaError({}, "fallback")).toBe("fallback");
  });

  it("joins Nest validation message arrays", () => {
    expect(parseHeaderMediaError({ message: ["A", "B"] }, "fallback")).toBe("A B");
  });
});
