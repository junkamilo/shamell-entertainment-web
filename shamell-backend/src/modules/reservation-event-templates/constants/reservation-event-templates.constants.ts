import type { Prisma } from '@prisma/client';

export const RESERVATION_EVENT_TEMPLATES_CONTROLLER_PATH =
  'reservation-event-templates';

export const WEEKDAY_LABELS = [
  'Sun',
  'Mon',
  'Tue',
  'Wed',
  'Thu',
  'Fri',
  'Sat',
] as const;

export const MIN_CLASS_SECTION_PRICE = 0.5;

export const TEMPLATE_INCLUDE = {
  weekdays: { orderBy: { weekday: 'asc' as const } },
  classSections: {
    orderBy: [{ weekday: 'asc' as const }, { sortOrder: 'asc' as const }],
  },
  venueConfigs: { select: { eventId: true } },
} satisfies Prisma.ReservationEventTemplateInclude;
