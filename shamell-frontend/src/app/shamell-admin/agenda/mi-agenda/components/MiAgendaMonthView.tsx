import { DAY_NUMBER_LABEL, WEEKDAY_SHORT } from "../lib/miAgendaConstants";
import { monthStartIso } from "../lib/miAgendaDateUtils";
import type { EnrichedBooking } from "../types/miAgenda.types";
import MiAgendaEventListItem from "./MiAgendaEventListItem";

type Props = {
  anchorIso: string;
  monthGrid: string[];
  byDate: Map<string, EnrichedBooking[]>;
  selectedId: string | null;
  onSelect: (id: string) => void;
};

export default function MiAgendaMonthView({
  anchorIso,
  monthGrid,
  byDate,
  selectedId,
  onSelect,
}: Props) {
  const monthKey = monthStartIso(anchorIso).slice(0, 7);

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-7">
      {monthGrid.map((iso) => {
        const rows = byDate.get(iso) ?? [];
        const currentMonth = iso.slice(0, 7) === monthKey;
        const visibleRows = rows.slice(0, 3);
        const hiddenCount = rows.length - visibleRows.length;
        const dow = new Date(`${iso}T12:00:00Z`).getUTCDay();
        const weekdayIndex = dow === 0 ? 6 : dow - 1;

        return (
          <article
            key={iso}
            className={`shamell-glass-surface min-h-[170px] rounded-xl border p-2.5 ${
              currentMonth ? "border-gold/14" : "border-gold/8 opacity-70"
            }`}
          >
            <p className="font-brand text-[10px] tracking-widest text-gold/75">
              {WEEKDAY_SHORT[weekdayIndex]} {DAY_NUMBER_LABEL.format(new Date(`${iso}T12:00:00Z`))}
            </p>
            <div className="mt-2 space-y-1.5">
              {rows.length === 0 ? (
                <p className="rounded border border-dashed border-gold/15 px-2 py-1.5 text-center text-[11px] text-foreground/40">
                  No events
                </p>
              ) : null}
              {visibleRows.map((row) => (
                <MiAgendaEventListItem
                  key={row.id}
                  row={row}
                  selectedId={selectedId}
                  onSelect={onSelect}
                  variant="month"
                />
              ))}
              {hiddenCount > 0 ? (
                <p className="px-1 text-[11px] text-foreground/55">+{hiddenCount} more…</p>
              ) : null}
            </div>
          </article>
        );
      })}
    </div>
  );
}
