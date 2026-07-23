import { describe, expect, it } from "vitest";
import {
  DESCRIPTION_MAX_LENGTH,
  DESCRIPTION_MIN_LENGTH,
  ITEM_MAX_LENGTH,
  PAGE_SIZE,
  TYPE_PILL_STYLES,
} from "./servicesConstants";

describe("servicesConstants", () => {
  it("exposes description and item length bounds", () => {
    expect(DESCRIPTION_MIN_LENGTH).toBe(10);
    expect(DESCRIPTION_MAX_LENGTH).toBe(5000);
    expect(ITEM_MAX_LENGTH).toBe(180);
  });

  it("exposes page size and four type pill styles", () => {
    expect(PAGE_SIZE).toBe(6);
    expect(TYPE_PILL_STYLES).toHaveLength(4);
  });
});
