import { http, HttpResponse } from "msw";
import {
  makeCatalogContactLinesPayload,
  makeCatalogEventTypesPayload,
  makePeticionesList,
} from "../fixtures/peticiones.fixture";

export const peticionesHandlers = [
  http.get("*/api/v1/contact/peticiones", () => {
    return HttpResponse.json(makePeticionesList());
  }),

  http.get("*/api/v1/events/types/admin", () => {
    return HttpResponse.json(makeCatalogEventTypesPayload());
  }),

  http.get("*/api/v1/events/contact-lines", () => {
    return HttpResponse.json(makeCatalogContactLinesPayload());
  }),
];
