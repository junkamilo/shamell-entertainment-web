import { http, HttpResponse } from "msw";
import {
  makeEventTypesApiPayload,
  makeOccasionsApiPayload,
} from "../fixtures/eventTypes.fixture";

export const eventTypesHandlers = [
  http.get("*/api/v1/events/types/admin", () => {
    return HttpResponse.json(makeEventTypesApiPayload());
  }),

  http.get("*/api/v1/events/occasions/admin", () => {
    return HttpResponse.json(makeOccasionsApiPayload());
  }),

  http.post("*/api/v1/events/types/admin", () => {
    return HttpResponse.json({ ok: true });
  }),

  http.patch("*/api/v1/events/types/admin/:id", () => {
    return HttpResponse.json({ ok: true });
  }),

  http.delete("*/api/v1/events/types/admin/:id", () => {
    return HttpResponse.json({ ok: true });
  }),
];
