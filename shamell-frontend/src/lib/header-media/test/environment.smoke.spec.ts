/** @vitest-environment jsdom */

import { describe, expect, it } from "vitest";
import { getPublicApiBaseUrl } from "@/lib/publicApiBaseUrl";
import {
  makeHeaderTextContent,
  makePublicHeaderPhoto,
} from "./fixtures/headerMediaLib.fixture";
import {
  FIXTURE_HEADER_HEADLINE,
  FIXTURE_HEADER_PHOTO_ID,
} from "./fixtures/uuids.fixture";
import { createMockHeaderMediaState } from "./helpers/mockHeaderMediaLib";
import { DEFAULT_HEADER_TEXT } from "../headerTextTypes";
import { mapHeaderTextFromApi } from "../headerTextStyleTokens";

describe("header-media lib test environment", () => {
  it("exposes usable fixtures and mocks", () => {
    expect(makePublicHeaderPhoto().id).toBe(FIXTURE_HEADER_PHOTO_ID);
    expect(makeHeaderTextContent().headline).toBe(FIXTURE_HEADER_HEADLINE);
    expect(createMockHeaderMediaState().photos).toHaveLength(1);
  });

  it("serves public header-media via MSW and keeps helpers wired", async () => {
    expect(mapHeaderTextFromApi({}).headline).toBe(DEFAULT_HEADER_TEXT.headline);

    const res = await fetch(`${getPublicApiBaseUrl()}/api/v1/header-media`);
    expect(res.ok).toBe(true);
    const body = (await res.json()) as Array<{ id?: string }>;
    expect(body[0]?.id).toBe(FIXTURE_HEADER_PHOTO_ID);
  });
});
