import { describe, expect, it } from "vitest";
import {
  DESCRIPTION_MAX_LENGTH,
  DESCRIPTION_MIN_LENGTH,
  EVENT_NAME_MAX_LENGTH,
  EVENT_NAME_MIN_LENGTH,
  ITEM_MAX_LENGTH,
  MAX_CATALOG_IMAGES,
  PAGE_SIZE,
  TYPE_PILL_STYLES,
} from "./eventsConstants";

describe("eventsConstants", () => {
  it("exposes name and description length bounds", () => {
    expect(EVENT_NAME_MIN_LENGTH).toBe(2);
    expect(EVENT_NAME_MAX_LENGTH).toBe(200);
    expect(DESCRIPTION_MIN_LENGTH).toBe(10);
    expect(DESCRIPTION_MAX_LENGTH).toBe(5000);
  });

  it("exposes item, page, and catalog limits", () => {
    expect(ITEM_MAX_LENGTH).toBe(180);
    expect(PAGE_SIZE).toBe(6);
    expect(MAX_CATALOG_IMAGES).toBe(12);
  });

  it("exposes five type pill styles", () => {
    expect(TYPE_PILL_STYLES).toHaveLength(5);
  });
});
