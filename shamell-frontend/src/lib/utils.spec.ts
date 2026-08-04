import { describe, expect, it } from "vitest";
import { makeCnClassList } from "./test/fixtures/sharedLib.fixture";
import { cn } from "./utils";

describe("cn", () => {
  it("merges class names", () => {
    expect(cn("text-sm", "font-bold")).toBe("text-sm font-bold");
  });

  it("dedupes conflicting Tailwind utilities via twMerge", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
  });

  it("ignores falsy conditional classes", () => {
    expect(cn(...makeCnClassList())).toBe("px-4 text-sm");
  });
});
