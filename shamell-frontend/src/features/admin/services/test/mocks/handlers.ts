import { http, HttpResponse } from "msw";
import {
  makeAdminServicesApiPayload,
  makeServiceTypesApiPayload,
} from "../fixtures/services.fixture";

export const servicesHandlers = [
  http.get("*/api/v1/services/types/admin", () => {
    return HttpResponse.json(makeServiceTypesApiPayload());
  }),

  http.get("*/api/v1/services/admin", () => {
    return HttpResponse.json(makeAdminServicesApiPayload());
  }),

  http.post("*/api/v1/services/admin", () => {
    return HttpResponse.json({ ok: true });
  }),

  http.patch("*/api/v1/services/admin/:id", () => {
    return HttpResponse.json({ ok: true });
  }),

  http.delete("*/api/v1/services/admin/:id", () => {
    return HttpResponse.json({ ok: true });
  }),
];
