import type { DaySectionOffer } from "@/app/on-coming-events/lib/buildDaySectionOffers";
import type {
  BoxOfficeClassesDetailsPayload,
  BoxOfficeClassPurchaseKind,
} from "../types/boxOfficeClasses.types";
import type { BoxOfficePaymentMethod } from "../types/boxOfficeFixed.types";

export function buildBoxOfficeClassesDetails(args: {
  purchaseKind: BoxOfficeClassPurchaseKind;
  upcomingEventId: string;
  paymentMethod: BoxOfficePaymentMethod;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  selectedDateIso: string | null;
  weekday: number | null;
  sessionIds: string[];
  sectionOffers: DaySectionOffer[];
  monthIso: string | null;
  monthPackageLabel: string | null;
  monthPackagePrice: number | null;
  monthSessionCount: number | null;
  monthSessionIds: string[];
}): BoxOfficeClassesDetailsPayload {
  const customer = {
    fullName: args.customerName.trim(),
    email: args.customerEmail.trim().toLowerCase(),
    phone: args.customerPhone.trim() || null,
  };

  let selection: Record<string, unknown>;

  if (args.purchaseKind === "month_package") {
    selection = {
      kind: "month_package",
      monthIso: args.monthIso,
      label: args.monthPackageLabel,
      price: args.monthPackagePrice,
      sessionCount: args.monthSessionCount,
      sessionIds: args.monthSessionIds,
      currency: "usd",
    };
  } else if (args.purchaseKind === "day_bundle") {
    const items = args.sessionIds.map((sessionId) => {
      const offer = args.sectionOffers.find((o) => o.sessionId === sessionId);
      return {
        sessionId,
        sectionId: offer?.sectionId ?? null,
        sectionLabel: offer?.label ?? null,
        startTime: offer?.startTime ?? null,
        endTime: offer?.endTime ?? null,
        amount: offer?.price ?? null,
      };
    });
    selection = {
      kind: "day_bundle",
      dateIso: args.selectedDateIso,
      weekday: args.weekday,
      sessionIds: args.sessionIds,
      items,
      amount: items.reduce(
        (sum, row) => sum + (typeof row.amount === "number" ? row.amount : 0),
        0,
      ),
      currency: "usd",
    };
  } else {
    const sessionId = args.sessionIds[0] ?? null;
    const offer = args.sectionOffers.find((o) => o.sessionId === sessionId);
    selection = {
      kind: "session",
      sessionId,
      dateIso: args.selectedDateIso,
      weekday: args.weekday,
      sectionId: offer?.sectionId ?? null,
      sectionLabel: offer?.label ?? null,
      startTime: offer?.startTime ?? null,
      endTime: offer?.endTime ?? null,
      amount: offer?.price ?? null,
      currency: "usd",
    };
  }

  return {
    source: "box_office",
    mode: "classes",
    purchaseKind: args.purchaseKind,
    upcomingEventId: args.upcomingEventId,
    paymentMethod: args.paymentMethod,
    customer,
    selection,
    submittedAt: new Date().toISOString(),
  };
}
