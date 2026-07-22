import type { AgendarCatalog } from "../../types/agendar.types";
import { FIXTURE_EVENT_TYPE_ID, FIXTURE_OCCASION_ID, FIXTURE_SERVICE_ID } from "./uuids.fixture";

export const sampleAgendarCatalog: AgendarCatalog = {
  services: [{ id: FIXTURE_SERVICE_ID, serviceTypeName: "Fire Dance" }],
  eventTypes: [{ id: FIXTURE_EVENT_TYPE_ID, name: "Corporate" }],
  occasions: [{ id: FIXTURE_OCCASION_ID, name: "Gala" }],
};

export const sampleAgendarCatalogApiResponse = {
  services: sampleAgendarCatalog.services,
  eventTypes: sampleAgendarCatalog.eventTypes,
  occasions: sampleAgendarCatalog.occasions,
};
