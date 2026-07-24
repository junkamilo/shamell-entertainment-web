import { describe, expect, it } from "vitest";
import { GALLERY_CATEGORIES_PATH, GALLERY_PATH } from "./galleryRoutes";

describe("galleryRoutes", () => {
  it("exports gallery admin path", () => {
    expect(GALLERY_PATH).toBe("/admin/gallery");
  });

  it("exports gallery categories path", () => {
    expect(GALLERY_CATEGORIES_PATH).toBe("/admin/gallery-categories");
  });
});
