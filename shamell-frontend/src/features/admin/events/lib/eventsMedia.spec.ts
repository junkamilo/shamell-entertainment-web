import { describe, expect, it } from "vitest";
import { isCatalogMediaFile, isVideoCatalogItem, isVideoFile } from "./eventsMedia";

describe("eventsMedia", () => {
  describe("isVideoCatalogItem", () => {
    it("treats missing mediaType as image", () => {
      expect(isVideoCatalogItem({})).toBe(false);
    });

    it("detects video media types case-insensitively", () => {
      expect(isVideoCatalogItem({ mediaType: "VIDEO" })).toBe(true);
      expect(isVideoCatalogItem({ mediaType: "video" })).toBe(true);
      expect(isVideoCatalogItem({ mediaType: "IMAGE" })).toBe(false);
    });
  });

  describe("isVideoFile", () => {
    it("returns true only for video MIME types", () => {
      expect(isVideoFile(new File(["x"], "clip.mp4", { type: "video/mp4" }))).toBe(true);
      expect(isVideoFile(new File(["x"], "photo.jpg", { type: "image/jpeg" }))).toBe(false);
    });
  });

  describe("isCatalogMediaFile", () => {
    it("accepts image and video MIME types", () => {
      expect(isCatalogMediaFile(new File(["x"], "a.jpg", { type: "image/jpeg" }))).toBe(true);
      expect(isCatalogMediaFile(new File(["x"], "a.mp4", { type: "video/mp4" }))).toBe(true);
    });

    it("falls back to filename extension when MIME is empty or octet-stream", () => {
      expect(isCatalogMediaFile(new File(["x"], "photo.webp", { type: "" }))).toBe(true);
      expect(
        isCatalogMediaFile(new File(["x"], "clip.mov", { type: "application/octet-stream" })),
      ).toBe(true);
      expect(isCatalogMediaFile(new File(["x"], "notes.txt", { type: "" }))).toBe(false);
    });

    it("rejects unsupported MIME types", () => {
      expect(isCatalogMediaFile(new File(["x"], "a.pdf", { type: "application/pdf" }))).toBe(
        false,
      );
    });
  });
});
