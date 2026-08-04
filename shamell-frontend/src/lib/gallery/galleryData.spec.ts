import { describe, expect, it } from "vitest";
import {
  galleryItems,
  galleryTabs,
  type GalleryCategory,
  type GalleryFilter,
} from "./galleryData";

const CATEGORIES: GalleryCategory[] = [
  "fire",
  "sword-candelabra",
  "veil",
  "clients",
];

describe("galleryData", () => {
  it("exposes tabs with all plus each category", () => {
    const ids = galleryTabs.map((t) => t.id);
    expect(ids[0]).toBe("all");
    for (const category of CATEGORIES) {
      expect(ids).toContain(category);
    }
    expect(galleryTabs.every((t) => typeof t.label === "string" && t.label)).toBe(
      true,
    );
  });

  it("exposes fallback items with unique ids and valid categories", () => {
    const ids = galleryItems.map((item) => item.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(galleryItems.length).toBe(32);

    for (const item of galleryItems) {
      expect(CATEGORIES).toContain(item.category);
      expect(item.alt.length).toBeGreaterThan(0);
      expect(item.src).toBeTruthy();
    }
  });

  it("covers every category with at least one item", () => {
    for (const category of CATEGORIES) {
      expect(
        galleryItems.some((item) => item.category === category),
      ).toBe(true);
    }
  });

  it("types GalleryFilter as all or a category", () => {
    const filters: GalleryFilter[] = ["all", ...CATEGORIES];
    expect(filters).toHaveLength(5);
  });
});
