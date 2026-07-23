import { describe, expect, it } from "vitest";
import {
  NAME_MAX_LENGTH,
  NAME_MIN_LENGTH,
  NAME_REGEX,
  TYPE_ICONS,
} from "./eventTypesConstants";

describe("eventTypesConstants", () => {
  it("exposes name length bounds", () => {
    expect(NAME_MIN_LENGTH).toBe(2);
    expect(NAME_MAX_LENGTH).toBe(100);
  });

  it("accepts typical event type names", () => {
    expect(NAME_REGEX.test("Private weddings")).toBe(true);
  });

  it("exposes eight type icons", () => {
    expect(TYPE_ICONS).toHaveLength(8);
  });
});
