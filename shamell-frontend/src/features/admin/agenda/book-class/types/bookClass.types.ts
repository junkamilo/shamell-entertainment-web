import type { ClassSessionPublic } from "@/app/on-coming-events/services/fetchUpcomingClassSessions";
import type {
  MonthPackageOffer,
  OnComingEventSchedule,
} from "@/app/on-coming-events/services/fetchOnComingEventDetail";

export type BookClassEventOption = {
  id: string;
  name: string;
  slug: string | null;
};

export type BookClassEventContext = {
  event: {
    id: string;
    slug: string | null;
    name: string;
    timezone: string;
  };
  schedule: OnComingEventSchedule | null;
  sessions: ClassSessionPublic[];
  monthPackage: MonthPackageOffer | null;
  readiness?: {
    isBookable: boolean;
    reasons: Array<
      | "missing_slug"
      | "not_recurring"
      | "no_weekdays"
      | "no_sections"
      | "no_sessions"
    >;
  };
};

export type BookClassPurchaseKind = "session" | "day_bundle" | "month_package";

export type BookClassBookingKind = "day" | "month";

export type BookClassPaymentMethod = "stripe" | "cash";

export type CreateAdminClassEnrollmentBody = {
  purchaseKind: BookClassPurchaseKind;
  upcomingEventId: string;
  sessionId?: string;
  sessionIds?: string[];
  monthIso?: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
};
