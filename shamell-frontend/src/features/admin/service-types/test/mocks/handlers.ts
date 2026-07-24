import { http, HttpResponse } from "msw";
import { makeServiceTypesApiPayload } from "../fixtures/serviceTypes.fixture";

/**
 * GET types/admin is already served by servicesHandlers (first match).
 * This module owns create/update/delete (+ optional GET override via server.use).
 */
export const serviceTypesHandlers = [
  http.post("*/api/v1/services/types/admin", () => {
    return HttpResponse.json({ ok: true });
  }),

  http.patch("*/api/v1/services/types/admin/:id", () => {
    return HttpResponse.json({ ok: true });
  }),

  http.delete("*/api/v1/services/types/admin/:id", () => {
    return HttpResponse.json({ ok: true });
  }),
];

/** Helper payload for specs that override GET with richer ServiceTypeItem rows. */
export function serviceTypesListHandler(
  items = makeServiceTypesApiPayload(),
) {
  return http.get("*/api/v1/services/types/admin", () => {
    return HttpResponse.json(items);
  });
}
