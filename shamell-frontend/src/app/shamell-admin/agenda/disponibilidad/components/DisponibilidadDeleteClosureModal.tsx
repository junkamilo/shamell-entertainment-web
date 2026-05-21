import AdminModal from "@/components/admin/AdminModal";

type Props = {
  confirmClosureId: string | null;
  onClose: () => void;
  onConfirmDelete: () => void;
};

export default function DisponibilidadDeleteClosureModal({
  confirmClosureId,
  onClose,
  onConfirmDelete,
}: Props) {
  return (
    <AdminModal title="Delete closure" isOpen={Boolean(confirmClosureId)} onClose={onClose}>
      <div className="space-y-4">
        <p className="text-sm text-foreground/75">This closure will be removed permanently.</p>
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-gold/25 px-4 py-2 font-brand text-[10px] tracking-[0.14em] text-foreground/70 hover:border-gold/35 hover:text-gold"
          >
            CLOSE
          </button>
          <button
            type="button"
            onClick={onConfirmDelete}
            className="rounded-md border border-red-400/45 px-4 py-2 font-brand text-[10px] tracking-[0.14em] text-red-200 hover:bg-red-500/10"
          >
            DELETE
          </button>
        </div>
      </div>
    </AdminModal>
  );
}
