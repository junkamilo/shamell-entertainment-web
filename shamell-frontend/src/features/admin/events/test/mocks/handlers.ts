import { http, HttpResponse } from "msw";
import {
  makeAdminEventsApiPayload,
  makeEventTypeOption,
} from "../fixtures/events.fixture";
import { FIXTURE_EVENT_ID } from "../fixtures/uuids.fixture";

export const eventsHandlers = [
  http.get("*/api/v1/events/admin", () => {
    return HttpResponse.json(makeAdminEventsApiPayload());
  }),

  http.post("*/api/v1/events/admin", () => {
    return HttpResponse.json({ event: { id: FIXTURE_EVENT_ID } });
  }),

  http.patch("*/api/v1/events/admin/:id", () => {
    return HttpResponse.json({ ok: true });
  }),

  http.delete("*/api/v1/events/admin/:id", () => {
    return HttpResponse.json({ ok: true });
  }),

  http.post("*/api/v1/events/admin/:eventId/images", () => {
    return HttpResponse.json({ ok: true });
  }),

  http.delete("*/api/v1/gallery/admin/photos/:photoId", () => {
    return HttpResponse.json({ ok: true });
  }),

  // Fallback types list if event-types handlers are not matched first
  http.get("*/api/v1/events/types/admin", () => {
    return HttpResponse.json([makeEventTypeOption()]);
  }),
];
