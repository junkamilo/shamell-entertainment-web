"use client";

import { AnimatePresence, motion } from "motion/react";
import { Minus, Plus, X } from "lucide-react";
import { useTableConfigurator } from "../hooks/useTableConfigurator";
import { TABLE_SIZE_CONFIG } from "../lib/tableSizeConfig";
import type { VenueTableConfig } from "../types/venueTables.types";
import TableChairRing from "./TableChairRing";
import TableConfigSummary from "./TableConfigSummary";
import TablePricingFields from "./TablePricingFields";
import TableSizeSelector from "./TableSizeSelector";

type Props = {
  open: boolean;
  editing: VenueTableConfig | null;
  onClose: () => void;
  onSaved: () => void;
};

export default function TableConfiguratorModal({
  open,
  editing,
  onClose,
  onSaved,
}: Props) {
  const cfg = useTableConfigurator(editing, () => {
    onSaved();
    onClose();
  });

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/60"
            aria-label="Close"
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="table-configurator-title"
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className="relative z-10 flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-shamell-line-soft bg-shamell-night shadow-2xl"
          >
            <header className="flex items-center justify-between border-b border-shamell-line-soft px-5 py-4">
              <div>
                <h2
                  id="table-configurator-title"
                  className="text-lg font-semibold text-shamell-text-primary"
                >
                  {editing ? "Edit table configuration" : "Configure new tables"}
                </h2>
                <p className="text-xs text-shamell-gold">
                  Visual seating + combo pricing — names are assigned automatically
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-shamell-line-soft p-2 text-shamell-text-primary hover:border-shamell-gold/50"
              >
                <X className="h-5 w-5" />
              </button>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="space-y-4">
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-shamell-gold">
                      Table size
                    </p>
                    <TableSizeSelector value={cfg.size} onChange={cfg.setSize} />
                  </div>
                  <TableChairRing
                    size={cfg.size}
                    includedChairs={cfg.includedChairs}
                    canIncrement={cfg.canIncrement}
                    canDecrement={cfg.canDecrement}
                    onIncrement={cfg.incrementChairs}
                    onDecrement={cfg.decrementChairs}
                  />
                </div>

                <div className="space-y-4">
                  {cfg.isEditMode ? (
                    <div className="rounded-lg border border-shamell-line-soft bg-shamell-night/40 px-3 py-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-shamell-gold">
                        Table type
                      </p>
                      <p className="mt-1 text-sm font-semibold text-shamell-text-primary">
                        {TABLE_SIZE_CONFIG[cfg.size].label}
                      </p>
                    </div>
                  ) : (
                    <div>
                      <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-shamell-gold">
                        Quantity
                      </label>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={!cfg.canDecrementQuantity}
                          onClick={cfg.decrementQuantity}
                          className="rounded-lg border border-shamell-line-soft p-2 text-shamell-text-primary disabled:opacity-40"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <input
                          type="number"
                          min={1}
                          max={50}
                          value={cfg.quantity}
                          onChange={(e) => {
                            const n = parseInt(e.target.value, 10);
                            if (!Number.isNaN(n)) {
                              cfg.setQuantity(Math.min(50, Math.max(1, n)));
                            }
                          }}
                          className="w-20 rounded-lg border border-shamell-line-soft bg-shamell-night/40 px-3 py-2 text-center text-sm text-shamell-text-primary"
                        />
                        <button
                          type="button"
                          disabled={!cfg.canIncrementQuantity}
                          onClick={cfg.incrementQuantity}
                          className="rounded-lg border border-shamell-line-soft p-2 text-shamell-text-primary disabled:opacity-40"
                          aria-label="Increase quantity"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                      <p className="mt-2 text-xs text-shamell-text-primary/75">
                        Each table gets a unique internal ID. You will see only the size (
                        {TABLE_SIZE_CONFIG[cfg.size].label}) in lists and reservations.
                      </p>
                    </div>
                  )}
                  <TablePricingFields
                    bundlePriceInput={cfg.bundlePriceInput}
                    onBundleChange={cfg.setBundlePriceInput}
                  />
                  <TableConfigSummary
                    size={cfg.size}
                    quantity={cfg.isEditMode ? 1 : cfg.quantity}
                    includedChairs={cfg.includedChairs}
                    bundlePriceInput={cfg.bundlePriceInput}
                  />
                  {cfg.fieldErrors.length > 0 ? (
                    <ul className="text-xs text-shamell-danger">
                      {cfg.fieldErrors.map((err) => (
                        <li key={err}>{err}</li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              </div>
            </div>

            <footer className="flex justify-end gap-2 border-t border-shamell-line-soft px-5 py-4">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-shamell-line-soft px-4 py-2 text-sm text-shamell-text-primary"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={cfg.saving}
                onClick={() => void cfg.save()}
                className="rounded-lg bg-shamell-fire px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                {cfg.saving
                  ? "Saving…"
                  : cfg.isEditMode
                    ? "Save configuration"
                    : cfg.quantity === 1
                      ? "Create table"
                      : `Create ${cfg.quantity} tables`}
              </button>
            </footer>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
