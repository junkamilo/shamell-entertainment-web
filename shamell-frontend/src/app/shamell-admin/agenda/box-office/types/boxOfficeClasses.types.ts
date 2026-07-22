import type { ClassSessionPublic } from "@/app/on-coming-events/services/fetchUpcomingClassSessions";
import type {
  MonthPackageOffer,
  OnComingEventSchedule,
} from "@/app/on-coming-events/services/fetchOnComingEventDetail";
import type { BoxOfficePaymentMethod } from "./boxOfficeFixed.types";

export type BoxOfficeClassPurchaseKind =
  | "session"
  | "day_bundle"
  | "month_package";

export type BoxOfficeClassBookingKind = "day" | "month";

export type BoxOfficeClassEventOption = {
  id: string;
  name: string;
  slug: string | null;
};

export type BoxOfficeClassEventContext = {
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

export type BoxOfficeClassesDetailsPayload = {
  source: "box_office";
  mode: "classes";
  purchaseKind: BoxOfficeClassPurchaseKind;
  upcomingEventId: string;
  paymentMethod: BoxOfficePaymentMethod;
  customer: {
    fullName: string;
    email: string;
    phone: string | null;
  };
  selection: Record<string, unknown>;
  submittedAt: string;
};

export type CreateBoxOfficeClassEnrollmentBody = {
  purchaseKind: BoxOfficeClassPurchaseKind;
  upcomingEventId: string;
  sessionId?: string;
  sessionIds?: string[];
  monthIso?: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  boxOfficeDetails: BoxOfficeClassesDetailsPayload;
};
