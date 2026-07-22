import { Modal } from "@/components/admin/overlays";
import type { ConfirmDeleteState } from "../types/peticiones.types";

type Props = {
  confirmDelete: ConfirmDeleteState | null;
  purgeLinkedInquiryOnDelete: boolean;
  onPurgeLinkedChange: (value: boolean) => void;
  onClose: () => void;
  onConfirm: () => void;
};

export default function PeticionesDeleteModal({
  confirmDelete,
  purgeLinkedInquiryOnDelete,
  onPurgeLinkedChange,
  onClose,
  onConfirm,
}: Props) {
  return (
    <Modal
      title={confirmDelete?.title ?? "Confirm action"}
      isOpen={Boolean(confirmDelete)}
      onClose={onClose}
    >
      <div className="space-y-4">
        <p className="text-sm text-foreground/75">{confirmDelete?.description}</p>
        {confirmDelete?.kind === "BOOKING" && confirmDelete.linkedContactId ? (
          <label className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-gold/15 bg-black/20 px-3 py-2.5">
            <input
              type="checkbox"
              checked={purgeLinkedInquiryOnDelete}
              onChange={(e) => onPurgeLinkedChange(e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-gold"
            />
            <span className="font-body text-sm leading-snug text-foreground/80">
              Also delete the linked inquiry (recommended — prevents it from showing again in the
              inbox)
            </span>
          </label>
        ) : null}
        <p className="text-xs text-foreground/50">You cannot undo this action.</p>
        <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-gold/25 px-4 py-2 font-brand text-[10px] tracking-[0.14em] text-foreground/70 hover:border-gold/35 hover:text-gold"
          >
            CANCEL
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-md border border-red-400/45 px-4 py-2 font-brand text-[10px] tracking-[0.14em] text-red-200 hover:bg-red-500/10"
          >
            DELETE
          </button>
        </div>
      </div>
    </Modal>
  );
}
