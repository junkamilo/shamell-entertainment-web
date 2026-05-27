"use client";

import AdminAccordionSingleSelect, {
  type AdminAccordionSingleOption,
} from "@/components/admin/AdminAccordionSingleSelect";
import AdminModuleHero from "@/components/admin/AdminModuleHero";
import AdminPagination from "@/components/admin/AdminPagination";
import {
  TABLE_SIZE_LABELS,
  type VenueTableSize,
} from "@/components/floor-layout/layoutTypes";
import { formatPriceEn } from "@/lib/pricing";
import { useAdminVenueReservationsPage } from "../hooks/useAdminVenueReservationsPage";

const STATUS_FILTER_OPTIONS: AdminAccordionSingleOption[] = [
  { id: "", label: "All" },
  { id: "PAID", label: "Paid" },
  { id: "PENDING_PAYMENT", label: "Pending payment" },
  { id: "EXPIRED", label: "Expired" },
  { id: "CANCELLED", label: "Cancelled" },
];

function formatReservationSeatLabel(r: {
  kind: string;
  tableName: string | null;
  tableSize: string | null;
}): string {
  if (r.kind === "standalone_chair") return "Chair";
  const size = r.tableSize as VenueTableSize | null;
  if (size && TABLE_SIZE_LABELS[size]) return TABLE_SIZE_LABELS[size];
  return r.tableName ?? "—";
}

export function VenueReservationsAdminPage() {
  const page = useAdminVenueReservationsPage();

  return (
    <div className="mx-auto w-full max-w-6xl">
      <AdminModuleHero title="Seat reservations" bordered={false} />

      <div className="mb-6 flex flex-wrap items-end gap-4">
        <div className="w-full min-w-[12rem] max-w-xs">
          <span className="mb-1.5 block font-brand text-xs tracking-[0.14em] text-gold">
            Status
          </span>
          <AdminAccordionSingleSelect
            ariaLabel="Filter by reservation status"
            options={STATUS_FILTER_OPTIONS}
            value={page.statusFilter}
            onChange={page.setStatusFilter}
            showNoneOption={false}
            className="[&_button]:min-h-11 [&_button]:py-2.5 [&_button]:text-sm"
          />
        </div>
        <button
          type="button"
          onClick={() => void page.reload()}
          className="shamell-glass-trigger rounded-xl border border-gold/30 px-4 py-2.5 font-brand text-xs uppercase tracking-[0.12em] text-foreground/85 transition hover:border-gold/45 hover:text-gold"
        >
          Refresh
        </button>
      </div>

      {page.isLoading ? (
        <p className="text-sm text-foreground/55">Loading reservations…</p>
      ) : page.paginationMeta.totalItems === 0 ? (
        <p className="text-sm text-foreground/55">No reservations found.</p>
      ) : (
        <div className="space-y-4">
          <div className="overflow-x-auto rounded-xl border border-gold/14">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-gold/12 bg-gold/5 text-xs uppercase tracking-wider text-gold/80">
                <tr>
                  <th className="px-4 py-3">Guest</th>
                  <th className="px-4 py-3">Seat</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Paid</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {page.reservations.map((r) => (
                  <tr key={r.id} className="border-b border-white/5">
                    <td className="px-4 py-3">
                      <p className="font-medium">{r.customerName}</p>
                      <p className="text-xs text-foreground/55">{r.customerEmail}</p>
                    </td>
                    <td className="px-4 py-3">{formatReservationSeatLabel(r)}</td>
                    <td className="px-4 py-3">{formatPriceEn(r.amount)}</td>
                    <td className="px-4 py-3">{r.status}</td>
                    <td className="px-4 py-3 text-xs text-foreground/60">
                      {r.paidAt ? new Date(r.paidAt).toLocaleString() : "—"}
                    </td>
                    <td className="px-4 py-3">
                      {r.status === "PAID" || r.status === "PENDING_PAYMENT" ? (
                        <button
                          type="button"
                          disabled={page.cancellingId === r.id}
                          onClick={() => void page.cancelReservation(r.id)}
                          className="text-xs text-red-300 hover:underline disabled:opacity-50"
                        >
                          Cancel
                        </button>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <AdminPagination
            meta={page.paginationMeta}
            onPageChange={page.onPageChange}
            onPerPageChange={page.onPerPageChange}
            className="border-t border-gold/12 pt-4"
          />
        </div>
      )}
    </div>
  );
}
