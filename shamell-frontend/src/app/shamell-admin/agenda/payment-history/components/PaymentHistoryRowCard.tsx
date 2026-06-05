"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  flowLabel,
  formatPaymentAmount,
  formatPaymentDate,
  paymentRowActionHref,
  stageLabel,
  statusLabel,
} from "../lib/paymentHistoryDisplay";
import { paymentStatusStyles } from "../lib/paymentHistoryStatusStyles";
import type { AdminStripePaymentRow } from "../types/paymentHistory.types";

type PaymentHistoryRowCardProps = {
  row: AdminStripePaymentRow;
};

export default function PaymentHistoryRowCard({ row }: PaymentHistoryRowCardProps) {
  const { badgeClass, Icon } = paymentStatusStyles(row.status);
  const actionHref = paymentRowActionHref(row);

  return (
    <article className="shamell-glass-surface rounded-xl border border-gold/15 p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-brand text-sm tracking-wide text-gold">
            {flowLabel(row.flow)}
          </p>
          <p className="mt-1 font-body text-base text-foreground/90">
            {row.customerName}
          </p>
          <p className="text-sm text-foreground/55">{row.customerEmail}</p>
        </div>
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded border px-2 py-0.5 font-brand text-[10px] tracking-widest",
            badgeClass,
          )}
        >
          <Icon className="h-3 w-3" strokeWidth={2} />
          {statusLabel(row.status)}
        </span>
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        <dt className="text-foreground/50">Context</dt>
        <dd className="text-foreground/85">{row.contextLabel}</dd>
        <dt className="text-foreground/50">Amount</dt>
        <dd>{formatPaymentAmount(row.amount, row.currency)}</dd>
        <dt className="text-foreground/50">Payment method</dt>
        <dd>{row.paymentMethodLabel ?? "—"}</dd>
        <dt className="text-foreground/50">Stage</dt>
        <dd>{stageLabel(row.stage)}</dd>
        <dt className="text-foreground/50">Date</dt>
        <dd>{formatPaymentDate(row.paidAt ?? row.createdAt)}</dd>
      </dl>
      {actionHref ? (
        <Link
          href={actionHref}
          className="mt-4 inline-block font-brand text-xs tracking-widest text-gold hover:underline"
        >
          View details →
        </Link>
      ) : null}
    </article>
  );
}
