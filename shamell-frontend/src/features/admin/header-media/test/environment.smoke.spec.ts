import { describe, expect, it } from "vitest";
import { fetchAdminHeaderPhotos } from "../services/fetchAdminHeaderPhotos";
import { postAdminHeaderPhotos } from "../services/postAdminHeaderPhotos";
import {
  makeHeaderPhoto,
  makeHeaderPhotosApiPayload,
} from "./fixtures/headerMedia.fixture";
import { FIXTURE_HEADER_PHOTO_ID } from "./fixtures/uuids.fixture";
import { createMockHeaderMediaPageState } from "./helpers/mockHeaderMediaPage";

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
