import { Prisma } from '@prisma/client';
import type {
  ClassMonthPackageSelectionItem,
  ClassMonthPackageSelections,
  ClassPackageSelections,
  ClassSessionBundleSelectionItem,
  ClassSessionBundleSelections,
} from '../types/upcoming-events.types';

export type {
  ClassMonthPackageSelectionItem,
  ClassMonthPackageSelections,
  ClassPackageSelections,
  ClassSessionBundleSelectionItem,
  ClassSessionBundleSelections,
} from '../types/upcoming-events.types';

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
