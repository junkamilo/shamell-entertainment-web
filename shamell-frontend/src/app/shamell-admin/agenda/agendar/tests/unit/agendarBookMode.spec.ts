import { describe, expect, it } from "vitest";
import { parseAgendarBookMode } from "../../lib/agendarBookMode";

describe("parseAgendarBookMode", () => {
  it("returns class when mode=class and not editing", () => {
    expect(parseAgendarBookMode("class", false)).toBe("class");
  });

  it("returns event by default", () => {
    expect(parseAgendarBookMode(null, false)).toBe("event");
    expect(parseAgendarBookMode("event", false)).toBe("event");
    expect(parseAgendarBookMode("other", false)).toBe("event");
  });

  it("forces event in edit mode regardless of mode param", () => {
    expect(parseAgendarBookMode("class", true)).toBe("event");
    expect(parseAgendarBookMode(null, true)).toBe("event");
  });
});
