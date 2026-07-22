"use client";

import { Modal } from "@/components/admin/overlays";
import {
  formatStandaloneChairAdminSubtitle,
  formatStandaloneChairShortId,
} from "../lib/mapStandaloneChairFromApi";
import type { StandaloneChairInventoryItem } from "../types/standaloneChairs.types";
import StandaloneChairPricingFields from "./StandaloneChairPricingFields";

type Props = {
  chair: StandaloneChairInventoryItem | null;
  unitPriceInput: string;
  onUnitPriceChange: (value: string) => void;
  isSaving: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export default function StandaloneChairEditPriceModal({
  chair,
  unitPriceInput,
  onUnitPriceChange,
  isSaving,
  onClose,
  onConfirm,
}: Props) {
  return (
    <Modal title="Edit chair price" isOpen={Boolean(chair)} onClose={onClose}>
      <div className="space-y-6 font-body text-sm text-foreground/85">
        {chair ? (
          <div className="rounded-xl border border-gold/20 bg-gold/5 px-4 py-3">
            <p className="font-brand text-sm text-gold">{chair.displayLabel}</p>
            <p className="mt-1 text-xs text-foreground/65">
              {formatStandaloneChairAdminSubtitle(chair)} · {formatStandaloneChairShortId(chair.id)}
            </p>
          </div>
        ) : null}

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
            {isSaving ? "Saving..." : "Save price"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
