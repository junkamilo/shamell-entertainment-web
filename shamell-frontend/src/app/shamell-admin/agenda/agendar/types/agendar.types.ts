export type { AgendarFormValues, NormalizedAgendarForm } from "../form-validation";

export type IdName = { id: string; name: string };

export type AgendarServiceOption = { id: string; serviceTypeName: string };

export type AgendarCatalog = {
  services: AgendarServiceOption[];
  eventTypes: IdName[];
  occasions: IdName[];
};

export type OccupiedRange = { startMinutes: number; endMinutes: number };

export type AgendarMobileSectionId = "event" | "logistics" | "client";
