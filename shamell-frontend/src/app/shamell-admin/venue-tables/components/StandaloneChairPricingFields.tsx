"use client";

import { formatPriceEn, parsePriceInput } from "../lib/parseVenueTablePrice";

type Props = {
  unitPriceInput: string;
  onUnitPriceChange: (v: string) => void;
};

export default function StandaloneChairPricingFields({
  unitPriceInput,
  onUnitPriceChange,
}: Props) {
  const pricePreview = parsePriceInput(unitPriceInput);

  return (
    <div>
      <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-shamell-gold">
        Unit price (each chair)
      </label>
      <p className="mb-2 text-[11px] text-shamell-text-primary/70">
        Price per standalone chair when booked or quoted separately from tables.
      </p>
      <input
        type="text"
        inputMode="decimal"
        value={unitPriceInput}
        onChange={(e) => onUnitPriceChange(e.target.value)}
        placeholder="150"
        className="w-full rounded-lg border border-shamell-line-soft bg-shamell-night/40 px-3 py-2 text-sm text-shamell-text-primary"
      />
      <p className="mt-1 text-xs text-shamell-gold">
        {pricePreview.ok && pricePreview.value != null
          ? `${formatPriceEn(pricePreview.value)} each`
          : "Enter a valid amount"}
      </p>
    </div>
  );
}
