export type AgendarFormValues = {
  serviceIds: string[];
  eventTypeId: string;
  occasionTypeId: string;
  eventDateIso: string;
  eventTimeStart: string;
  eventTimeEnd: string;
  location: string;
  guestFullName: string;
  guestEmail: string;
  guestPhone: string;
  guestCount: string;
  notes: string;
};

export type NormalizedAgendarForm = Omit<AgendarFormValues, "guestCount"> & {
  guestCount: number;
  /** Same as `serviceIds[0]`; sent as top-level `serviceId` to the API. */
  serviceId: string;
};

export type IdName = { id: string; name: string };

export type AgendarServiceOption = { id: string; serviceTypeName: string };

export type AgendarCatalog = {
  services: AgendarServiceOption[];
  eventTypes: IdName[];
  occasions: IdName[];
};

export type OccupiedRange = { startMinutes: number; endMinutes: number };

export type AgendarMobileSectionId = "event" | "logistics" | "client";
