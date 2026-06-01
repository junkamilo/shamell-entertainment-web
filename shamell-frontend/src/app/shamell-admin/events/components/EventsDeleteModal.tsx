import AdminDeleteConfirmModal, {
  AdminDeleteConfirmMessage,
} from "@/components/admin/AdminDeleteConfirmModal";
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
    <AdminDeleteConfirmModal
      title="Delete event"
      isOpen={Boolean(pendingDelete)}
      isDeleting={isDeleting}
      onClose={onClose}
      onConfirm={onConfirm}
    >
      <AdminDeleteConfirmMessage
        entityLabel="event"
        name={pendingDelete ? displayEventHeading(pendingDelete.description).title : ""}
        consequences={["This action cannot be undone."]}
      />
      {catalogCount > 0 ? (
        <p className="text-foreground/80">
          {catalogCount === 1
            ? "Its catalog image will also be removed."
            : `Its ${catalogCount} catalog images will also be removed.`}
        </p>
      ) : null}
      {galleryOnlyCount > 0 ? (
        <p className="text-foreground/80">
          {galleryOnlyCount === 1
            ? "One linked gallery photo will also be removed."
            : `${galleryOnlyCount} linked gallery photos will also be removed.`}
        </p>
      ) : null}
      <p className="text-foreground/70">
        Deletion is blocked while the event has bookings, pending seat reservations, or paid class
        enrollments.
      </p>
    </AdminDeleteConfirmModal>
  );
}
