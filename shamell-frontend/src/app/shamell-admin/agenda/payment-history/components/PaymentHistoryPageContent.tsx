"use client";

import { useState } from "react";
import AdminBackButton from "@/components/admin/AdminBackButton";
import AdminModuleHero from "@/components/admin/AdminModuleHero";
import AdminPagination from "@/components/admin/AdminPagination";
import { AGENDA_HUB_PATH } from "../../lib/agendaRoutes";
import { usePaymentHistoryPage } from "../hooks/usePaymentHistoryPage";
import PaymentHistoryDetailModal from "./PaymentHistoryDetailModal";
import PaymentHistoryFilters from "./PaymentHistoryFilters";
import PaymentHistoryRowCard from "./PaymentHistoryRowCard";
import PaymentHistoryTable from "./PaymentHistoryTable";
import type { AdminStripePaymentRow } from "../types/paymentHistory.types";

export default function PaymentHistoryPageContent() {
  const page = usePaymentHistoryPage();
  const [selectedPayment, setSelectedPayment] =
    useState<AdminStripePaymentRow | null>(null);

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
          <PaymentHistoryTable
            items={page.items}
            onViewPayment={setSelectedPayment}
          />
          <div className="mt-4 space-y-3 md:hidden">
            {page.items.map((row) => (
              <PaymentHistoryRowCard
                key={`${row.flow}-${row.id}`}
                row={row}
                onViewPayment={setSelectedPayment}
              />
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

      <PaymentHistoryDetailModal
        row={selectedPayment}
        isOpen={Boolean(selectedPayment)}
        onClose={() => setSelectedPayment(null)}
      />
    </div>
  );
}
