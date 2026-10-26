import { describe, expect, it } from "vitest";
import { fetchAdminEventTypes } from "@/features/admin/event-types/services/fetchAdminEventTypes";
import { fetchAdminOccasionsCatalog } from "@/features/admin/event-types/services/fetchAdminOccasionsCatalog";
import {
  makeEventTypeItem,
  makeEventTypesApiPayload,
} from "@test/features/admin/event-types/support/fixtures/eventTypes.fixture";
import { FIXTURE_EVENT_TYPE_ID } from "@test/features/admin/event-types/support/fixtures/uuids.fixture";
import { createMockEventTypesPageState } from "@test/features/admin/event-types/support/helpers/mockEventTypesPage";

describe("event-types test environment", () => {
  it("exposes usable fixtures and page mock", () => {
    expect(makeEventTypeItem().id).toBe(FIXTURE_EVENT_TYPE_ID);
    expect(makeEventTypesApiPayload()).toHaveLength(2);

    const page = createMockEventTypesPageState({ isModalOpen: true });
    expect(page.isModalOpen).toBe(true);
    page.openCreateModal();
    expect(page.openCreateModal).toHaveBeenCalled();
  });

  it("serves event types and occasions via MSW", async () => {
    const types = await fetchAdminEventTypes("token-1");
    expect(types[0]?.id).toBe(FIXTURE_EVENT_TYPE_ID);

    const occasions = await fetchAdminOccasionsCatalog("token-1");
    expect(occasions.length).toBeGreaterThan(0);
  });
});
