import { describe, expect, it } from "vitest";
import { makeExperienceFixture } from "./test/fixtures/servicesLib.fixture";
import {
  FIXTURE_EXPERIENCE_ID,
  FIXTURE_EXPERIENCE_SLUG,
  FIXTURE_EXPERIENCE_TITLE,
} from "./test/fixtures/uuids.fixture";
import { experiencesFallbackData } from "./experiencesData";

describe("experiencesFallbackData", () => {
  it("exposes the three static catalog experiences", () => {
    expect(experiencesFallbackData).toHaveLength(3);
    expect(experiencesFallbackData.map((e) => e.slug)).toEqual([
      "fire",
      "veil-fan",
      "sword-candelabra",
    ]);
  });

  it("includes fire as the first fallback with required fields", () => {
    const fire = experiencesFallbackData[0];
    expect(fire).toEqual(
      expect.objectContaining({
        id: FIXTURE_EXPERIENCE_ID,
        slug: FIXTURE_EXPERIENCE_SLUG,
        title: FIXTURE_EXPERIENCE_TITLE,
      }),
    );
    expect(fire?.description.length).toBeGreaterThan(0);
    expect(fire?.items.length).toBeGreaterThan(0);
    expect(fire?.image).toBeTruthy();
  });

  it("keeps fixture shape compatible with Experience", () => {
    const fixture = makeExperienceFixture();
    expect(fixture.id).toBe(FIXTURE_EXPERIENCE_ID);
    expect(fixture.contactInquiryCode).toBe("FIRE");
    expect(fixture.items.length).toBeGreaterThan(0);
  });
});
