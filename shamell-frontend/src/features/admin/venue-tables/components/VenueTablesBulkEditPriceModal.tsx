"use client";

import { Modal } from "@/components/admin/overlays";
import { TABLE_SIZE_CONFIG } from "../lib/tableSizeConfig";
import type { TableSize } from "../types/venueTables.types";
import TablePricingFields from "./TablePricingFields";

type Props = {
  open: boolean;
  size: TableSize;
  tableCount: number;
  bundlePriceInput: string;
  onBundlePriceChange: (value: string) => void;
  isSaving: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export default function VenueTablesBulkEditPriceModal({
  open,
  size,
  tableCount,
  bundlePriceInput,
  onBundlePriceChange,
  isSaving,
  onClose,
  onConfirm,
}: Props) {
  const sizeLabel = TABLE_SIZE_CONFIG[size].label;

  return (
    <Modal
      title={`Edit all ${sizeLabel} table prices`}
      isOpen={open}
      onClose={onClose}
      size="narrow"
    >
      <div className="space-y-6 font-body text-base leading-relaxed text-foreground/90 sm:text-lg">
        <p>
          Set one bundle price for all{" "}
          <span className="font-brand text-gold">
            {tableCount} active {sizeLabel.toLowerCase()} tables
          </span>
          . Individual combo prices will be replaced.
        </p>

        <TablePricingFields
          bundlePriceInput={bundlePriceInput}
          onBundleChange={onBundlePriceChange}
        />

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="min-h-12 rounded-xl border border-gold/30 px-5 py-3 text-base tracking-[0.08em] text-foreground/80 transition hover:bg-white/5 disabled:opacity-50 sm:text-lg"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSaving}
            className="min-h-12 rounded-xl border border-gold/40 bg-gold/15 px-5 py-3 font-brand text-base tracking-[0.08em] text-gold transition hover:bg-gold/25 disabled:cursor-not-allowed disabled:opacity-60 sm:text-lg"
          >
            {isSaving ? "Saving..." : "Update all prices"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
