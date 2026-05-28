"use client";

import { comboSummaryLabel } from "../lib/venueTablesPricing";
import { parsePriceInput } from "../lib/parseVenueTablePrice";
import { TABLE_SIZE_CONFIG } from "../lib/tableSizeConfig";
import type { TableSize } from "../types/venueTables.types";

type Props = {
  size: TableSize;
  quantity: number;
  includedChairs: number;
  bundlePriceInput: string;
};

export default function TableConfigSummary({
  size,
  quantity,
  includedChairs,
  bundlePriceInput,
}: Props) {
  const bundle = parsePriceInput(bundlePriceInput);
  const sizeLabel = TABLE_SIZE_CONFIG[size].label;
  const label =
    quantity > 1
      ? `${quantity} × ${sizeLabel} tables`
      : `${sizeLabel} table`;

  return (
    <div className="rounded-xl border border-shamell-gold/30 bg-shamell-twilight/40 p-4 text-sm leading-relaxed text-shamell-text-primary">
      <p className="font-semibold text-shamell-gold">Pricing summary</p>
      {quantity > 1 ? (
        <p className="mt-1 text-xs text-shamell-text-primary/75">
          Same combo pricing for all {quantity} tables
        </p>
      ) : null}
      <p className="mt-2">
        {comboSummaryLabel(
          label,
          includedChairs,
          bundle.ok ? bundle.value : null,
        )}
      </p>
    </div>
  );
}
