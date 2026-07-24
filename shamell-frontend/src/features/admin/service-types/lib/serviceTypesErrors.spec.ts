import { describe, expect, it } from "vitest";
import { parseServiceTypesError } from "./serviceTypesErrors";

describe("parseServiceTypesError", () => {
  it("returns Nest message when present", () => {
    expect(parseServiceTypesError({ message: "boom" }, "fallback")).toBe("boom");
  });

  it("returns fallback when message is missing", () => {
    expect(parseServiceTypesError({}, "fallback")).toBe("fallback");
  });

  it("joins Nest validation message arrays", () => {
    expect(parseServiceTypesError({ message: ["A", "B"] }, "fallback")).toBe(
      "A B",
    );
  });
});
