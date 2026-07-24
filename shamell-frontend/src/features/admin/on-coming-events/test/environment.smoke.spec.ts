import { describe, expect, it } from "vitest";
import { fetchAdminVenueLayoutSettings } from "../services/fetchAdminVenueLayoutSettings";
import { fetchAdminReservationEventTemplates } from "../reservation-events/services/fetchAdminReservationEventTemplates";
import { fetchAdminFloorLayout } from "../layout/services/fetchAdminFloorLayout";
import {
  makeAdminVenueConfig,
  makeFloorLayout,
  makeReservationEventTemplate,
  makeVenueLayoutSettings,
} from "./fixtures/onComingEvents.fixture";
import {
  FIXTURE_EVENT_ID,
  FIXTURE_LAYOUT_ID,
  FIXTURE_SETTINGS_ID,
  FIXTURE_TEMPLATE_ID,
} from "./fixtures/uuids.fixture";
import { createMockVenueLayoutPromoPageState } from "./helpers/mockVenueLayoutPromoPage";
import { createMockFloorLayoutEditorState } from "./helpers/mockFloorLayoutEditor";

describe("on-coming-events test environment", () => {
  it("exposes usable fixtures and page mocks", () => {
    expect(makeVenueLayoutSettings().id).toBe(FIXTURE_SETTINGS_ID);
    expect(makeReservationEventTemplate().id).toBe(FIXTURE_TEMPLATE_ID);
    expect(makeAdminVenueConfig().eventId).toBe(FIXTURE_EVENT_ID);
    expect(makeFloorLayout().id).toBe(FIXTURE_LAYOUT_ID);

    const promo = createMockVenueLayoutPromoPageState({ isModalOpen: true });
    expect(promo.isModalOpen).toBe(true);
    promo.openModal();
    expect(promo.openModal).toHaveBeenCalled();

    const editor = createMockFloorLayoutEditorState({ dirty: true });
    expect(editor.dirty).toBe(true);
    editor.save();
    expect(editor.save).toHaveBeenCalled();
  });

  it("serves settings, templates, and floor layout via MSW", async () => {
    const settings = await fetchAdminVenueLayoutSettings("token-1");
    expect(settings.ok).toBe(true);
    expect(settings.settings?.id).toBe(FIXTURE_SETTINGS_ID);

    const templates = await fetchAdminReservationEventTemplates("token-1");
    expect(templates.ok).toBe(true);
    expect(templates.templates[0]?.id).toBe(FIXTURE_TEMPLATE_ID);

    const layout = await fetchAdminFloorLayout("token-1");
    expect(layout.ok).toBe(true);
    expect(layout.layout?.id).toBe(FIXTURE_LAYOUT_ID);
  });
});
