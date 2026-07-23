import { http, HttpResponse } from "msw";
import {
  makeCatalogContactLinesPayload,
  makeCatalogEventTypesPayload,
  makeCatalogOccasionsPayload,
  makeCatalogServicesPayload,
} from "../fixtures/agendaShared.fixture";

/**
 * Catalog endpoints used by `fetchAgendaCatalogMaps`.
 * Registered after feature-specific handlers so MSW first-match still works
 * for services/types when those modules own richer payloads; occasions is unique here.
 */
export const agendaSharedHandlers = [
  http.get("*/api/v1/events/occasions/admin", () => {
    return HttpResponse.json(makeCatalogOccasionsPayload());
  }),

  http.get("*/api/v1/events/contact-lines", () => {
    return HttpResponse.json(makeCatalogContactLinesPayload());
  }),

  http.get("*/api/v1/events/types/admin", () => {
    return HttpResponse.json(makeCatalogEventTypesPayload());
  }),

  http.get("*/api/v1/services/admin", () => {
    return HttpResponse.json(makeCatalogServicesPayload());
  }),
];
