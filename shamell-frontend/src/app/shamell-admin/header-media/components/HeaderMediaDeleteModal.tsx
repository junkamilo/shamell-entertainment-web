import AdminModal from "@/components/admin/AdminModal";
import { headerLibraryItemIsVideo } from "../lib/headerMediaUtils";
import type { HeaderPhoto } from "../types/headerMedia.types";

type Props = {
  pendingDelete: HeaderPhoto | null;
  isDeleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export default function HeaderMediaDeleteModal({
  pendingDelete,
  isDeleting,
  onClose,
  onConfirm,
}: Props) {
  return (
    <AdminModal title="Remove header media" isOpen={Boolean(pendingDelete)} onClose={onClose}>
      <div className="space-y-5 font-body text-sm text-foreground/85">
        <p>
          Permanently remove this{" "}
          {pendingDelete && headerLibraryItemIsVideo(pendingDelete) ? "video" : "image"} from the main
          header? You will not be able to recover it.
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
