import { describe, expect, it } from "vitest";
import { FIXTURE_CATEGORY_ID } from "../test/fixtures/uuids.fixture";
import { buildGalleryPhotoFormData } from "./galleryFormUtils";

describe("buildGalleryPhotoFormData", () => {
  it("appends categoryId and all files when creating", () => {
    const files = [
      new File(["a"], "a.jpg", { type: "image/jpeg" }),
      new File(["b"], "b.jpg", { type: "image/jpeg" }),
    ];
    const body = buildGalleryPhotoFormData({
      categoryId: FIXTURE_CATEGORY_ID,
      files,
      editingId: null,
    });

    expect(body.get("categoryId")).toBe(FIXTURE_CATEGORY_ID);
    expect(body.getAll("media")).toHaveLength(2);
  });

  it("appends only the first file when editing", () => {
    const files = [
      new File(["a"], "a.jpg", { type: "image/jpeg" }),
      new File(["b"], "b.jpg", { type: "image/jpeg" }),
    ];
    const body = buildGalleryPhotoFormData({
      categoryId: FIXTURE_CATEGORY_ID,
      files,
      editingId: "photo-1",
    });

    expect(body.get("categoryId")).toBe(FIXTURE_CATEGORY_ID);
    expect(body.getAll("media")).toHaveLength(1);
    expect((body.get("media") as File).name).toBe("a.jpg");
  });

  it("omits media when editing with no files", () => {
    const body = buildGalleryPhotoFormData({
      categoryId: FIXTURE_CATEGORY_ID,
      files: [],
      editingId: "photo-1",
    });

    expect(body.get("categoryId")).toBe(FIXTURE_CATEGORY_ID);
    expect(body.getAll("media")).toHaveLength(0);
  });
});
