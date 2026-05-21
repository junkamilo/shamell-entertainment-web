import { DAY_NUMBER_LABEL, WEEKDAY_SHORT } from "../lib/miAgendaConstants";
import type { EnrichedBooking } from "../types/miAgenda.types";
import MiAgendaEventListItem from "./MiAgendaEventListItem";

type Props = {
  weekDays: string[];
  byDate: Map<string, EnrichedBooking[]>;
  selectedId: string | null;
  onSelect: (id: string) => void;
};

export default function MiAgendaWeekView({ weekDays, byDate, selectedId, onSelect }: Props) {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-7">
      {weekDays.map((iso, index) => {
        const rows = byDate.get(iso) ?? [];
        return (
          <article key={iso} className="shamell-glass-surface rounded-xl border border-gold/12 p-3">
            <p className="font-brand text-[10px] tracking-widest text-gold/75">
              {WEEKDAY_SHORT[index]} {DAY_NUMBER_LABEL.format(new Date(`${iso}T12:00:00Z`))}
            </p>
            <div className="mt-3 space-y-2">
              {rows.length === 0 ? (
                <p className="rounded-lg border border-dashed border-gold/20 px-2 py-3 text-center text-xs text-foreground/40">
                  No events
                </p>
              ) : null}
              {rows.map((row) => (
                <MiAgendaEventListItem
                  key={row.id}
                  row={row}
                  selectedId={selectedId}
                  onSelect={onSelect}
                  variant="week"
                />
              ))}
            </div>
          </article>
        );
      })}
    </div>
  );
}
