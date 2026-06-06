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
      <label className="mb-2 block font-brand text-sm uppercase tracking-[0.14em] text-shamell-gold sm:text-base">
        Bundle price (table + included chairs)
      </label>
      <p className="mb-3 text-sm leading-relaxed text-shamell-text-primary/75 sm:text-base">
        One package price for the table and all chairs included in the combo — not per chair.
      </p>
      <input
        type="text"
        inputMode="decimal"
        value={bundlePriceInput}
        onChange={(e) => onBundleChange(e.target.value)}
        placeholder="150000"
        className="w-full min-h-[52px] rounded-xl border border-shamell-line-soft bg-shamell-night/40 px-4 py-3 font-body text-xl text-shamell-text-primary outline-none transition focus:border-gold/45 focus:ring-1 focus:ring-gold/25 sm:text-2xl"
      />
      <p className="mt-2 text-sm text-shamell-gold sm:text-base">
        {bundlePreview.ok && bundlePreview.value != null
          ? formatPriceEn(bundlePreview.value)
          : "Enter a valid amount"}
      </p>
    </div>
  );
}
