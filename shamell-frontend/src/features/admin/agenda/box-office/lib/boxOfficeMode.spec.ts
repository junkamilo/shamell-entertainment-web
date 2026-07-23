import { describe, expect, it } from "vitest";
import { parseBoxOfficeMode } from "./boxOfficeMode";

describe("parseBoxOfficeMode", () => {
  it("returns classes when raw is exactly 'classes'", () => {
    expect(parseBoxOfficeMode("classes")).toBe("classes");
  });

  it("returns fixed for null", () => {
    expect(parseBoxOfficeMode(null)).toBe("fixed");
  });

  it("returns fixed for the literal 'fixed'", () => {
    expect(parseBoxOfficeMode("fixed")).toBe("fixed");
  });

  it("returns fixed for any unrecognized value", () => {
    expect(parseBoxOfficeMode("bogus")).toBe("fixed");
    expect(parseBoxOfficeMode("")).toBe("fixed");
    expect(parseBoxOfficeMode("CLASSES")).toBe("fixed");
  });
});
