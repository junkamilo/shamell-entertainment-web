import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ViewMode } from "../types/miAgenda.types";

type Props = {
  rangeText: string;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
};

export default function MiAgendaCalendarToolbar({
  rangeText,
  viewMode,
  onViewModeChange,
  onPrev,
  onNext,
  onToday,
}: Props) {
  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-gold/12 pb-4">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onPrev}
          className="rounded-full border border-gold/25 p-2 text-gold transition hover:bg-gold/10"
          aria-label="Previous"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={onToday}
          className="rounded-full border border-gold/25 px-3 py-1.5 font-brand text-[10px] tracking-[0.14em] text-gold transition hover:bg-gold/10"
        >
          TODAY
        </button>
        <button
          type="button"
          onClick={onNext}
          className="rounded-full border border-gold/25 p-2 text-gold transition hover:bg-gold/10"
          aria-label="Next"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <p className="font-brand text-[11px] tracking-[0.18em] text-gold/85">{rangeText}</p>

      <div className="inline-flex rounded-full border border-gold/20 bg-black/25 p-1">
        {(["day", "week", "month"] as ViewMode[]).map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => onViewModeChange(mode)}
            className={`rounded-full px-3 py-1 font-brand text-[10px] tracking-[0.16em] transition ${
              viewMode === mode ? "border border-gold/40 bg-gold/12 text-gold" : "text-foreground/55 hover:text-gold"
            }`}
          >
            {mode === "day" ? "DAY" : mode === "week" ? "WEEK" : "MONTH"}
          </button>
        ))}
      </div>
    </div>
  );
}
