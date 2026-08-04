import { describe, expect, it } from "vitest";
import {
  makeAboutApiPayload,
  makeAboutContentItem,
  makeAboutVideoContentItem,
} from "./test/fixtures/aboutLib.fixture";
import {
  FIXTURE_ABOUT_IMAGE,
  FIXTURE_ABOUT_TITLE,
  FIXTURE_ABOUT_VIDEO,
} from "./test/fixtures/uuids.fixture";
import {
  fallbackAboutContent,
  normalizeAboutPayload,
} from "./aboutContent";

describe("fallbackAboutContent", () => {
  it("exposes the default About marketing copy", () => {
    expect(fallbackAboutContent.title).toBe("ABOUT SHAMELL");
    expect(fallbackAboutContent.heroMediaType).toBe("IMAGE");
    expect(fallbackAboutContent.coreValues.length).toBeGreaterThan(0);
  });
});

describe("normalizeAboutPayload", () => {
  it("returns null for non-objects and incomplete payloads", () => {
    expect(normalizeAboutPayload(null)).toBeNull();
    expect(normalizeAboutPayload("x")).toBeNull();
    expect(normalizeAboutPayload({})).toBeNull();
    expect(
      normalizeAboutPayload({ title: "T", paragraph1: "P" }),
    ).toBeNull();
  });

  it("normalizes a valid IMAGE payload", () => {
    const normalized = normalizeAboutPayload(makeAboutApiPayload());
    expect(normalized).toEqual(
      expect.objectContaining({
        title: FIXTURE_ABOUT_TITLE,
        paragraph1: "API about body.",
        coreValues: ["Professionalism"],
        imageUrl: FIXTURE_ABOUT_IMAGE,
        heroMediaType: "IMAGE",
        videoDeliveryUrl: null,
        videoPosterUrl: null,
      }),
    );
  });

  it("normalizes VIDEO heroes and trims delivery URLs", () => {
    const normalized = normalizeAboutPayload(
      makeAboutApiPayload({
        heroMediaType: "VIDEO",
        imageUrl: null,
        videoDeliveryUrl: `  ${FIXTURE_ABOUT_VIDEO}  `,
        videoPosterUrl: "  https://cdn.example.com/p.jpg  ",
      }),
    );
    expect(normalized).toEqual(
      expect.objectContaining({
        heroMediaType: "VIDEO",
        videoDeliveryUrl: FIXTURE_ABOUT_VIDEO,
        videoPosterUrl: "https://cdn.example.com/p.jpg",
        imageUrl: null,
      }),
    );
  });

  it("infers VIDEO from Cloudinary video upload URLs", () => {
    const normalized = normalizeAboutPayload(
      makeAboutApiPayload({
        heroMediaType: null,
        imageUrl: "https://res.cloudinary.com/demo/video/upload/v1/clip.mp4",
      }),
    );
    expect(normalized?.heroMediaType).toBe("VIDEO");
  });

  it("accepts fixture content items as a round-trip shape", () => {
    const item = makeAboutContentItem();
    const video = makeAboutVideoContentItem();
    expect(normalizeAboutPayload(item)?.title).toBe(item.title);
    expect(normalizeAboutPayload(video)?.heroMediaType).toBe("VIDEO");
  });
});
