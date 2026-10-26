import { describe, expect, it } from "vitest";
import { fetchAdminHeaderPhotos } from "@/features/admin/header-media/services/fetchAdminHeaderPhotos";
import { postAdminHeaderPhotos } from "@/features/admin/header-media/services/postAdminHeaderPhotos";
import {
  makeHeaderPhoto,
  makeHeaderPhotosApiPayload,
} from "@test/features/admin/header-media/support/fixtures/headerMedia.fixture";
import { FIXTURE_HEADER_PHOTO_ID } from "@test/features/admin/header-media/support/fixtures/uuids.fixture";
import { createMockHeaderMediaPageState } from "@test/features/admin/header-media/support/helpers/mockHeaderMediaPage";

describe("header-media test environment", () => {
  it("exposes usable fixtures and page mock", () => {
    expect(makeHeaderPhoto().id).toBe(FIXTURE_HEADER_PHOTO_ID);
    expect(makeHeaderPhotosApiPayload()).toHaveLength(2);

    const page = createMockHeaderMediaPageState({ isSaving: true });
    expect(page.isSaving).toBe(true);
    page.upload.onPickFiles();
    expect(page.upload.onPickFiles).toHaveBeenCalled();
  });

  it("serves header photos list and upload via MSW", async () => {
    const list = await fetchAdminHeaderPhotos("token-1");
    expect(list[0]?.id).toBe(FIXTURE_HEADER_PHOTO_ID);

    await expect(
      postAdminHeaderPhotos("token-1", [
        new File(["x"], "a.jpg", { type: "image/jpeg" }),
      ]),
    ).resolves.toBeUndefined();
  });
});
