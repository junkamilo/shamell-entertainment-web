"use client";

import { formatPriceEn, parsePriceInput } from "../lib/parseVenueTablePrice";

type Props = {
  bundlePriceInput: string;
  onBundleChange: (v: string) => void;
};

export default function TablePricingFields({
  bundlePriceInput,
  onBundleChange,
}: Props) {
  const bundlePreview = parsePriceInput(bundlePriceInput);

  return (
    <div>
      <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-shamell-gold">
        Bundle price (table + included chairs)
      </label>
      <p className="mb-2 text-[11px] text-shamell-text-primary/70">
        One package price for the table and all chairs included in the combo — not per chair.
      </p>
      <input
        type="text"
        inputMode="decimal"
        value={bundlePriceInput}
        onChange={(e) => onBundleChange(e.target.value)}
        placeholder="150000"
        className="w-full rounded-lg border border-shamell-line-soft bg-shamell-night/40 px-3 py-2 text-sm text-shamell-text-primary"
      />
      <p className="mt-1 text-xs text-shamell-gold">
        {bundlePreview.ok && bundlePreview.value != null
          ? formatPriceEn(bundlePreview.value)
          : "Enter a valid amount"}
      </p>
    </div>
  );
}
