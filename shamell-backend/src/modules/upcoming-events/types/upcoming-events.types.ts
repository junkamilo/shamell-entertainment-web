import type { ReservationEventScheduleMode } from '@prisma/client';
import type { EmailBranding } from '../../mail/utils/email-html-branding';

export type UpcomingPurchaseMode =
  | 'none'
  | 'classes'
  | 'venue_seating'
  | 'fixed_ticket';

export type BookClassReadinessReason =
  | 'missing_slug'
  | 'not_recurring'
  | 'no_weekdays'
  | 'no_sections'
  | 'no_sessions';

export type ClassEventTemplateSnapshot = {
  scheduleMode: ReservationEventScheduleMode;
  timezone: string;
  activeWeekdayCount: number;
  activeSectionCount: number;
};

export type AssessClassReadinessInput = {
  slug: string | null | undefined;
  template: ClassEventTemplateSnapshot | null;
  upcomingSessionCount: number;
};

export type ClassReadinessAssessment = {
  isBookable: boolean;
  reasons: BookClassReadinessReason[];
};

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

export type PublicClassSectionDisplay = {
  id: string;
  label: string | null;
  startTime: string;
  endTime: string;
  sortOrder: number;
};

export type PublicRecurringDayDisplay = {
  weekday: number;
  label: string;
  sections: PublicClassSectionDisplay[];
};

export type PublicScheduleDisplay =
  | {
      mode: 'FIXED_EVENT';
      timezone: string;
      summary: string;
      salesWindow: { start: string; end: string } | null;
      eventDate: string | null;
      startTime: string | null;
      endTime: string | null;
    }
  | {
      mode: 'RECURRING_WEEKLY';
      timezone: string;
      summary: string;
      effectiveFrom: string | null;
      weekdayLabels: string[];
      startTime: string | null;
      endTime: string | null;
      days: PublicRecurringDayDisplay[];
    };

export type RegenerateClassSessionsResult = {
  upserted: number;
  deactivated: number;
};

export type ClassPaymentRequestInput = {
  recipientName: string;
  appPublicName: string;
  frontendBaseUrl?: string;
  branding?: EmailBranding;
  enrollmentReference: string;
  eventLabel: string;
  classLabel: string;
  amountUsd: string;
  payUrl: string;
};

export type ClassBundleLineItem = {
  sessionLabel: string;
  amount: string;
  confirmationReference: string;
};
