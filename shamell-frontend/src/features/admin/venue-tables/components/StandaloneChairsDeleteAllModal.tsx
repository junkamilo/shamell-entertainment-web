"use client";

import { Modal } from "@/components/admin/overlays";
type Props = {
  open: boolean;
  chairCount: number;
  isDeleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export default function StandaloneChairsDeleteAllModal({
  open,
  chairCount,
  isDeleting,
  onClose,
  onConfirm,
}: Props) {
  return (
    <Modal title="Delete all chairs" isOpen={open} onClose={onClose}>
      <div className="space-y-5 font-body text-sm text-foreground/85">
        <p>
          This will permanently delete{" "}
          <span className="font-brand text-gold">
            {chairCount} standalone chair{chairCount === 1 ? "" : "s"}
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
    </Modal>
  );
}
