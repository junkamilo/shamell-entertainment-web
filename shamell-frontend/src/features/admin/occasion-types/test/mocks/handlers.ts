import { http, HttpResponse } from "msw";
import { makeOccasionTypesApiPayload } from "../fixtures/occasionTypes.fixture";

/**
 * GET occasions/admin is already served by event-types handlers (first match).
 * This module owns create/update/delete (+ optional GET override via server.use).
 */
export const occasionTypesHandlers = [
  http.post("*/api/v1/events/occasions/admin", () => {
    return HttpResponse.json({ ok: true });
  }),

  http.patch("*/api/v1/events/occasions/admin/:id", () => {
    return HttpResponse.json({ ok: true });
  }),

  http.delete("*/api/v1/events/occasions/admin/:id", () => {
    return HttpResponse.json({ ok: true });
  }),
];

/** Helper payload for specs that override GET with richer OccasionTypeItem rows. */
export function occasionTypesListHandler(
  items = makeOccasionTypesApiPayload(),
) {
  return http.get("*/api/v1/events/occasions/admin", () => {
    return HttpResponse.json(items);
  });
}
