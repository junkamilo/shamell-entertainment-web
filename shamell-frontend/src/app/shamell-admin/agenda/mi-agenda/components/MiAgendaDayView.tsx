import { RANGE_LABEL } from "../lib/miAgendaConstants";
import type { EnrichedBooking } from "../types/miAgenda.types";
import MiAgendaEventListItem from "./MiAgendaEventListItem";

type Props = {
  anchorIso: string;
  rows: EnrichedBooking[];
  selectedId: string | null;
  onSelect: (id: string) => void;
};

export default function MiAgendaDayView({ anchorIso, rows, selectedId, onSelect }: Props) {
  return (
    <div className="shamell-glass-surface rounded-xl border border-gold/12 p-4">
      <p className="mb-3 font-brand text-[11px] tracking-[0.16em] text-gold/80">
        {RANGE_LABEL.format(new Date(`${anchorIso}T12:00:00Z`))}
      </p>
      <div className="space-y-2">
        {rows.length === 0 ? (
          <p className="rounded-lg border border-dashed border-gold/20 px-3 py-6 text-center text-sm text-foreground/45">
            No events
          </p>
        ) : null}
        {rows.map((row) => (
          <MiAgendaEventListItem
            key={row.id}
            row={row}
            selectedId={selectedId}
            onSelect={onSelect}
            variant="day"
          />
        ))}
      </div>
    </div>
  );
}
