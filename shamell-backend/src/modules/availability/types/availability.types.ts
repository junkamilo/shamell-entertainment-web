export type PublicWeeklySlot = {
  weekday: number;
  isClosed: boolean;
  startTime: string | null;
  endTime: string | null;
};

export type PublicClosure = {
  kind: string;
  date: string | null;
  weekday: number | null;
  startDate: string | null;
  endDate: string | null;
  note: string | null;
};

export type PublicAvailabilityRules = {
  timeZone: string;
  weekly: PublicWeeklySlot[];
  closures: PublicClosure[];
};

export type AdminWeeklySlot = PublicWeeklySlot & {
  id: string;
  updatedAt: Date;
};

export type AdminClosure = PublicClosure & {
  id: string;
  createdAt: Date;
};

export type AdminAvailabilitySnapshot = {
  timeZone: string;
  weekly: AdminWeeklySlot[];
  closures: AdminClosure[];
};

export type WeeklySlotUpsertInput = {
  weekday: number;
  isClosed: boolean;
  startTime: string | null;
  endTime: string | null;
};
