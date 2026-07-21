"use client";

import AdminModal from "@/components/admin/AdminModal";
import { InquiryDetailsReadable } from "@/components/admin/InquiryDetailsReadable";
import { cn } from "@/lib/utils";
import {
  buildCustomerRows,
  buildPaymentRows,
  buildPurchaseRows,
} from "../lib/buildPaymentHistorySummaryRows";
import {
  flowLabel,
  statusLabel,
} from "../lib/paymentHistoryDisplay";
import { paymentStatusStyles } from "../lib/paymentHistoryStatusStyles";
import { usePaymentHistoryDetail } from "../hooks/usePaymentHistoryDetail";
import type { AdminStripePaymentRow } from "../types/paymentHistory.types";

type Props = {
  row: AdminStripePaymentRow | null;
  isOpen: boolean;
  onClose: () => void;
};

export default function PaymentHistoryDetailModal({
  row,
  isOpen,
  onClose,
}: Props) {
  const { detail, isLoadingDetail, detailError } = usePaymentHistoryDetail(
    row ? { flow: row.flow, id: row.id } : null,
    isOpen,
  );

  const { badgeClass, Icon } = row
    ? paymentStatusStyles(row.status)
    : paymentStatusStyles("PENDING");

  return (
    <AdminModal title="Payment summary" isOpen={isOpen} onClose={onClose}>
      {row ? (
      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded border border-gold/25 bg-gold/10 px-2.5 py-0.5 font-brand text-[10px] tracking-widest text-gold">
            {flowLabel(row.flow)}
          </span>
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded border px-2 py-0.5 font-brand text-[10px] tracking-widest",
              badgeClass,
            )}
          >
            <Icon className="h-3 w-3" strokeWidth={2} />
            {statusLabel(row.status)}
          </span>
          {isLoadingDetail ? (
            <span className="text-xs text-foreground/50">Loading details…</span>
          ) : null}
        </div>

        {detailError ? (
          <p className="rounded-lg border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
            {detailError} Showing summary from the list.
          </p>
        ) : null}

        <InquiryDetailsReadable
          rows={buildCustomerRows(row, detail)}
          sectionTitle="CUSTOMER"
        />
        <InquiryDetailsReadable
          rows={buildPurchaseRows(row, detail)}
          sectionTitle="PURCHASE"
        />
        <InquiryDetailsReadable
          rows={buildPaymentRows(row)}
          sectionTitle="PAYMENT"
        />

        <div className="flex justify-end border-t border-gold/15 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gold/30 px-4 py-2 font-brand text-xs tracking-widest text-gold transition hover:bg-gold/10"
          >
            Close
          </button>
        </div>
      </div>
      ) : null}
    </AdminModal>
  );
}
