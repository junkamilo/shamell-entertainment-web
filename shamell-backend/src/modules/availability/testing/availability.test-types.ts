/** Narrow response shapes for availability e2e / deep HTTP tests (no any). */

export type ErrorBody = {
  statusCode: number;
  message: string | string[];
  error?: string;
};

export type PublicWeeklySlotBody = {
  weekday: number;
  isClosed: boolean;
  startTime: string | null;
  endTime: string | null;
};

export type PublicClosureBody = {
  kind: string;
  date: string | null;
  weekday: number | null;
  startDate: string | null;
  endDate: string | null;
  note: string | null;
};

export type PublicRulesBody = {
  timeZone: string;
  weekly: PublicWeeklySlotBody[];
  closures: PublicClosureBody[];
};

export type AdminWeeklySlotBody = PublicWeeklySlotBody & {
  id: string;
  updatedAt: string;
};

export type ClosureBody = {
  id: string;
  kind: string;
  date: string | null;
  weekday: number | null;
  startDate: string | null;
  endDate: string | null;
  note: string | null;
  createdAt?: string;
};

export type AdminSnapshotBody = {
  timeZone: string;
  weekly: AdminWeeklySlotBody[];
  closures: ClosureBody[];
};
