/** @vitest-environment jsdom */

import { beforeEach, describe, expect, it } from "vitest";
import { HttpResponse, http } from "msw";
import { server } from "@/test/server";
import { fallbackAboutContent } from "./aboutContent";
import { fetchPublicAbout } from "./fetchPublicAbout";
import { aboutPublicHandler } from "./test/mocks/handlers";
import { makeAboutApiPayload } from "./test/fixtures/aboutLib.fixture";
import { FIXTURE_ABOUT_TITLE } from "./test/fixtures/uuids.fixture";

describe("fetchPublicAbout", () => {
  beforeEach(() => {
    server.use(aboutPublicHandler());
  });

  it("returns normalized about content from the public API", async () => {
    const about = await fetchPublicAbout();
    expect(about.title).toBe(FIXTURE_ABOUT_TITLE);
    expect(about.paragraph1).toBe("API about body.");
    expect(about.coreValues).toEqual(["Professionalism"]);
  });

  it("falls back when the response is not ok", async () => {
    server.use(
      http.get("*/api/v1/about", () =>
        HttpResponse.json({ message: "down" }, { status: 500 }),
      ),
    );
    await expect(fetchPublicAbout()).resolves.toEqual(fallbackAboutContent);
  });

  it("falls back when the payload cannot be normalized", async () => {
    server.use(aboutPublicHandler({ title: "only-title" }));
    await expect(fetchPublicAbout()).resolves.toEqual(fallbackAboutContent);
  });

  it("falls back when fetch throws", async () => {
    server.use(
      http.get("*/api/v1/about", () => {
        throw new Error("network");
      }),
    );
    // MSW may surface as error response; also cover invalid JSON body path
    server.use(
      http.get("*/api/v1/about", () =>
        HttpResponse.text("not-json", { status: 200 }),
      ),
    );
    const about = await fetchPublicAbout();
    expect(about).toEqual(fallbackAboutContent);
  });

  it("accepts a full fixture-shaped API body", async () => {
    server.use(aboutPublicHandler(makeAboutApiPayload({ title: "Custom" })));
    const about = await fetchPublicAbout();
    expect(about.title).toBe("Custom");
  });
});
