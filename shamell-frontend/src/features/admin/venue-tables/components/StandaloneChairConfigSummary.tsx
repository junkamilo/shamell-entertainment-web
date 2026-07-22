"use client";

import { formatPriceEn, parsePriceInput } from "../lib/parseVenueTablePrice";
import { STANDALONE_CHAIR_DISPLAY_LABEL } from "../types/standaloneChairs.types";

type Props = {
  addQuantity: number;
  currentCount: number;
  unitPriceInput: string;
};

export default function StandaloneChairConfigSummary({
  addQuantity,
  currentCount,
  unitPriceInput,
}: Props) {
  const priceParsed = parsePriceInput(unitPriceInput);
  const newTotal = currentCount + addQuantity;

  return (
    <div className="rounded-xl border border-shamell-line-soft bg-shamell-twilight/20 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-shamell-gold">Summary</p>
      <dl className="mt-3 space-y-2 text-sm text-shamell-text-primary/85">
        <div className="flex justify-between gap-3">
          <dt>Chairs to add</dt>
          <dd className="font-semibold text-shamell-text-primary">{addQuantity}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt>Unit price</dt>
          <dd className="font-semibold text-gold">
            {priceParsed.ok && priceParsed.value != null
              ? `${formatPriceEn(priceParsed.value)} each`
              : "—"}
          </dd>
        </div>
        <div className="flex justify-between gap-3 border-t border-shamell-line-soft/60 pt-2">
          <dt>New inventory total</dt>
          <dd className="font-semibold text-shamell-text-primary">{newTotal}</dd>
        </div>
      </dl>
      <p className="mt-3 text-[11px] leading-snug text-shamell-text-primary/65">
        Each new chair gets a unique internal ID. Lists show &quot;{STANDALONE_CHAIR_DISPLAY_LABEL}
        &quot; only. Existing chairs keep their current price; only the new chairs use this unit
        price.
      </p>
    </div>
  );
}
