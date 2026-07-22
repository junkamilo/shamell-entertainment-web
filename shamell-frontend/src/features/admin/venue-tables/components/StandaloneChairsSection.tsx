"use client";

import { BlockedActionModal, ConfirmDeleteModal, ConfirmDeleteMessage } from "@/components/admin/overlays";
import { EmptyState, Pagination } from "@/components/admin/data-display";
import { Armchair } from "lucide-react";
import { useStandaloneChairsPage } from "../hooks/useStandaloneChairsPage";
import { formatStandaloneChairShortId } from "../lib/mapStandaloneChairFromApi";
import StandaloneChairEditPriceModal from "./StandaloneChairEditPriceModal";
import StandaloneChairsBulkEditPriceModal from "./StandaloneChairsBulkEditPriceModal";
import StandaloneChairsConfiguratorModal from "./StandaloneChairsConfiguratorModal";
import StandaloneChairsDeleteAllModal from "./StandaloneChairsDeleteAllModal";
import StandaloneChairsMobileCard from "./StandaloneChairsMobileCard";
import StandaloneChairsTable from "./StandaloneChairsTable";

type Props = {
  modalOpen: boolean;
  onModalOpenChange: (open: boolean) => void;
};

export default function StandaloneChairsSection({ modalOpen, onModalOpenChange }: Props) {
  const page = useStandaloneChairsPage({
    addModalOpen: modalOpen,
    onAddModalOpenChange: onModalOpenChange,
  });

  if (page.config.loading) {
    return (
      <section className="rounded-xl border border-shamell-line-soft bg-shamell-twilight/20 p-6 text-sm text-shamell-text-primary/70">
        Loading standalone chair configuration…
      </section>
    );
  }

  const { config } = page;
  const showPagination = config.chairs.length > 10;

  return (
    <>
      <section className="min-w-0 overflow-hidden rounded-xl border border-shamell-line-soft bg-shamell-twilight/25 p-6">
        {config.chairs.length === 0 ? (
          <EmptyState
            title="No standalone chairs yet"
            description="Add chairs with a unit price. Each one gets an automatic internal ID."
            tone="primary"
            icon={Armchair}
            action={{
              label: "Configure chairs",
              onClick: () => onModalOpenChange(true),
            }}
          />
        ) : (
          <div className="min-w-0 overflow-hidden rounded-lg border border-shamell-line-soft/80 bg-black/10 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-shamell-gold">
                Inventory ({config.chairs.length}
                {config.reservedCount > 0
                  ? ` · ${config.reservedCount} reserved`
                  : ""}
                )
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={page.openBulkEdit}
                  className="rounded-lg border border-gold/30 px-3 py-1.5 font-brand text-[11px] uppercase tracking-[0.1em] text-gold transition hover:bg-gold/10"
                >
                  Edit all prices
                </button>
                <button
                  type="button"
                  onClick={page.openDeleteAll}
                  className="rounded-lg border border-red-400/40 px-3 py-1.5 font-brand text-[11px] uppercase tracking-[0.1em] text-red-200/90 transition hover:bg-red-500/10"
                >
                  Delete all chairs
                </button>
              </div>
            </div>
            <div className="mt-3 min-w-0">
              <div className="grid min-w-0 gap-3 lg:hidden">
                {page.pagedChairs.map((chair) => (
                  <StandaloneChairsMobileCard
                    key={chair.id}
                    item={chair}
                    onEdit={page.openEditChair}
                    onDelete={page.openDeleteChair}
                  />
                ))}
              </div>
              <StandaloneChairsTable
                chairs={page.pagedChairs}
                onEdit={page.openEditChair}
                onDelete={page.openDeleteChair}
              />
            </div>
            {showPagination ? (
              <Pagination
                className="mt-4 border-t border-gold/10 pt-4"
                meta={page.paginationMeta}
                onPageChange={page.setPage}
                onPerPageChange={(next) => {
                  page.setPerPage(next);
                  page.setPage(1);
                }}
              />
            ) : null}
          </div>
        )}
      </section>

      <StandaloneChairsConfiguratorModal
        open={modalOpen}
        currentCount={config.chairs.length}
        defaultUnitPrice={config.unitPrice}
        onClose={() => onModalOpenChange(false)}
        onSaved={() => void config.reload()}
      />

      <StandaloneChairEditPriceModal
        chair={page.editChair}
        unitPriceInput={page.editPriceInput}
        onUnitPriceChange={page.setEditPriceInput}
        isSaving={page.savingEdit}
        onClose={() => page.setEditChair(null)}
        onConfirm={() => void page.confirmEditChair()}
      />

      <StandaloneChairsBulkEditPriceModal
        open={page.bulkEditOpen}
        chairCount={config.chairs.length}
        unitPriceInput={page.bulkPriceInput}
        onUnitPriceChange={page.setBulkPriceInput}
        isSaving={page.savingBulkEdit}
        onClose={() => page.setBulkEditOpen(false)}
        onConfirm={() => void page.confirmBulkEdit()}
      />

      <ConfirmDeleteModal
        title="Delete chair"
        isOpen={Boolean(page.deleteChair)}
        isDeleting={page.deletingOne}
        onClose={() => page.setDeleteChair(null)}
        onConfirm={() => void page.confirmDeleteChair()}
      >
        {page.deleteChair ? (
          <ConfirmDeleteMessage
            entityLabel="standalone chair"
            name={page.deleteChair.displayLabel}
            meta={`${formatStandaloneChairShortId(page.deleteChair.id)}${
              page.deleteChair.isOnFloorPlan ? " · on floor layout" : ""
            }`}
            consequences={[
              "The chair will be removed from the venue floor layout if placed there.",
              "This action cannot be undone.",
            ]}
          />
        ) : null}
      </ConfirmDeleteModal>

      <StandaloneChairsDeleteAllModal
        open={page.deleteAllOpen}
        chairCount={config.chairs.length}
        isDeleting={page.deletingAll}
        onClose={() => page.setDeleteAllOpen(false)}
        onConfirm={() => void page.confirmDeleteAll()}
      />

      <BlockedActionModal
        isOpen={page.blockedWarning.isOpen}
        onClose={page.blockedWarning.closeWarning}
        title={page.blockedWarning.title}
        description={page.blockedWarning.description}
      />
    </>
  );
}
