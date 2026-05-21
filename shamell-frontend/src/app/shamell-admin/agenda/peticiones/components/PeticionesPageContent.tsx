"use client";

import { Loader2 } from "lucide-react";
import AdminBackButton from "@/components/admin/AdminBackButton";
import AdminModuleHero from "@/components/admin/AdminModuleHero";
import AdminPagination from "@/components/admin/AdminPagination";
import { AGENDA_HUB_PATH, AGENDA_MI_AGENDA_PATH } from "../lib/peticionesRoutes";
import { usePeticionesPage } from "../hooks/usePeticionesPage";
import PeticionesDeleteModal from "./PeticionesDeleteModal";
import PeticionesLaneTabs from "./PeticionesLaneTabs";
import PeticionesRequestCard from "./PeticionesRequestCard";
import PeticionesStatsBar from "./PeticionesStatsBar";

export default function PeticionesPageContent() {
  const page = usePeticionesPage();

  return (
    <div className="mx-auto w-full min-w-0 max-w-6xl">
      <AdminBackButton href={AGENDA_HUB_PATH} label="Back" className="mb-4" />
      <AdminModuleHero
        title="Inbox"
        subtitle=""
        actionLabel="View calendar"
        actionHref={AGENDA_MI_AGENDA_PATH}
        bordered={false}
      />

      <PeticionesLaneTabs activeLane={page.activeLane} onLaneChange={page.onLaneChange} />

      <PeticionesStatsBar
        isLoading={page.inbox.isLoading}
        totalItems={page.inbox.meta.totalItems}
        pendingCount={page.pendingCount}
        error={page.inbox.error}
        onRefresh={page.inbox.reload}
      />

      <section className="shamell-glass-surface rounded-2xl p-5 md:p-7">
        <div className="min-w-0 space-y-3">
          {page.inbox.isLoading && page.inbox.rows.length === 0 ? (
            <div className="flex items-center justify-center gap-2 py-16 text-sm text-foreground/50">
              <Loader2 className="h-5 w-5 animate-spin text-gold" />
              Loading…
            </div>
          ) : null}

          {!page.inbox.isLoading && page.inbox.rows.length === 0 && !page.inbox.error ? (
            <p className="shamell-glass-surface rounded-xl py-12 text-center font-body text-sm text-foreground/50">
              {page.activeLane === "guidance"
                ? "No concierge guidance requests in this inbox yet."
                : "No bookings or open contact requests in this view yet."}
            </p>
          ) : null}

          {page.inbox.rows.map((row) => (
            <PeticionesRequestCard
              key={row.id}
              row={row}
              expanded={page.expandedId === row.id}
              onToggle={() => page.setExpandedId((id) => (id === row.id ? null : row.id))}
              onCancel={() => page.actions.onCancelContact(row.id)}
              onRemove={() => page.actions.onRemove(row.id)}
              onReserveFromContact={page.actions.onReserveFromContact}
              onCancelBooking={page.actions.onCancelBooking}
              onRemoveBooking={page.actions.onRemoveBooking}
              busyId={page.busyId}
              reservingContactId={page.reservingContactId}
              serviceByInquiryCode={page.catalog.serviceByInquiryCode}
              eventTypeContactCodeById={page.catalog.eventTypeContactCodeById}
              inquiryCodeByCatalogLineId={page.catalog.inquiryCodeByCatalogLineId}
              fallbackServiceId={page.catalog.fallbackServiceId}
              bookingTz={page.actions.bookingTz}
            />
          ))}
        </div>
        <AdminPagination
          className="mt-6 border-t border-gold/10 pt-4"
          meta={page.inbox.meta}
          onPageChange={(next) => page.setPage(next)}
          onPerPageChange={(next) => {
            page.setPerPage(next);
            page.setPage(1);
          }}
        />
      </section>

      <PeticionesDeleteModal
        confirmDelete={page.confirmDelete}
        purgeLinkedInquiryOnDelete={page.purgeLinkedInquiryOnDelete}
        onPurgeLinkedChange={page.setPurgeLinkedInquiryOnDelete}
        onClose={() => page.setConfirmDelete(null)}
        onConfirm={page.onConfirmDelete}
      />
    </div>
  );
}
