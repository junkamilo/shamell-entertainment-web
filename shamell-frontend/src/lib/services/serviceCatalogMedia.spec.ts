import { describe, expect, it } from "vitest";
import {
  FIXTURE_CATALOG_IMAGE_URL,
  FIXTURE_CATALOG_MP4_URL,
  FIXTURE_CATALOG_VIDEO_FETCH_URL,
  FIXTURE_CATALOG_VIDEO_UPLOAD_URL,
} from "./test/fixtures/uuids.fixture";
import {
  isVideoMediaFile,
  serviceCatalogMediaTypeFromUrl,
} from "./serviceCatalogMedia";

describe("serviceCatalogMediaTypeFromUrl", () => {
  it("returns undefined for empty values", () => {
    expect(serviceCatalogMediaTypeFromUrl(null)).toBeUndefined();
    expect(serviceCatalogMediaTypeFromUrl(undefined)).toBeUndefined();
    expect(serviceCatalogMediaTypeFromUrl("")).toBeUndefined();
    expect(serviceCatalogMediaTypeFromUrl("   ")).toBeUndefined();
  });

  it("detects Cloudinary video upload and fetch paths", () => {
    expect(serviceCatalogMediaTypeFromUrl(FIXTURE_CATALOG_VIDEO_UPLOAD_URL)).toBe(
      "VIDEO",
    );
    expect(serviceCatalogMediaTypeFromUrl(FIXTURE_CATALOG_VIDEO_FETCH_URL)).toBe(
      "VIDEO",
    );
  });

  it("detects common video extensions", () => {
    expect(serviceCatalogMediaTypeFromUrl(FIXTURE_CATALOG_MP4_URL)).toBe("VIDEO");
    expect(serviceCatalogMediaTypeFromUrl("https://cdn.example.com/a.webm")).toBe(
      "VIDEO",
    );
    expect(
      serviceCatalogMediaTypeFromUrl("https://cdn.example.com/a.mov?token=1"),
    ).toBe("VIDEO");
  });

  it("treats other URLs as IMAGE", () => {
    expect(serviceCatalogMediaTypeFromUrl(FIXTURE_CATALOG_IMAGE_URL)).toBe(
      "IMAGE",
    );
    expect(serviceCatalogMediaTypeFromUrl("https://cdn.example.com/a.png")).toBe(
      "IMAGE",
    );
  });
});

describe("isVideoMediaFile", () => {
  it("returns true for video/* MIME types", () => {
    expect(
      isVideoMediaFile(new File([], "clip.mp4", { type: "video/mp4" })),
    ).toBe(true);
  });

  it("returns false for non-video MIME types", () => {
    expect(
      isVideoMediaFile(new File([], "photo.jpg", { type: "image/jpeg" })),
    ).toBe(false);
  });
});
