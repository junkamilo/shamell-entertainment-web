"use client";

import AdminBackButton from "@/components/admin/AdminBackButton";
import AdminModuleHero from "@/components/admin/AdminModuleHero";
import AdminPagination from "@/components/admin/AdminPagination";
import { AGENDA_HUB_PATH } from "../../agendar/lib/agendarRoutes";
import { usePaymentHistoryPage } from "../hooks/usePaymentHistoryPage";
import PaymentHistoryFilters from "./PaymentHistoryFilters";
import PaymentHistoryRowCard from "./PaymentHistoryRowCard";
import PaymentHistoryTable from "./PaymentHistoryTable";

export default function PaymentHistoryPageContent() {
  const page = usePaymentHistoryPage();

  return (
    <div className="mx-auto w-full min-w-0 max-w-6xl">
      <AdminBackButton href={AGENDA_HUB_PATH} label="Back" className="mb-4" />
      <AdminModuleHero
        title="Payment history"
        subtitle="All Stripe payments: bookings, venue seats, classes, and fixed tickets."
        bordered={false}
      />

      <PaymentHistoryFilters
        flowFilter={page.flowFilter}
        statusFilter={page.statusFilter}
        search={page.search}
        onFlowChange={(value) => {
          page.setFlowFilter(value);
          page.setPage(1);
        }}
        onStatusChange={(value) => {
          page.setStatusFilter(value);
          page.setPage(1);
        }}
        onSearchChange={page.setSearch}
        onApplySearch={() => {
          page.setPage(1);
          void page.reload();
        }}
        onRefresh={() => void page.reload()}
      />

      {page.error ? (
        <p className="text-sm text-red-300">{page.error}</p>
      ) : page.isLoading ? (
        <p className="text-sm text-foreground/55">Loading payment history…</p>
      ) : page.items.length === 0 ? (
        <p className="text-sm text-foreground/55">No payments found.</p>
      ) : (
        <>
          <PaymentHistoryTable items={page.items} />
          <div className="mt-4 space-y-3 md:hidden">
            {page.items.map((row) => (
              <PaymentHistoryRowCard key={`${row.flow}-${row.id}`} row={row} />
            ))}
          </div>
          <AdminPagination
            className="mt-6"
            meta={{
              page: page.meta.page,
              perPage: page.perPage,
              totalItems: page.meta.totalItems,
              totalPages: page.meta.totalPages,
              hasPrev: page.meta.hasPrev,
              hasNext: page.meta.hasNext,
            }}
            onPageChange={page.setPage}
            onPerPageChange={page.setPerPage}
          />
        </>
      )}
    </div>
  );
}
