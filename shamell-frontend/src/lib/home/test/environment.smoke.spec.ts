/** @vitest-environment jsdom */

import { describe, expect, it } from "vitest";
import { getPublicApiBaseUrl } from "@/lib/publicApiBaseUrl";
import {
  makeHomeAboveFoldApiPayload,
  makeHomeAbout,
} from "./fixtures/homeLib.fixture";
import {
  FIXTURE_HOME_ABOUT_TITLE,
  FIXTURE_HOME_EVENT_ID,
} from "./fixtures/uuids.fixture";
import { createMockHomeAboveFoldState } from "./helpers/mockHomeLib";

describe("home lib test environment", () => {
  it("exposes usable fixtures and mocks", () => {
    expect(makeHomeAbout().title).toBe(FIXTURE_HOME_ABOUT_TITLE);
    expect(
      makeHomeAboveFoldApiPayload().upcomingEvents[0]?.id,
    ).toBe(FIXTURE_HOME_EVENT_ID);
    expect(createMockHomeAboveFoldState().headerPhotos).toHaveLength(1);
  });

  it("serves aggregated above-fold via MSW", async () => {
    const res = await fetch(`${getPublicApiBaseUrl()}/api/v1/home/above-fold`);
    expect(res.ok).toBe(true);
    const body = (await res.json()) as {
      about?: { title?: string };
      upcomingEvents?: Array<{ id?: string }>;
    };
    expect(body.about?.title).toBe(FIXTURE_HOME_ABOUT_TITLE);
    expect(body.upcomingEvents?.[0]?.id).toBe(FIXTURE_HOME_EVENT_ID);
  });
});
