import { CheckCircle2, Clock, XCircle } from "lucide-react";
import type { AdminPaymentStatus } from "../types/paymentHistory.types";

export function paymentStatusStyles(status: AdminPaymentStatus): {
  badgeClass: string;
  Icon: typeof CheckCircle2;
} {
  switch (status) {
    case "PAID":
      return {
        badgeClass:
          "border-emerald-400/45 text-emerald-200 bg-emerald-500/10",
        Icon: CheckCircle2,
      };
    case "PENDING":
      return {
        badgeClass: "border-gold/40 text-gold bg-gold/10",
        Icon: Clock,
      };
    case "EXPIRED":
      return {
        badgeClass: "border-amber-400/45 text-amber-200 bg-amber-500/10",
        Icon: Clock,
      };
    case "CANCELLED":
      return {
        badgeClass: "border-red-400/45 text-red-200 bg-red-500/10",
        Icon: XCircle,
      };
  }
}
