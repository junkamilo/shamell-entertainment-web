"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "@/hooks/use-toast";
import { getAdminBearerToken } from "@/app/admin/shared/lib/adminAuth";
import AdminCatalogEmptyState from "@/components/admin/AdminCatalogEmptyState";
import AdminModuleHero from "@/components/admin/AdminModuleHero";
import { SEATING_LAYOUT_ADMIN_LABEL } from "@/lib/onComingEventsRoutes";
import AdminPagination from "@/components/admin/AdminPagination";
import { deleteAdminVenueTable } from "../services/deleteAdminVenueTable";
import { deleteAdminVenueTablesBulk } from "../services/deleteAdminVenueTablesBulk";
import { useVenueTablesList } from "../hooks/useVenueTablesList";
import {
  formatVenueTableDisplayLabel,
  TABLE_SIZE_CONFIG,
  TABLE_SIZE_ORDER,
} from "../lib/tableSizeConfig";
import type { VenueTableConfig } from "../types/venueTables.types";
import type { VenueSeatingSection } from "../types/venueSeatingSection";
import type { TableSize } from "../types/venueTables.types";
import StandaloneChairsSection from "./StandaloneChairsSection";
import TableConfiguratorModal from "./TableConfiguratorModal";
import VenueSeatingSectionTabs from "./VenueSeatingSectionTabs";
import VenueTablesBulkDeleteModal, {
  type VenueTablesBulkDeleteScope,
} from "./VenueTablesBulkDeleteModal";
import VenueTablesList from "./VenueTablesList";

