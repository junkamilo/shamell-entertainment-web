/** @vitest-environment jsdom */

import { describe, expect, it } from "vitest";
import {
  inferAboutHeroIsVideo,
  isAboutHeroVideoDisplay,
  isAboutHeroVideoFile,
} from "./aboutHeroMedia";
import { FIXTURE_CLOUDINARY_VIDEO } from "./test/fixtures/uuids.fixture";

describe("aboutHeroMedia", () => {
  it("infers VIDEO from heroMediaType or Cloudinary video URLs", () => {
    expect(inferAboutHeroIsVideo({ heroMediaType: "VIDEO" })).toBe(true);
    expect(
      inferAboutHeroIsVideo({
        heroMediaType: "IMAGE",
        imageUrl: FIXTURE_CLOUDINARY_VIDEO,
      }),
    ).toBe(true);
    expect(
      inferAboutHeroIsVideo({
        heroMediaType: "IMAGE",
        imageUrl: "https://cdn.example.com/photo.jpg",
      }),
    ).toBe(false);
  });

  it("detects video files and display modes", () => {
    const videoFile = new File(["x"], "clip.mp4", { type: "video/mp4" });
    const imageFile = new File(["x"], "shot.jpg", { type: "image/jpeg" });
    expect(isAboutHeroVideoFile(videoFile)).toBe(true);
    expect(isAboutHeroVideoFile(imageFile)).toBe(false);
    expect(isAboutHeroVideoFile(null)).toBe(false);

    expect(isAboutHeroVideoDisplay({ file: videoFile })).toBe(true);
    expect(
      isAboutHeroVideoDisplay({
        heroMediaType: "VIDEO",
        file: null,
      }),
    ).toBe(true);
    expect(
      isAboutHeroVideoDisplay({
        heroMediaType: "IMAGE",
        imageUrl: "https://cdn.example.com/x.jpg",
      }),
    ).toBe(false);
  });
});
