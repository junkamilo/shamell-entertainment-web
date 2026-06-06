import { Prisma } from '@prisma/client';

export type ClassSessionBundleSelectionItem = {
  sessionId: string;
  weekday: number;
  sectionId: string | null;
  amount: number;
};

export type ClassSessionBundleSelections = {
  kind: 'class_session_bundle';
  dateIso: string;
  sessionIds: string[];
  items: ClassSessionBundleSelectionItem[];
};

export type ClassPackageSelections = {
  kind: 'class_package';
  sessionIds: string[];
  weekdays: number[];
};

export type ClassMonthPackageSelectionItem = {
  sessionId: string;
  weekday: number;
  sectionId: string | null;
  amount: number;
};

export type ClassMonthPackageSelections = {
  kind: 'class_month_package';
  monthIso: string;
  sessionIds: string[];
  sessionCount: number;
  items: ClassMonthPackageSelectionItem[];
};

export function buildClassSessionBundleSelections(params: {
  dateIso: string;
  sessionIds: string[];
  items: ClassSessionBundleSelectionItem[];
}): Prisma.InputJsonValue {
  const payload: ClassSessionBundleSelections = {
    kind: 'class_session_bundle',
    dateIso: params.dateIso,
    sessionIds: params.sessionIds,
    items: params.items,
  };
  return payload;
}

export function buildClassPackageSelections(params: {
  sessionIds: string[];
  weekdays: number[];
}): Prisma.InputJsonValue {
  const payload: ClassPackageSelections = {
    kind: 'class_package',
    sessionIds: params.sessionIds,
    weekdays: params.weekdays,
  };
  return payload;
}

export function buildClassMonthPackageSelections(params: {
  monthIso: string;
  sessionIds: string[];
  items: ClassMonthPackageSelectionItem[];
}): Prisma.InputJsonValue {
  const payload: ClassMonthPackageSelections = {
    kind: 'class_month_package',
    monthIso: params.monthIso,
    sessionIds: params.sessionIds,
    sessionCount: params.sessionIds.length,
    items: params.items,
  };
  return payload;
}
