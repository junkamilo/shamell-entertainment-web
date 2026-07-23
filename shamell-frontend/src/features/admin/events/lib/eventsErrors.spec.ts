import { describe, expect, it } from "vitest";
import { parseEventsError } from "./eventsErrors";

describe("parseEventsError", () => {
  it("returns Nest message when present", () => {
    expect(parseEventsError({ message: "boom" }, "fallback")).toBe("boom");
  });

  it("returns fallback when message is missing", () => {
    expect(parseEventsError({}, "fallback")).toBe("fallback");
  });

  it("joins Nest validation message arrays", () => {
    expect(parseEventsError({ message: ["A", "B"] }, "fallback")).toBe("A B");
  });
});
