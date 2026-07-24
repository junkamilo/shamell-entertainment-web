import { http, HttpResponse } from "msw";
import {
  makeCatalogSnapshot,
  makeContactLinesApiPayload,
  makeOccupiedRangesPayload,
  makePublicAvailabilityPayload,
  makePublicServiceOption,
} from "../fixtures/contacto.fixture";
import { FIXTURE_CATALOG_ID, FIXTURE_SERVICE_ID } from "../fixtures/uuids.fixture";

/**
 * Own public contact/inquiry routes.
 * GET contact-lines is already served by agenda shared/peticiones —
 * use contactLinesListHandler() via server.use for richer public fixtures.
 */
export const contactoHandlers = [
  http.post("*/api/v1/contact", () => {
    return HttpResponse.json({ ok: true });
  }),

  http.get("*/api/v1/bookings/public/occupied", () => {
    return HttpResponse.json(makeOccupiedRangesPayload());
  }),

  http.get("*/api/v1/availability/public", () => {
    return HttpResponse.json(makePublicAvailabilityPayload());
  }),

  http.get("*/api/v1/services", () => {
    return HttpResponse.json([makePublicServiceOption()]);
  }),

  http.get("*/api/v1/services/catalog/:id", ({ params }) => {
    return HttpResponse.json(
      makeCatalogSnapshot({
        kind: "service",
        id: String(params.id ?? FIXTURE_SERVICE_ID),
        title: "Performance",
      }),
    );
  }),

  http.get("*/api/v1/events/catalog/:id", ({ params }) => {
    return HttpResponse.json(
      makeCatalogSnapshot({
        kind: "event",
        id: String(params.id ?? FIXTURE_CATALOG_ID),
      }),
    );
  }),

  http.get("*/api/v1/services/public/by-inquiry/:code", () => {
    return HttpResponse.json(makePublicServiceOption());
  }),
];

/** Override GET contact-lines with public ContactLine-shaped rows. */
export function contactLinesListHandler(
  items = makeContactLinesApiPayload(),
) {
  return http.get("*/api/v1/events/contact-lines", () => {
    return HttpResponse.json(items);
  });
}
