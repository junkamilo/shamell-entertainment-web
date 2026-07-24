import { describe, expect, it } from "vitest";
import { makeHeaderPhoto } from "../test/fixtures/headerMedia.fixture";
import {
  clampPercent,
  fileKey,
  formatFileSize,
  headerLibraryItemIsVideo,
} from "./headerMediaUtils";

describe("headerMediaUtils", () => {
  it("formatFileSize formats bytes, KB, and MB", () => {
    expect(formatFileSize(500)).toBe("500 B");
    expect(formatFileSize(2048)).toBe("2.0 KB");
    expect(formatFileSize(2 * 1024 * 1024)).toBe("2.0 MB");
  });

  it("fileKey combines name size and lastModified", () => {
    const file = new File(["x"], "a.jpg", { type: "image/jpeg" });
    Object.defineProperty(file, "lastModified", { value: 123 });
    expect(fileKey(file)).toBe(`a.jpg-${file.size}-123`);
  });

  it("clampPercent clamps and rounds", () => {
    expect(clampPercent(-10)).toBe(0);
    expect(clampPercent(150)).toBe(100);
    expect(clampPercent(33.6)).toBe(34);
    expect(clampPercent(Number.NaN)).toBe(50);
  });

  it("headerLibraryItemIsVideo detects VIDEO mediaType and url", () => {
    expect(headerLibraryItemIsVideo(makeHeaderPhoto({ mediaType: "VIDEO" }))).toBe(true);
    expect(headerLibraryItemIsVideo(makeHeaderPhoto({ mediaType: "IMAGE" }))).toBe(false);
    expect(
      headerLibraryItemIsVideo(
        makeHeaderPhoto({
          mediaType: undefined,
          imageUrl: "https://cdn.example.com/clip.mp4",
        }),
      ),
    ).toBe(true);
  });
});
