/** @vitest-environment jsdom */

import { describe, expect, it } from "vitest";
import {
  makeNestErrorPayload,
  makePaginationMeta,
} from "@test/lib/support/fixtures/sharedLib.fixture";
import {
  FIXTURE_BACKEND_URL,
  FIXTURE_NEST_STRING_MESSAGE,
  FIXTURE_PAGE,
} from "@test/lib/support/fixtures/uuids.fixture";
import { createMockSharedLibState } from "@test/lib/support/helpers/mockSharedLib";
import { nestApiErrorMessage } from "@/lib/nestApiErrorMessage";
import { DEFAULT_PAGINATION_META } from "@/lib/pagination";
import { getPublicApiBaseUrl } from "@/lib/publicApiBaseUrl";
import { cn } from "@/lib/utils";

describe("shared lib (root transversales) test environment", () => {
  it("exposes usable fixtures and mocks", () => {
    expect(makeNestErrorPayload().message).toBe(FIXTURE_NEST_STRING_MESSAGE);
    expect(makePaginationMeta().page).toBe(FIXTURE_PAGE);
    expect(createMockSharedLibState().backendUrl).toBe(FIXTURE_BACKEND_URL);
  });

  it("keeps core helpers wired for smoke", () => {
    expect(
      nestApiErrorMessage(makeNestErrorPayload(), "fallback"),
    ).toBe(FIXTURE_NEST_STRING_MESSAGE);
    expect(DEFAULT_PAGINATION_META.page).toBe(1);
    expect(typeof getPublicApiBaseUrl()).toBe("string");
    expect(cn("a", "b")).toContain("a");
  });
});
