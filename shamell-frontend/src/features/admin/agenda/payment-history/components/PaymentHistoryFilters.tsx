"use client";

import { AccordionSingleSelect, type AccordionOption as AdminAccordionSingleOption } from "@/components/admin/inputs";
import Link from "next/link";
import type {
  AdminPaymentFlow,
  AdminPaymentStatus,
} from "../types/paymentHistory.types";

const FLOW_OPTIONS: AdminAccordionSingleOption[] = [
  { id: "", label: "All flows" },
  { id: "BOOKING_QUOTE", label: "Book" },
  { id: "VENUE_SEAT", label: "Venue seat" },
  { id: "CLASS_SESSION", label: "Class" },
  { id: "FIXED_TICKET", label: "Fixed ticket" },
];

const STATUS_OPTIONS: AdminAccordionSingleOption[] = [
  { id: "", label: "All statuses" },
  { id: "PENDING", label: "Pending" },
  { id: "PAID", label: "Paid" },
  { id: "EXPIRED", label: "Expired" },
  { id: "CANCELLED", label: "Cancelled" },
];

type PaymentHistoryFiltersProps = {
  flowFilter: AdminPaymentFlow | "";
  statusFilter: AdminPaymentStatus | "";
  search: string;
  onFlowChange: (value: AdminPaymentFlow | "") => void;
  onStatusChange: (value: AdminPaymentStatus | "") => void;
  onSearchChange: (value: string) => void;
  onApplySearch: () => void;
  onRefresh: () => void;
};

export default function PaymentHistoryFilters({
  flowFilter,
  statusFilter,
  search,
  onFlowChange,
  onStatusChange,
  onSearchChange,
  onApplySearch,
  onRefresh,
}: PaymentHistoryFiltersProps) {
  return (
    <div className="mb-6 space-y-4">
      <div className="flex flex-wrap items-end gap-4">
        <div className="w-full min-w-[10rem] max-w-xs">
          <span className="mb-1.5 block font-brand text-xs tracking-[0.14em] text-gold">
            Flow
          </span>
          <AccordionSingleSelect
            ariaLabel="Filter by payment flow"
            options={FLOW_OPTIONS}
            value={flowFilter}
            onChange={(id) => onFlowChange(id as AdminPaymentFlow | "")}
            showNoneOption={false}
          />
        </div>
        <div className="w-full min-w-[10rem] max-w-xs">
          <span className="mb-1.5 block font-brand text-xs tracking-[0.14em] text-gold">
            Status
          </span>
          <AccordionSingleSelect
            ariaLabel="Filter by payment status"
            options={STATUS_OPTIONS}
            value={statusFilter}
            onChange={(id) => onStatusChange(id as AdminPaymentStatus | "")}
            showNoneOption={false}
          />
        </div>
        <button
          type="button"
          onClick={onRefresh}
          className="shamell-glass-trigger rounded-xl border border-gold/30 px-4 py-2.5 font-brand text-xs uppercase tracking-[0.12em] text-foreground/85 transition hover:border-gold/45 hover:text-gold"
        >
          Refresh
        </button>
      </div>
      <form
        className="flex flex-col gap-2 sm:flex-row sm:items-center"
        onSubmit={(e) => {
          e.preventDefault();
          onApplySearch();
        }}
      >
        <input
          type="search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by name or email"
          className="shamell-glass-surface min-h-11 flex-1 rounded-xl border border-gold/20 px-4 py-2.5 font-body text-sm text-foreground/90 placeholder:text-foreground/40"
        />
        <button
          type="submit"
          className="rounded-xl border border-gold/35 px-4 py-2.5 font-brand text-xs tracking-widest text-gold transition hover:bg-gold/10"
        >
          Search
        </button>
      </form>
    </div>
  );
}
