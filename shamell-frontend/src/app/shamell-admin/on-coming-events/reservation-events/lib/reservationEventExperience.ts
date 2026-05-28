import type {
  ReservationEventScheduleMode,
  ReservationEventTemplate,
} from "../types/reservationEventTemplate.types";
import type {
  UpcomingClassVariant,
  UpcomingExperienceType,
} from "@/app/shamell-admin/events/types/events.types";

export function experienceFromScheduleMode(
  scheduleMode: ReservationEventScheduleMode,
): {
  experienceType: UpcomingExperienceType;
  classVariant: UpcomingClassVariant | undefined;
} {
  if (scheduleMode === "FIXED_EVENT") {
    return { experienceType: "VENUE_SEATING", classVariant: undefined };
  }
  return { experienceType: "CLASSES", classVariant: "GROUP" };
}

export function experienceFromTemplate(template: ReservationEventTemplate | undefined) {
  if (!template) return null;
  return experienceFromScheduleMode(template.scheduleMode);
}

export function findTemplateById(
  templates: ReservationEventTemplate[],
  id: string,
): ReservationEventTemplate | undefined {
  return templates.find((t) => t.id === id);
}
