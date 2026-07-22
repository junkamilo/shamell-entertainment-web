export type ReservationEventScheduleMode = "FIXED_EVENT" | "RECURRING_WEEKLY";

export type ReservationEventWeekday = {
  weekday: number;
  isActive: boolean;
};

export type ClassSectionFormRow = {
  weekday: number;
  label: string;
  startTime: string;
  endTime: string;
  sortOrder: number;
  defaultCapacity: string;
  defaultPrice: string;
};

export type ReservationEventClassSection = {
  id: string;
  weekday: number;
  label: string | null;
  startTime: string;
  endTime: string;
  sortOrder: number;
  defaultCapacity: number;
  defaultPrice: number | null;
  isActive: boolean;
};

export type ReservationEventTemplate = {
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
  weekdays: ReservationEventWeekday[];
  classSections: ReservationEventClassSection[];
  activeDayLabels: string[];
  summary: string;
  linkedEventIds?: string[];
  updatedAt: string;
};

export type ReservationEventTemplateBody = {
  name: string;
  timezone?: string;
  scheduleMode: ReservationEventScheduleMode;
  salesStartDate?: string;
  salesEndDate?: string;
  eventDate?: string;
  eventStartTime?: string;
  eventEndTime?: string;
  weekdays?: ReservationEventWeekday[];
  recurringStartTime?: string;
  recurringEndTime?: string;
  classSections?: Array<{
    weekday: number;
    label?: string | null;
    startTime: string;
    endTime: string;
    sortOrder?: number;
    defaultCapacity?: number;
    defaultPrice?: number | null;
    isActive?: boolean;
  }>;
};
