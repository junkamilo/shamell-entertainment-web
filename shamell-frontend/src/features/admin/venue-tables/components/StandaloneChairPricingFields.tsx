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
      <label className="mb-2 block font-brand text-sm uppercase tracking-[0.14em] text-shamell-gold sm:text-base">
        Unit price (each chair)
      </label>
      <p className="mb-3 text-sm leading-relaxed text-shamell-text-primary/75 sm:text-base">
        Price per standalone chair when booked or quoted separately from tables.
      </p>
      <input
        type="text"
        inputMode="decimal"
        value={unitPriceInput}
        onChange={(e) => onUnitPriceChange(e.target.value)}
        placeholder="150"
        className="w-full min-h-[52px] rounded-xl border border-shamell-line-soft bg-shamell-night/40 px-4 py-3 font-body text-xl text-shamell-text-primary outline-none transition focus:border-gold/45 focus:ring-1 focus:ring-gold/25 sm:text-2xl"
      />
      <p className="mt-2 text-sm text-shamell-gold sm:text-base">
        {pricePreview.ok && pricePreview.value != null
          ? `${formatPriceEn(pricePreview.value)} each`
          : "Enter a valid amount"}
      </p>
    </div>
  );
}
