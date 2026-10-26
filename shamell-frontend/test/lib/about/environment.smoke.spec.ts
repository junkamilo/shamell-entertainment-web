/** @vitest-environment jsdom */

import { describe, expect, it } from "vitest";
import { getPublicApiBaseUrl } from "@/lib/publicApiBaseUrl";
import {
  makeAboutApiPayload,
  makeAboutContentItem,
} from "@test/lib/about/support/fixtures/aboutLib.fixture";
import { FIXTURE_ABOUT_TITLE } from "@test/lib/about/support/fixtures/uuids.fixture";
import { createMockAboutContentState } from "@test/lib/about/support/helpers/mockAboutLib";
import { fallbackAboutContent } from "@/lib/about/aboutContent";
import { splitAboutParagraphs } from "@/lib/about/aboutParagraphs";

describe("about lib test environment", () => {
  it("exposes usable fixtures and mocks", () => {
    expect(makeAboutContentItem().title).toBe(FIXTURE_ABOUT_TITLE);
    expect(makeAboutApiPayload().coreValues).toContain("Professionalism");

    const state = createMockAboutContentState({ isLoading: true });
    expect(state.isLoading).toBe(true);
    expect(state.about.title).toBe(FIXTURE_ABOUT_TITLE);
  });

  it("serves public about via MSW and keeps helpers wired", async () => {
    expect(splitAboutParagraphs(fallbackAboutContent.paragraph1).length).toBeGreaterThan(
      0,
    );

    const res = await fetch(`${getPublicApiBaseUrl()}/api/v1/about`);
    expect(res.ok).toBe(true);
    const body = (await res.json()) as { title?: string };
    expect(body.title).toBe(FIXTURE_ABOUT_TITLE);
  });
});
