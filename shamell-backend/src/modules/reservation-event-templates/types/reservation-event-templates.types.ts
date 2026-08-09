import {
  ReservationEventScheduleMode,
  type Prisma,
  type ReservationEventTemplate,
  type ReservationEventWeekday,
} from '@prisma/client';
import { TEMPLATE_INCLUDE } from '../constants/reservation-event-templates.constants';

export type WeekdayInput = { weekday: number; isActive: boolean };

export type ClassSectionInput = {
  weekday: number;
  label: string | null;
  startTime: string;
  endTime: string;
  sortOrder: number;
  defaultCapacity: number;
  defaultPrice: number | null;
  isActive: boolean;
};

/** Section that passed validation: label and price are guaranteed present. */
export type ValidatedClassSection = Omit<
  ClassSectionInput,
  'label' | 'defaultPrice'
> & {
  label: string;
  defaultPrice: number;
};

export type ValidatedTemplatePayload = {
  name: string;
  timezone: string;
  scheduleMode: ReservationEventScheduleMode;
  salesStartDate: Date | null;
  salesEndDate: Date | null;
  eventDate: Date | null;
  eventStartTime: string | null;
  eventEndTime: string | null;
  recurringEffectiveFrom: Date | null;
  recurringStartTime: string | null;
  recurringEndTime: string | null;
  weekdays: WeekdayInput[];
  classSections: ValidatedClassSection[];
};

export type TemplateForDerive = Pick<
  ReservationEventTemplate,
  | 'name'
  | 'timezone'
  | 'scheduleMode'
  | 'salesStartDate'
  | 'salesEndDate'
  | 'eventDate'
  | 'eventStartTime'
  | 'eventEndTime'
  | 'recurringEffectiveFrom'
  | 'recurringStartTime'
  | 'recurringEndTime'
>;

export type TemplateWithWeekdays = Prisma.ReservationEventTemplateGetPayload<{
  include: typeof TEMPLATE_INCLUDE;
}>;

export type TemplateSummaryRow = TemplateForDerive & {
  weekdays?: ReservationEventWeekday[];
};

export type AdminTemplateResponse = {
  id: string;
  name: string;
  timezone: string;
  scheduleMode: ReservationEventScheduleMode;
  salesStartDate: string | null;
  salesEndDate: string | null;
  eventDate: string | null;
  eventStartTime: string | null;
  eventEndTime: string | null;
  recurringEffectiveFrom: string | null;
  recurringStartTime: string | null;
  recurringEndTime: string | null;
  startDate: string | null;
  endDate: string | null;
  startTime: string | null;
  endTime: string | null;
  weekdays: WeekdayInput[];
  classSections: Array<{
    id: string;
    weekday: number;
    label: string;
    startTime: string;
    endTime: string;
    sortOrder: number;
    defaultCapacity: number;
    defaultPrice: number | null;
    isActive: boolean;
  }>;
  activeDayLabels: string[];
  summary: string;
  linkedEventIds: string[];
  updatedAt: string;
};
