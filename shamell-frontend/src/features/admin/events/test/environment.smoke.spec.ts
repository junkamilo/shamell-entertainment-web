import { describe, expect, it } from "vitest";
import { fetchAdminEvents } from "../services/fetchAdminEvents";
import { postAdminEvent } from "../services/postAdminEvent";
import {
  makeAdminEvent,
  makeAdminEventsApiPayload,
} from "./fixtures/events.fixture";
import { FIXTURE_EVENT_ID } from "./fixtures/uuids.fixture";
import { createMockEventsPageState } from "./helpers/mockEventsPage";

describe("events test environment", () => {
  it("exposes usable fixtures and page mock", () => {
    expect(makeAdminEvent().id).toBe(FIXTURE_EVENT_ID);
    expect(makeAdminEventsApiPayload()).toHaveLength(2);

    const page = createMockEventsPageState({ isModalOpen: true });
    expect(page.isModalOpen).toBe(true);
    page.openCreateModal();
    expect(page.openCreateModal).toHaveBeenCalled();
  });

  it("serves events list and create via MSW", async () => {
    const list = await fetchAdminEvents("token-1", { publicSection: "GENERAL" });
    expect(list[0]?.id).toBe(FIXTURE_EVENT_ID);

    const created = await postAdminEvent("token-1", {
      eventTypeId: list[0]!.eventTypeId,
      description: "An elegant private wedding package with full staging.",
      items: ["Dance set"],
      showOnHome: true,
      publicSection: "GENERAL",
    });
    expect(created.id).toBe(FIXTURE_EVENT_ID);
  });
});
