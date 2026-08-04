/** @vitest-environment jsdom */

import { beforeEach, describe, expect, it } from "vitest";
import { HttpResponse, http } from "msw";
import { server } from "@/test/server";
import {
  fetchPublicHeaderMedia,
  normalizeHeaderPhotos,
} from "./fetchPublicHeaderMedia";
import { headerMediaPublicHandler } from "./test/mocks/handlers";
import {
  makeHeaderMediaApiPayload,
  makePublicHeaderPhoto,
  makePublicHeaderVideoPhoto,
} from "./test/fixtures/headerMediaLib.fixture";
import {
  FIXTURE_HEADER_IMAGE,
  FIXTURE_HEADER_PHOTO_ID,
  FIXTURE_HEADER_VIDEO,
} from "./test/fixtures/uuids.fixture";

describe("normalizeHeaderPhotos", () => {
  it("returns empty for non-arrays and drops rows without media", () => {
    expect(normalizeHeaderPhotos(null)).toEqual([]);
    expect(normalizeHeaderPhotos([{ id: "x" }])).toEqual([]);
  });

  it("normalizes IMAGE and VIDEO rows and clamps focals", () => {
    const photos = normalizeHeaderPhotos([
      makePublicHeaderPhoto({ focalX: 150, focalY: -10 }),
      makePublicHeaderVideoPhoto(),
      { mediaType: "IMAGE", imageUrl: "  " },
    ]);
    expect(photos).toHaveLength(2);
    expect(photos[0]).toMatchObject({
      id: FIXTURE_HEADER_PHOTO_ID,
      mediaType: "IMAGE",
      imageUrl: FIXTURE_HEADER_IMAGE,
      focalX: 100,
      focalY: 0,
    });
    expect(photos[1]).toMatchObject({
      mediaType: "VIDEO",
      videoDeliveryUrl: FIXTURE_HEADER_VIDEO,
    });
  });

  it("falls back id to media url when id is missing", () => {
    const photos = normalizeHeaderPhotos([
      { imageUrl: FIXTURE_HEADER_IMAGE, mediaType: "IMAGE" },
    ]);
    expect(photos[0]?.id).toBe(FIXTURE_HEADER_IMAGE);
  });
});

describe("fetchPublicHeaderMedia", () => {
  beforeEach(() => {
    server.use(headerMediaPublicHandler());
  });

  it("returns normalized photos from the public API", async () => {
    const photos = await fetchPublicHeaderMedia();
    expect(photos).toHaveLength(1);
    expect(photos[0]?.id).toBe(FIXTURE_HEADER_PHOTO_ID);
  });

  it("returns [] when the response is not ok", async () => {
    server.use(
      http.get("*/api/v1/header-media", () =>
        HttpResponse.json({ message: "down" }, { status: 500 }),
      ),
    );
    await expect(fetchPublicHeaderMedia()).resolves.toEqual([]);
  });

  it("returns [] when the payload is invalid JSON shape", async () => {
    server.use(headerMediaPublicHandler({ not: "an-array" }));
    await expect(fetchPublicHeaderMedia()).resolves.toEqual([]);
  });

  it("accepts a multi-photo fixture payload", async () => {
    server.use(
      headerMediaPublicHandler(
        makeHeaderMediaApiPayload([
          makePublicHeaderPhoto(),
          makePublicHeaderVideoPhoto({ id: "video-1" }),
        ]),
      ),
    );
    const photos = await fetchPublicHeaderMedia();
    expect(photos).toHaveLength(2);
    expect(photos[1]?.mediaType).toBe("VIDEO");
  });
});
