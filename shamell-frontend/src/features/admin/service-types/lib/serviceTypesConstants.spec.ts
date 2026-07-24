import { describe, expect, it } from "vitest";
import {
  NAME_MAX_LENGTH,
  NAME_MIN_LENGTH,
  NAME_REGEX,
  TYPE_ICONS,
} from "./serviceTypesConstants";

describe("serviceTypesConstants", () => {
  it("exposes name length bounds", () => {
    expect(NAME_MIN_LENGTH).toBe(2);
    expect(NAME_MAX_LENGTH).toBe(100);
  });

  it("NAME_REGEX accepts common service type names", () => {
    expect(NAME_REGEX.test("Weddings")).toBe(true);
    expect(NAME_REGEX.test("A")).toBe(true);
    expect(NAME_REGEX.test("Café & Noches")).toBe(true);
  });

  it("NAME_REGEX rejects invalid characters", () => {
    expect(NAME_REGEX.test("Bad@Name")).toBe(false);
    expect(NAME_REGEX.test("Type 1")).toBe(false);
  });

  it("exposes eight type icons", () => {
    expect(TYPE_ICONS).toHaveLength(8);
  });
});
