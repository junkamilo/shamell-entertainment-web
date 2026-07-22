import { Modal } from "@/components/admin/overlays";
type Props = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export default function MiAgendaCancelModal({ isOpen, onClose, onConfirm }: Props) {
  return (
    <Modal title="Cancel booking" isOpen={isOpen} onClose={onClose}>
      <div className="space-y-4">
        <p className="text-sm text-foreground/75">
          This will set the booking status to <span className="text-red-200">CANCELLED</span>.
        </p>
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
            onClick={onConfirm}
            className="rounded-md border border-red-400/45 px-4 py-2 font-brand text-[10px] tracking-[0.14em] text-red-200 hover:bg-red-500/10"
          >
            CONFIRM CANCELLATION
          </button>
        </div>
      </div>
    </Modal>
  );
}
