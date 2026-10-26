import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@test/support/server";
import { fetchOnComingEventDetail } from "@/features/on-coming-events/services/fetchOnComingEventDetail";
import {
  FIXTURE_EVENT_ID,
  FIXTURE_EVENT_SLUG,
} from "@test/features/on-coming-events/support/fixtures/uuids.fixture";
import { makeOnComingEventDetail } from "@test/features/on-coming-events/support/fixtures/onComingEvents.fixture";

describe("fetchOnComingEventDetail", () => {
  it("loads event detail with purchase mode", async () => {
    const detail = await fetchOnComingEventDetail(FIXTURE_EVENT_SLUG);
    expect(detail.id).toBe(FIXTURE_EVENT_ID);
    expect(detail.purchaseMode).toBe("classes");
  });

  it("infers purchaseMode from experienceType when missing", async () => {
    server.use(
      http.get("*/api/v1/upcoming-events/:slug", () =>
        HttpResponse.json(
          makeOnComingEventDetail({
            experienceType: "VENUE_SEATING",
            purchaseMode: undefined as unknown as "classes",
          }),
        ),
      ),
    );
    const detail = await fetchOnComingEventDetail(FIXTURE_EVENT_SLUG);
    expect(detail.purchaseMode).toBe("venue_seating");
  });

  it("throws when event is not found", async () => {
    server.use(
      http.get("*/api/v1/upcoming-events/:slug", () =>
        HttpResponse.json({ message: "missing" }, { status: 404 }),
      ),
    );
    await expect(fetchOnComingEventDetail("missing-slug")).rejects.toThrow(
      /Event not found/,
    );
  });

  it("throws on invalid response body", async () => {
    server.use(
      http.get("*/api/v1/upcoming-events/:slug", () =>
        HttpResponse.json(null),
      ),
    );
    await expect(fetchOnComingEventDetail(FIXTURE_EVENT_SLUG)).rejects.toThrow(
      /Invalid event response/,
    );
  });
});
