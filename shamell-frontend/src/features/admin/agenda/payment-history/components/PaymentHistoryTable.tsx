"use client";

import { cn } from "@/lib/utils";
import {
  flowLabel,
  formatPaymentAmount,
  formatPaymentDate,
  stageLabel,
  statusLabel,
} from "../lib/paymentHistoryDisplay";
import { paymentStatusStyles } from "../lib/paymentHistoryStatusStyles";
import type { AdminStripePaymentRow } from "../types/paymentHistory.types";

type PaymentHistoryTableProps = {
  items: AdminStripePaymentRow[];
  onViewPayment: (row: AdminStripePaymentRow) => void;
};

export default function PaymentHistoryTable({
  items,
  onViewPayment,
}: PaymentHistoryTableProps) {
  return (
    <div className="hidden overflow-x-auto rounded-xl border border-gold/14 md:block">
      <table className="min-w-full text-left text-sm">
        <thead className="border-b border-gold/12 bg-gold/5 text-xs uppercase tracking-wider text-gold/80">
          <tr>
            <th className="px-4 py-3">Date</th>
            <th className="px-4 py-3">Flow</th>
            <th className="px-4 py-3">Customer</th>
            <th className="px-4 py-3">Context</th>
            <th className="px-4 py-3">Amount</th>
            <th className="px-4 py-3">Payment</th>
            <th className="px-4 py-3">Stage</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {items.map((row) => {
            const { badgeClass, Icon } = paymentStatusStyles(row.status);
            return (
              <tr key={`${row.flow}-${row.id}`} className="border-b border-white/5">
                <td className="px-4 py-3 text-xs text-foreground/65">
                  {formatPaymentDate(row.paidAt ?? row.createdAt)}
                </td>
                <td className="px-4 py-3 font-brand text-xs tracking-widest text-gold/90">
                  {flowLabel(row.flow)}
                </td>
                <td className="px-4 py-3">
                  <p className="font-medium">{row.customerName}</p>
                  <p className="text-xs text-foreground/55">{row.customerEmail}</p>
                </td>
                <td className="max-w-[14rem] px-4 py-3 text-foreground/80">
                  {row.contextLabel}
                </td>
                <td className="px-4 py-3">
                  {formatPaymentAmount(row.amount, row.currency)}
                </td>
                <td className="px-4 py-3 text-xs text-foreground/70">
                  {row.paymentMethodLabel ?? "—"}
                </td>
                <td className="px-4 py-3 text-foreground/70">
                  {stageLabel(row.stage)}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded border px-2 py-0.5 text-[10px] font-brand tracking-widest",
                      badgeClass,
                    )}
                  >
                    <Icon className="h-3 w-3" strokeWidth={2} />
                    {statusLabel(row.status)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => onViewPayment(row)}
                    className="text-xs text-gold hover:underline"
                  >
                    View
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
