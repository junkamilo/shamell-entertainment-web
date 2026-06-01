"use client";

import AdminModal from "@/components/admin/AdminModal";
import StandaloneChairPricingFields from "./StandaloneChairPricingFields";

type Props = {
  open: boolean;
  chairCount: number;
  unitPriceInput: string;
  onUnitPriceChange: (value: string) => void;
  isSaving: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export default function StandaloneChairsBulkEditPriceModal({
  open,
  chairCount,
  unitPriceInput,
  onUnitPriceChange,
  isSaving,
  onClose,
  onConfirm,
}: Props) {
  return (
    <AdminModal title="Edit all chair prices" isOpen={open} onClose={onClose}>
      <div className="space-y-6 font-body text-sm text-foreground/85">
        <p>
          Set one unit price for all{" "}
          <span className="font-brand text-gold">{chairCount} active chairs</span>. Individual
          prices will be replaced.
        </p>

        <StandaloneChairPricingFields
          unitPriceInput={unitPriceInput}
          onUnitPriceChange={onUnitPriceChange}
        />

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="rounded-xl border border-gold/30 px-5 py-3 text-sm tracking-[0.08em] text-foreground/80 transition hover:bg-white/5 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSaving}
            className="rounded-xl border border-gold/40 bg-gold/15 px-5 py-3 font-brand text-sm tracking-[0.08em] text-gold transition hover:bg-gold/25 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? "Saving..." : "Update all prices"}
          </button>
        </div>
      </div>
    </AdminModal>
  );
}
