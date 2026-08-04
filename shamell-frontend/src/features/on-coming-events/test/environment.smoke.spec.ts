import { describe, expect, it } from "vitest";
import { fetchOnComingEventDetail } from "../services/fetchOnComingEventDetail";
import { fetchOnComingEventsSettings } from "../services/fetchVenueLayoutSettings";
import { createVenueCheckoutSession } from "../services/createVenueCheckoutSession";
import {
  makeOnComingEventDetail,
  makeOnComingEventsPromo,
} from "./fixtures/onComingEvents.fixture";
import {
  FIXTURE_CLIENT_SECRET,
  FIXTURE_EVENT_SLUG,
  FIXTURE_LAYOUT_ITEM_ID,
  FIXTURE_RESERVATION_ID,
} from "./fixtures/uuids.fixture";
import { createMockClassBookingWizardProps } from "./helpers/mockOnComingEventsPage";

describe("on-coming-events (public) test environment", () => {
  it("exposes usable fixtures and helpers", () => {
    expect(makeOnComingEventDetail().slug).toBe(FIXTURE_EVENT_SLUG);
    expect(makeOnComingEventsPromo().clientEnabled).toBe(true);
    const wizard = createMockClassBookingWizardProps({ open: false });
    expect(wizard.open).toBe(false);
    wizard.onClose();
    expect(wizard.onClose).toHaveBeenCalled();
  });

  it("serves detail, settings, and venue checkout via MSW", async () => {
    const detail = await fetchOnComingEventDetail(FIXTURE_EVENT_SLUG);
    expect(detail.slug).toBe(FIXTURE_EVENT_SLUG);

    const settings = await fetchOnComingEventsSettings();
    expect(settings?.clientEnabled).toBe(true);

    const checkout = await createVenueCheckoutSession({
      kind: "catalog_table",
      layoutItemId: FIXTURE_LAYOUT_ITEM_ID,
      customerName: "Ada",
      customerEmail: "ada@example.com",
    });
    expect(checkout.ok).toBe(true);
    if (checkout.ok) {
      expect(checkout.clientSecret).toBe(FIXTURE_CLIENT_SECRET);
      expect(checkout.reservationId).toBe(FIXTURE_RESERVATION_ID);
    }
  });
});
