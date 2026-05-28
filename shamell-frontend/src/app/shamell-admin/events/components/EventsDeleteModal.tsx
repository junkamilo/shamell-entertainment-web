import AdminModal from "@/components/admin/AdminModal";
import { displayEventHeading } from "../lib/eventsDisplay";
import type { AdminEvent } from "../types/events.types";

type Props = {
  pendingDelete: AdminEvent | null;
  isDeleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export default function EventsDeleteModal({ pendingDelete, isDeleting, onClose, onConfirm }: Props) {
  const catalogCount = pendingDelete?.catalogImages?.length ?? 0;
  const galleryOnlyCount = Math.max(
    0,
    (pendingDelete?.galleryPhotoCount ?? 0) - catalogCount,
  );

  return (
    <AdminModal title="Delete event" isOpen={Boolean(pendingDelete)} onClose={onClose}>
      <div className="space-y-5 font-body text-sm text-foreground/85">
        <p>
          Permanently delete{" "}
          <span className="font-brand text-gold">
            {pendingDelete ? displayEventHeading(pendingDelete.description).title : ""}
          </span>
          ? You cannot undo this.
        </p>
        {catalogCount > 0 ? (
          <p className="text-foreground/70">
            {catalogCount === 1
              ? "Its catalog image will also be removed."
              : `Its ${catalogCount} catalog images will also be removed.`}
          </p>
        ) : null}
        {galleryOnlyCount > 0 ? (
          <p className="text-foreground/70">
            {galleryOnlyCount === 1
              ? "One linked gallery photo will also be removed."
              : `${galleryOnlyCount} linked gallery photos will also be removed.`}
          </p>
        ) : null}
        <p className="text-foreground/60 text-xs">
          Deletion is blocked while the event has bookings, pending seat reservations, or paid class
          enrollments.
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
