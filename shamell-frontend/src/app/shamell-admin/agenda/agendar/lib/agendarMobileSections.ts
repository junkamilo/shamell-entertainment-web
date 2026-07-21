import type { AgendarMobileSectionId } from "../types/agendar.types";

export const AGENDAR_MOBILE_SECTIONS: {
  id: AgendarMobileSectionId;
  title: string;
  subtitle: string;
}[] = [
  { id: "event", title: "EVENT SETUP", subtitle: "Type, occasion, service(s)" },
  { id: "logistics", title: "WHEN & WHERE", subtitle: "Date, time, location" },
  { id: "client", title: "CLIENT & NOTES", subtitle: "Guest details & notes" },
];
