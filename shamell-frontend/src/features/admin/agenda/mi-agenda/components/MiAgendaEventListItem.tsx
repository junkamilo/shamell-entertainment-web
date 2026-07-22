import {
  displayName,
  durationLabel,
  eventTypeLabel,
} from "../lib/miAgendaBookingUtils";
import type { EnrichedBooking } from "../types/miAgenda.types";

type Props = {
  row: EnrichedBooking;
  selectedId: string | null;
  onSelect: (id: string) => void;
  variant?: "day" | "week" | "month";
};

export default function MiAgendaEventListItem({
  row,
  selectedId,
  onSelect,
  variant = "week",
}: Props) {
  const isSelected = selectedId === row.id;
  const baseClass = isSelected
    ? "border-gold/45 bg-gold/12"
    : "border-gold/20 hover:border-gold/35 hover:bg-gold/8";

  if (variant === "month") {
    return (
      <button
        type="button"
        onClick={() => onSelect(row.id)}
        className={`w-full rounded-md border px-2 py-1.5 text-left ${baseClass}`}
      >
        <p className="truncate font-brand text-[10px] tracking-wide text-gold">
          {row.start} - {row.end}
        </p>
        <p className="truncate text-[11px] text-foreground/70">{displayName(row)}</p>
      </button>
    );
  }

  if (variant === "day") {
    return (
      <button
        type="button"
        onClick={() => onSelect(row.id)}
        className={`w-full rounded-lg border px-3 py-2 text-left transition ${baseClass}`}
      >
        <p className="font-brand text-[10px] tracking-widest text-gold">
          {row.start} - {row.end}{" "}
          <span className="text-foreground/45">· {durationLabel(row.durationM)}</span>
        </p>
        <p className="mt-1 text-sm text-foreground/85">{displayName(row)}</p>
        <p className="text-xs text-foreground/60">{eventTypeLabel(row)}</p>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onSelect(row.id)}
      className={`w-full rounded-lg border px-2.5 py-2 text-left transition ${baseClass}`}
    >
      <p className="font-brand text-[10px] tracking-widest text-gold">
        {row.start} - {row.end}
      </p>
      <p className="mt-1 truncate text-xs text-foreground/80">{displayName(row)}</p>
      <p className="truncate text-[11px] text-foreground/55">{eventTypeLabel(row)}</p>
    </button>
  );
}