export default function VenueTablesPageContent() {
  const { items, loading, error, reload } = useVenueTablesList();
  const [section, setSection] = useState<VenueSeatingSection>("tables");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<VenueTableConfig | null>(null);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [sizeFilter, setSizeFilter] = useState<"ALL" | TableSize>("ALL");
  const [deletingScope, setDeletingScope] = useState<VenueTablesBulkDeleteScope | null>(null);
  const [pendingBulkDelete, setPendingBulkDelete] = useState<{
    scope: VenueTablesBulkDeleteScope;
    count: number;
  } | null>(null);

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (item: VenueTableConfig) => {
    setEditing(item);
    setModalOpen(true);
  };

  const handleDeactivate = async (item: VenueTableConfig) => {
    const token = getAdminBearerToken();
    if (!token) return;
    const result = await deleteAdminVenueTable(token, item.id);
    if (!result.ok) {
      toast({ variant: "destructive", title: "Could not deactivate table" });
      return;
    }
    toast({
      title: "Table deactivated",
      description: formatVenueTableDisplayLabel(item),
    });
    void reload();
  };

  const requestDeleteBulk = (scope: VenueTablesBulkDeleteScope) => {
    const targetCount =
      scope === "ALL"
        ? activeItems.length
        : activeItems.filter((item) => item.size === scope).length;
    if (targetCount === 0) return;
    setPendingBulkDelete({ scope, count: targetCount });
  };

  const handleConfirmDeleteBulk = async () => {
    if (!pendingBulkDelete) return;
    const { scope, count: targetCount } = pendingBulkDelete;

    const token = getAdminBearerToken();
    if (!token) return;

    setDeletingScope(scope);
    const result = await deleteAdminVenueTablesBulk(
      token,
      scope === "ALL" ? { scope: "ALL" } : { scope: "SIZE", size: scope },
    );
    setDeletingScope(null);
    setPendingBulkDelete(null);

    if (!result.ok) {
      toast({
        variant: "destructive",
        title: "Bulk delete failed",
        description: "Could not delete the selected tables.",
      });
      return;
    }

    setPage(1);
    setSizeFilter("ALL");
    toast({
      title: "Tables deleted",
      description: `${result.deletedCount ?? targetCount} records removed.`,
    });
    void reload();
  };

  const activeItems = items.filter((i) => i.isActive);
  const isTablesSection = section === "tables";
  const availableSizes = useMemo(
    () =>
      TABLE_SIZE_ORDER.filter((size) =>
        activeItems.some((item) => item.size === size),
      ),
    [activeItems],
  );

  useEffect(() => {
    if (sizeFilter !== "ALL" && !availableSizes.includes(sizeFilter)) {
      setSizeFilter("ALL");
    }
  }, [availableSizes, sizeFilter]);

  const filteredItems = useMemo(() => {
    if (sizeFilter === "ALL") return activeItems;
    return activeItems.filter((item) => item.size === sizeFilter);
  }, [activeItems, sizeFilter]);

  const totalItems = filteredItems.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / perPage));

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const pagedItems = useMemo(() => {
    const start = (page - 1) * perPage;
    return filteredItems.slice(start, start + perPage);
  }, [filteredItems, page, perPage]);

  const paginationMeta = {
    page,
    perPage,
    totalItems,
    totalPages,
    hasPrev: page > 1,
    hasNext: page < totalPages,
  };

  return (
    <div className="mx-auto w-full min-w-0 max-w-6xl overflow-x-hidden px-4 pb-8 md:px-6">
      <AdminModuleHero
        title="Table seating"
        subtitle={
          isTablesSection
            ? "Configure tables with combo pricing and included chairs."
            : `Set how many standalone chairs are available and their unit price for ${SEATING_LAYOUT_ADMIN_LABEL.toLowerCase()}.`
        }
        actionLabel={isTablesSection ? "Configure table" : undefined}
        onAction={isTablesSection ? openCreate : undefined}
        extraActions={
          <VenueSeatingSectionTabs value={section} onChange={setSection} />
        }
        bordered={false}
      />

      {isTablesSection ? (
        <>
          {loading ? (
            <div className="flex items-center justify-center py-16 text-foreground/70">
              Loading table configurations…
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16">
              <p className="text-destructive">{error}</p>
              <button
                type="button"
                onClick={() => void reload()}
                className="admin-btn-secondary px-5 py-2.5 font-brand text-sm"
              >
                Retry
              </button>
            </div>
          ) : activeItems.length === 0 ? (
            <AdminCatalogEmptyState
              title="No tables configured yet"
              description="Create your first table with visual chair placement and bundle pricing."
              action={{ label: "Configure table", onClick: openCreate }}
            />
          ) : (
            <>
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSizeFilter("ALL");
                    setPage(1);
                  }}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold tracking-wide ${
                    sizeFilter === "ALL"
                      ? "border-gold/50 bg-gold/15 text-gold"
                      : "border-shamell-line-soft text-shamell-text-primary/80 hover:border-gold/40"
                  }`}
                >
                  All ({activeItems.length})
                </button>
                {availableSizes.map((size) => {
                  const count = activeItems.filter((item) => item.size === size).length;
                  return (
                    <button
                      key={size}
                      type="button"
                      onClick={() => {
                        setSizeFilter(size);
                        setPage(1);
                      }}
                      className={`rounded-full border px-3 py-1.5 text-xs font-semibold tracking-wide ${
                        sizeFilter === size
                          ? "border-gold/50 bg-gold/15 text-gold"
                          : "border-shamell-line-soft text-shamell-text-primary/80 hover:border-gold/40"
                      }`}
                    >
                      {TABLE_SIZE_CONFIG[size].label} ({count})
                    </button>
                  );
                })}
              </div>
              <VenueTablesList
                sizeFilter={sizeFilter}
                activeItems={activeItems}
                viewItems={filteredItems}
                visibleItems={pagedItems}
                onEdit={openEdit}
                onDeactivate={handleDeactivate}
                onDeleteAll={() => requestDeleteBulk("ALL")}
                onDeleteSize={(size) => requestDeleteBulk(size)}
                deletingScope={deletingScope}
              />
              <AdminPagination
                className="mt-6 border-t border-gold/10 pt-4"
                meta={paginationMeta}
                onPageChange={setPage}
                onPerPageChange={(next) => {
                  setPerPage(next);
                  setPage(1);
                }}
              />
            </>
          )}

          <VenueTablesBulkDeleteModal
            pending={pendingBulkDelete}
            isDeleting={deletingScope !== null}
            onClose={() => {
              if (deletingScope) return;
              setPendingBulkDelete(null);
            }}
            onConfirm={() => void handleConfirmDeleteBulk()}
          />

          <TableConfiguratorModal
            key={editing?.id ?? "new"}
            open={modalOpen}
            editing={editing}
            onClose={() => setModalOpen(false)}
            onSaved={() => void reload()}
          />
        </>
      ) : (
        <StandaloneChairsSection />
      )}
    </div>
  );
}
