import { type FormEvent } from "react";
import AdminModal from "@/components/admin/AdminModal";

type Props = {
  isOpen: boolean;
  editingId: string | null;
  name: string;
  onNameChange: (value: string) => void;
  canSubmit: boolean;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export default function OccasionTypesFormModal({
  isOpen,
  editingId,
  name,
  onNameChange,
  canSubmit,
  isSubmitting,
  onClose,
  onSubmit,
}: Props) {
  return (
    <AdminModal
      title={editingId ? "Edit occasion type" : "New occasion type"}
      isOpen={isOpen}
      onClose={onClose}
    >
      <form noValidate onSubmit={onSubmit} className="space-y-6">
        <label className="block">
          <span className="font-brand text-[11px] tracking-[0.2em] text-gold/95">NAME</span>
          <input
            type="text"
            value={name}
            required
            onChange={(e) => onNameChange(e.target.value)}
            className="mt-2 h-12 w-full rounded-xl border border-gold/30 px-4 text-base text-foreground outline-none focus:border-gold"
            placeholder="e.g. Luxury birthday"
          />
        </label>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-gold/30 px-5 py-3 text-sm tracking-[0.08em] text-foreground/80 transition hover:bg-white/5"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!canSubmit}
            className="rounded-xl border border-gold/35 bg-gold/15 px-5 py-3 font-brand text-sm tracking-[0.08em] text-gold transition hover:bg-gold/25 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Saving..." : editingId ? "Save" : "Create"}
          </button>
        </div>
      </form>
    </AdminModal>
  );
}
