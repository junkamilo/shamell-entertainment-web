import AdminModal from "@/components/admin/AdminModal";
import type { OccasionTypeItem } from "../types/occasionTypes.types";

type Props = {
  pendingDelete: OccasionTypeItem | null;
  isDeleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export default function OccasionTypesDeleteModal({
  pendingDelete,
  isDeleting,
  onClose,
  onConfirm,
}: Props) {
  return (
    <AdminModal title="Delete occasion type" isOpen={Boolean(pendingDelete)} onClose={onClose}>
      <div className="space-y-5 font-body text-sm text-foreground/85">
        <p>
          Permanently delete{" "}
          <span className="font-brand text-gold">{pendingDelete?.name}</span>? It will also be removed
          from event types where it is linked (when there are no bookings).
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
            {isDeleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </AdminModal>
  );
}
