import { describe, expect, it } from "vitest";
import { parseBookClassKind } from "./bookClassKind";

describe("parseBookClassKind", () => {
  it("returns group only for classKind=group", () => {
    expect(parseBookClassKind("group")).toBe("group");
  });

  it("defaults to private for anything else", () => {
    expect(parseBookClassKind("private")).toBe("private");
    expect(parseBookClassKind("other")).toBe("private");
    expect(parseBookClassKind("")).toBe("private");
    expect(parseBookClassKind(null)).toBe("private");
    expect(parseBookClassKind(undefined)).toBe("private");
  });
});
