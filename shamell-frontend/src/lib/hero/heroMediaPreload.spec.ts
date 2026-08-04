import { describe, expect, it } from "vitest";
import {
  makeHeroHeaderPhoto,
  makeHeroHeaderVideoSlide,
} from "./test/fixtures/heroLib.fixture";
import {
  FIXTURE_HEADER_IMAGE,
  FIXTURE_HEADER_IMAGE_MOBILE,
  FIXTURE_HEADER_POSTER,
  FIXTURE_HEADER_POSTER_MOBILE,
} from "./test/fixtures/uuids.fixture";
import { heroLcpPreload } from "./heroMediaPreload";

describe("heroLcpPreload", () => {
  it("returns null without a slide or without media urls", () => {
    expect(heroLcpPreload(undefined)).toBeNull();
    expect(
      heroLcpPreload(
        makeHeroHeaderPhoto({
          imageUrl: null,
          imageUrlMobile: null,
        }),
      ),
    ).toBeNull();
    expect(
      heroLcpPreload(
        makeHeroHeaderVideoSlide({
          videoPosterUrl: null,
          videoPosterUrlMobile: null,
        }),
      ),
    ).toBeNull();
  });

  it("builds image srcset for IMAGE slides", () => {
    const preload = heroLcpPreload(makeHeroHeaderPhoto());
    expect(preload).toEqual({
      href: FIXTURE_HEADER_IMAGE,
      options: {
        as: "image",
        fetchPriority: "high",
        imageSrcSet: `${FIXTURE_HEADER_IMAGE_MOBILE} 960w, ${FIXTURE_HEADER_IMAGE} 1920w`,
        imageSizes: "100vw",
      },
    });
  });

  it("builds poster srcset for VIDEO slides", () => {
    const preload = heroLcpPreload(makeHeroHeaderVideoSlide());
    expect(preload).toEqual({
      href: FIXTURE_HEADER_POSTER,
      options: {
        as: "image",
        fetchPriority: "high",
        imageSrcSet: `${FIXTURE_HEADER_POSTER_MOBILE} 480w, ${FIXTURE_HEADER_POSTER} 720w`,
        imageSizes: "100vw",
      },
    });
  });
});
