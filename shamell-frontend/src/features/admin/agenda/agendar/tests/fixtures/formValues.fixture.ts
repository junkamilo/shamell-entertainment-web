import type { AgendarFormValues } from "../../types/agendar.types";
import {
  FIXTURE_EVENT_TYPE_ID,
  FIXTURE_OCCASION_ID,
  FIXTURE_SERVICE_ID,
  FIXTURE_SERVICE_ID_2,
} from "./uuids.fixture";

export const emptyAgendarFormValues: AgendarFormValues = {
  serviceIds: [],
  eventTypeId: "",
  occasionTypeId: "",
  eventDateIso: "",
  eventTimeStart: "",
  eventTimeEnd: "",
  location: "",
  guestFullName: "",
  guestEmail: "",
  guestPhone: "",
  guestCount: "",
  notes: "",
};

export const validAgendarFormValues: AgendarFormValues = {
  serviceIds: [FIXTURE_SERVICE_ID, FIXTURE_SERVICE_ID_2],
  eventTypeId: FIXTURE_EVENT_TYPE_ID,
  occasionTypeId: FIXTURE_OCCASION_ID,
  eventDateIso: "2026-08-15",
  eventTimeStart: "18:00",
  eventTimeEnd: "20:00",
  location: "Main Hall",
  guestFullName: "Jane Doe",
  guestEmail: "jane@example.com",
  guestPhone: "+1 (555) 123-4567",
  guestCount: "120",
  notes: "VIP table near stage",
};
