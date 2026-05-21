import { Trash2 } from "lucide-react";
import { WEEKDAY_LABEL } from "../lib/disponibilidadConstants";
import type { AdminAvailabilitySnapshot } from "../types/disponibilidad.types";

type Props = {
  closures: AdminAvailabilitySnapshot["closures"];
  onRequestDelete: (id: string) => void;
};

export default function DisponibilidadClosuresList({ closures, onRequestDelete }: Props) {
  return (
    <ul className="mt-8 space-y-2">
      {closures.length === 0 ? (
        <li className="shamell-glass-surface rounded-lg py-8 text-center font-body text-sm text-foreground/45">
          No extra closures configured.
        </li>
      ) : null}
      {closures.map((c) => (
        <li
          key={c.id}
          className="shamell-glass-surface flex flex-col gap-3 rounded-xl px-3 py-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4 sm:px-4"
        >
          <div className="min-w-0 flex-1">
            <p className="wrap-break-word font-brand text-xs tracking-wide text-gold">
              {c.kind === "SPECIFIC_DATE"
                ? `Date: ${c.date ?? "—"}`
                : c.kind === "DATE_RANGE"
                  ? `Range: ${c.startDate ?? "—"} through ${c.endDate ?? "—"}`
                  : `Every ${WEEKDAY_LABEL[c.weekday ?? 0] ?? "—"}`}
            </p>
            {c.note ? (
              <p className="mt-1 wrap-break-word font-body text-xs text-foreground/55">{c.note}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => onRequestDelete(c.id)}
            className="inline-flex w-full shrink-0 items-center justify-center gap-1.5 rounded-lg border border-red-400/35 px-3 py-2.5 font-brand text-[10px] tracking-widest text-red-200/90 hover:bg-red-500/10 sm:w-auto sm:py-2"
          >
            <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
            REMOVE
          </button>
        </li>
      ))}
    </ul>
  );
}
