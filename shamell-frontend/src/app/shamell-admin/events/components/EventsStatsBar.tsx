import type { EventsStats } from "../types/events.types";

type Props = {
  stats: EventsStats;
};

export default function EventsStatsBar({ stats }: Props) {
  return (
    <div className="mb-6 grid grid-cols-2 gap-3 lg:mb-8 lg:grid-cols-4 lg:gap-4">
      {(
        [
          ["TOTAL EVENTS", String(stats.total)],
          ["UPCOMING", String(stats.upcoming)],
          ["ITEMS TOTAL", String(stats.itemsTotal)],
          ["MOST RECENT", stats.nearestLabel],
        ] as const
      ).map(([label, value]) => (
        <div key={label} className="shamell-glass-surface rounded-xl px-4 py-3">
          <p className="font-brand text-[10px] tracking-[0.16em] text-gold/75">{label}</p>
          <p className="mt-1 truncate font-brand text-lg tracking-wide text-gold md:text-xl">{value}</p>
        </div>
      ))}
    </div>
  );
}
