import AdminModal from "@/components/admin/AdminModal";
import type { EventTypeItem } from "../types/eventTypes.types";

type Props = {
  pendingDelete: EventTypeItem | null;
  isDeleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export default function EventTypesDeleteModal({
  pendingDelete,
  isDeleting,
  onClose,
  onConfirm,
}: Props) {
  return (
    <AdminModal title="Delete event type" isOpen={Boolean(pendingDelete)} onClose={onClose}>
      <div className="space-y-5 font-body text-sm text-foreground/85">
        <p>
          Permanently delete{" "}
          <span className="font-brand text-gold">{pendingDelete?.name}</span>? Occasion-type links on this type will
          also be removed. You can only delete it when there are no catalog events, bookings, or linked gallery photos.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            disabled={isDeleting}
            onClick={onClose}
            className="rounded-xl border border-gold/30 px-5 py-3 text-sm tracking-[0.08em] text-foreground/80 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isDeleting}
            onClick={onConfirm}
            className="rounded-xl border border-red-400/40 bg-red-500/15 px-5 py-3 font-brand text-sm tracking-[0.08em] text-red-200 transition hover:bg-red-500/25 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </AdminModal>
  );
}
