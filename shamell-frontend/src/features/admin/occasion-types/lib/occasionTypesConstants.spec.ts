import { describe, expect, it } from "vitest";
import { NAME_MAX_LENGTH, NAME_MIN_LENGTH, NAME_REGEX } from "./occasionTypesConstants";

describe("occasionTypesConstants", () => {
  it("exposes name length bounds", () => {
    expect(NAME_MIN_LENGTH).toBe(2);
    expect(NAME_MAX_LENGTH).toBe(120);
  });

  it("NAME_REGEX accepts common occasion names", () => {
    expect(NAME_REGEX.test("Luxury birthday")).toBe(true);
    expect(NAME_REGEX.test("A")).toBe(true);
    expect(NAME_REGEX.test("Café & Noches")).toBe(true);
  });

  it("NAME_REGEX rejects invalid characters", () => {
    expect(NAME_REGEX.test("Bad@Name")).toBe(false);
  });
});
