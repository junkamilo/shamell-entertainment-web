import { describe, expect, it } from "vitest";
import { fetchAdminGalleryPhotos } from "../services/fetchAdminGalleryPhotos";
import { postAdminGalleryPhotos } from "../services/postAdminGalleryPhotos";
import {
  makeGalleryPhoto,
  makeGalleryPhotosApiPayload,
} from "./fixtures/gallery.fixture";
import { FIXTURE_PHOTO_ID } from "./fixtures/uuids.fixture";
import { createMockGalleryPageState } from "./helpers/mockGalleryPage";

describe("gallery test environment", () => {
  it("exposes usable fixtures and page mock", () => {
    expect(makeGalleryPhoto().id).toBe(FIXTURE_PHOTO_ID);
    expect(makeGalleryPhotosApiPayload()).toHaveLength(2);

    const page = createMockGalleryPageState({ isPhotoModalOpen: true });
    expect(page.isPhotoModalOpen).toBe(true);
    page.openPhotoModalForCreate();
    expect(page.openPhotoModalForCreate).toHaveBeenCalled();
  });

  it("serves gallery photos list and create via MSW", async () => {
    const list = await fetchAdminGalleryPhotos("token-1");
    expect(list[0]?.id).toBe(FIXTURE_PHOTO_ID);

    const body = new FormData();
    body.append("categoryId", list[0]!.category.id);
    body.append("media", new File(["x"], "a.jpg", { type: "image/jpeg" }));

    const created = await postAdminGalleryPhotos("token-1", body);
    expect(created.items[0]).toMatchObject({ id: FIXTURE_PHOTO_ID });
  });
});
