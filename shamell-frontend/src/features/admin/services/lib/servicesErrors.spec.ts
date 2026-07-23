import { describe, expect, it } from "vitest";
import { parseServicesError } from "./servicesErrors";

describe("parseServicesError", () => {
  it("returns Nest message when present", () => {
    expect(parseServicesError({ message: "boom" }, "fallback")).toBe("boom");
  });

  it("returns fallback when message is missing", () => {
    expect(parseServicesError({}, "fallback")).toBe("fallback");
  });
});
