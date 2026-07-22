"use client";

import { AnimatePresence, motion } from "motion/react";
import { Minus, Plus, X } from "lucide-react";
import { useStandaloneChairConfigurator } from "../hooks/useStandaloneChairConfigurator";
import StandaloneChairConfigSummary from "./StandaloneChairConfigSummary";
import StandaloneChairPreview from "./StandaloneChairPreview";
import StandaloneChairPricingFields from "./StandaloneChairPricingFields";

type Props = {
  open: boolean;
  currentCount: number;
  defaultUnitPrice: number;
  onClose: () => void;
  onSaved: () => void;
};

export default function StandaloneChairsConfiguratorModal({
  open,
  currentCount,
  defaultUnitPrice,
  onClose,
  onSaved,
}: Props) {
  const cfg = useStandaloneChairConfigurator({
    currentCount,
    defaultUnitPrice,
    onSaved: () => {
      onSaved();
      onClose();
    },
  });

  const atCapacity = cfg.maxAddQuantity === 0;

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
            aria-labelledby="standalone-chairs-configurator-title"
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className="relative z-10 flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-shamell-line-soft bg-shamell-night shadow-2xl"
          >
            <header className="flex items-center justify-between border-b border-shamell-line-soft px-5 py-4">
              <div>
                <h2
                  id="standalone-chairs-configurator-title"
                  className="text-lg font-semibold text-shamell-text-primary"
                >
                  Configure standalone chairs
                </h2>
                <p className="text-xs text-shamell-gold">
                  Quantity + unit price — IDs are assigned automatically
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
              {atCapacity ? (
                <p className="text-sm text-shamell-text-primary/75">
                  Inventory is at capacity. Remove chairs from the floor plan or deactivate unused
                  chairs before adding more.
                </p>
              ) : (
                <div className="grid gap-6 lg:grid-cols-2">
                  <StandaloneChairPreview addQuantity={cfg.quantity} />

                  <div className="space-y-4">
                    <div>
                      <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-shamell-gold">
                        Quantity to add
                      </label>
                      <p className="mb-2 text-[11px] text-shamell-text-primary/70">
                        How many new chairs to add to inventory ({currentCount} currently saved).
                      </p>
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
                          max={cfg.maxAddQuantity}
                          value={cfg.quantity}
                          onChange={(e) => {
                            const n = parseInt(e.target.value, 10);
                            if (!Number.isNaN(n)) {
                              cfg.setQuantity(
                                Math.min(cfg.maxAddQuantity, Math.max(1, n)),
                              );
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
                    </div>

                    <StandaloneChairPricingFields
                      unitPriceInput={cfg.unitPriceInput}
                      onUnitPriceChange={cfg.setUnitPriceInput}
                    />

                    <StandaloneChairConfigSummary
                      addQuantity={cfg.quantity}
                      currentCount={currentCount}
                      unitPriceInput={cfg.unitPriceInput}
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
              )}
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
                disabled={cfg.saving || atCapacity}
                onClick={() => void cfg.save()}
                className="rounded-lg bg-shamell-fire px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                {cfg.saving
                  ? "Saving…"
                  : cfg.quantity === 1
                    ? "Add 1 chair"
                    : `Add ${cfg.quantity} chairs`}
              </button>
            </footer>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
