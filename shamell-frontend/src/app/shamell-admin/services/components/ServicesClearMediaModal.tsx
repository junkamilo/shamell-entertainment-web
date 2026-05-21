import AdminModal from "@/components/admin/AdminModal";

type Props = {
  isOpen: boolean;
  isClearing: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export default function ServicesClearMediaModal({ isOpen, isClearing, onClose, onConfirm }: Props) {
  return (
    <AdminModal title="Remove service media" isOpen={isOpen} onClose={onClose}>
      <div className="space-y-5 font-body text-sm text-foreground/85">
        <p>
          Delete this service&apos;s image or video from Cloudinary and clear it in the database? You can upload a
          new file afterward. This cannot be undone.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={isClearing}
            className="rounded-xl border border-gold/30 px-5 py-3 text-sm tracking-[0.08em] text-foreground/80 transition hover:bg-white/5 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isClearing}
            className="rounded-xl border border-red-400/45 bg-red-500/15 px-5 py-3 font-brand text-sm tracking-[0.08em] text-red-200 transition hover:bg-red-500/25 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isClearing ? "Removing..." : "Remove media"}
          </button>
        </div>
      </div>
    </AdminModal>
  );
}
