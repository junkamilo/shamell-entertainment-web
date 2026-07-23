import { describe, expect, it } from "vitest";
import { parseEventTypesError } from "./eventTypesErrors";

describe("parseEventTypesError", () => {
  it("returns Nest message when present", () => {
    expect(parseEventTypesError({ message: "boom" }, "fallback")).toBe("boom");
  });

  it("returns fallback when message is missing", () => {
    expect(parseEventTypesError({}, "fallback")).toBe("fallback");
  });
});
