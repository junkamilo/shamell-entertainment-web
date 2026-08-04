/** @vitest-environment jsdom */

import { describe, expect, it } from "vitest";
import {
  makeAboutContent,
  makeAdminBookingRow,
  makeContactRequest,
  makeExperienceServiceApiItem,
  makeHeaderTextContent,
} from "./fixtures/hooks.fixture";
import {
  FIXTURE_ABOUT_TITLE,
  FIXTURE_BOOKING_ID,
  FIXTURE_CONTACT_ID,
  FIXTURE_HEADER_HEADLINE,
  FIXTURE_SERVICE_ID,
} from "./fixtures/uuids.fixture";
import { createMockAdminBookingsState } from "./helpers/mockHooksPage";
import { getPublicApiBaseUrl } from "@/lib/publicApiBaseUrl";

describe("hooks test environment", () => {
  it("exposes usable fixtures and page mocks", () => {
    expect(makeAboutContent().title).toBe(FIXTURE_ABOUT_TITLE);
    expect(makeAdminBookingRow().id).toBe(FIXTURE_BOOKING_ID);
    expect(makeContactRequest().id).toBe(FIXTURE_CONTACT_ID);
    expect(makeHeaderTextContent().headline).toBe(FIXTURE_HEADER_HEADLINE);
    expect(makeExperienceServiceApiItem().id).toBe(FIXTURE_SERVICE_ID);

    const page = createMockAdminBookingsState({ isLoading: true });
    expect(page.isLoading).toBe(true);
    expect(page.reload).toHaveBeenCalledTimes(0);
  });

  it("serves about + contact via MSW", async () => {
    const base = getPublicApiBaseUrl();
    const aboutRes = await fetch(`${base}/api/v1/about`);
    expect(aboutRes.ok).toBe(true);
    const about = (await aboutRes.json()) as { title?: string };
    expect(about.title).toBe(FIXTURE_ABOUT_TITLE);

    const contactRes = await fetch(`${base}/api/v1/contact`, {
      headers: { Authorization: "Bearer token-1" },
    });
    expect(contactRes.ok).toBe(true);
    const contact = (await contactRes.json()) as {
      items?: Array<{ id: string }>;
    };
    expect(contact.items?.[0]?.id).toBe(FIXTURE_CONTACT_ID);
  });
});
