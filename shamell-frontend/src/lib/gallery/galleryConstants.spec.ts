import { describe, expect, it } from "vitest";
import {
  GALLERY_CATCHALL_SLUG,
  GALLERY_UPLOAD_MAX_FILES,
} from "./galleryConstants";
import {
  FIXTURE_GALLERY_CATCHALL_SLUG,
  FIXTURE_GALLERY_UPLOAD_MAX_FILES,
} from "./test/fixtures/uuids.fixture";

describe("galleryConstants", () => {
  it("exposes the catch-all album slug used by backend and public tabs", () => {
    expect(GALLERY_CATCHALL_SLUG).toBe(FIXTURE_GALLERY_CATCHALL_SLUG);
    expect(GALLERY_CATCHALL_SLUG).toBe("gallery-all");
  });

  it("exposes the upload max that must match the backend limit", () => {
    expect(GALLERY_UPLOAD_MAX_FILES).toBe(FIXTURE_GALLERY_UPLOAD_MAX_FILES);
    expect(GALLERY_UPLOAD_MAX_FILES).toBe(20);
  });
});
