"use client";

import { Armchair } from "lucide-react";
import { STANDALONE_CHAIR_DISPLAY_LABEL } from "../types/standaloneChairs.types";

type Props = {
  addQuantity: number;
};

export default function StandaloneChairPreview({ addQuantity }: Props) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-shamell-line-soft bg-shamell-twilight/25 p-6">
      <div className="flex h-24 w-24 items-center justify-center rounded-2xl border border-gold/30 bg-gold/10">
        <Armchair className="h-10 w-10 text-gold/85" strokeWidth={1.35} />
      </div>
      <p className="mt-4 font-semibold text-shamell-text-primary">{STANDALONE_CHAIR_DISPLAY_LABEL}</p>
      <p className="mt-1 text-center text-xs text-shamell-text-primary/65">
        Standalone seat — not tied to a table combo.
      </p>
      <p className="mt-3 rounded-full border border-gold/35 bg-gold/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-gold">
        {addQuantity === 1 ? "1 chair to add" : `${addQuantity} chairs to add`}
      </p>
    </div>
  );
}
