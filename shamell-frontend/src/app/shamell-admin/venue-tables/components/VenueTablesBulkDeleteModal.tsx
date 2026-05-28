import AdminModal from "@/components/admin/AdminModal";
import { TABLE_SIZE_CONFIG } from "../lib/tableSizeConfig";
import type { TableSize } from "../types/venueTables.types";

export type VenueTablesBulkDeleteScope = "ALL" | TableSize;

type Props = {
  pending: { scope: VenueTablesBulkDeleteScope; count: number } | null;
  isDeleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

function scopeLabel(scope: VenueTablesBulkDeleteScope): string {
  if (scope === "ALL") return "all tables";
  return `${TABLE_SIZE_CONFIG[scope].label} tables`;
}

export default function VenueTablesBulkDeleteModal({
  pending,
  isDeleting,
  onClose,
  onConfirm,
}: Props) {
  const scope = pending?.scope;
  const count = pending?.count ?? 0;
  const label = scope ? scopeLabel(scope) : "";

  const title =
    scope === "ALL"
      ? "Delete all tables"
      : scope
        ? `Delete ${TABLE_SIZE_CONFIG[scope].label} tables`
        : "Delete tables";

  return (
    <AdminModal title={title} isOpen={Boolean(pending)} onClose={onClose}>
      <div className="space-y-5 font-body text-sm text-foreground/85">
        <p>
          This will permanently delete{" "}
          <span className="font-brand text-gold">
            {count} {label}
          </span>
          . References on the venue floor layout will be removed as well. This action cannot be
          undone.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="rounded-xl border border-gold/30 px-5 py-3 text-sm tracking-[0.08em] text-foreground/80 transition hover:bg-white/5 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="rounded-xl border border-red-400/45 bg-red-500/15 px-5 py-3 font-brand text-sm tracking-[0.08em] text-red-200 transition hover:bg-red-500/25 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isDeleting ? "Deleting..." : "Delete permanently"}
          </button>
        </div>
      </div>
    </AdminModal>
  );
}
