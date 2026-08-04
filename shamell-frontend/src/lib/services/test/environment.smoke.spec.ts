/** @vitest-environment jsdom */

import { describe, expect, it } from "vitest";
import {
  makeExperienceFixture,
  makeVideoExperienceFixture,
} from "./fixtures/servicesLib.fixture";
import {
  FIXTURE_CATALOG_PRICE,
  FIXTURE_EXPERIENCE_SLUG,
} from "./fixtures/uuids.fixture";
import { createMockServicesCatalogState } from "./helpers/mockServicesLib";
import { experiencesFallbackData } from "../experiencesData";
import { formatCatalogPriceWithSuffix } from "../formatCatalogPrice";
import { serviceCatalogMediaTypeFromUrl } from "../serviceCatalogMedia";

describe("services lib test environment", () => {
  it("exposes usable fixtures and mocks", () => {
    expect(makeExperienceFixture().slug).toBe(FIXTURE_EXPERIENCE_SLUG);
    expect(makeVideoExperienceFixture().heroMediaType).toBe("VIDEO");
    expect(createMockServicesCatalogState().price).toBe(FIXTURE_CATALOG_PRICE);
  });

  it("keeps core helpers wired for smoke", () => {
    expect(experiencesFallbackData.length).toBeGreaterThan(0);
    expect(formatCatalogPriceWithSuffix(FIXTURE_CATALOG_PRICE)).toBe(
      "1,250 USD",
    );
    expect(serviceCatalogMediaTypeFromUrl("https://x.com/a.jpg")).toBe("IMAGE");
  });
});
