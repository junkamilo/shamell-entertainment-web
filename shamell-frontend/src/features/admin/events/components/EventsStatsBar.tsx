import type { EventsStats, EventsStatsBarVariant } from "../types/events.types";

type Props = {
  stats: EventsStats;
  variant?: EventsStatsBarVariant;
};

export default function EventsStatsBar({ stats, variant = "general" }: Props) {
  const cards =
    variant === "upcomingSite"
      ? ([
          ["TOTAL ON COMING", String(stats.total)],
          ["ACTIVE", String(stats.activeCount)],
          ["ITEMS TOTAL", String(stats.itemsTotal)],
        ] as const)
      : ([
          ["TOTAL EVENTS", String(stats.total)],
          ["ACTIVE", String(stats.activeCount)],
          ["ITEMS TOTAL", String(stats.itemsTotal)],
        ] as const);

  return (
    <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:mb-8 lg:gap-4">
      {cards.map(([label, value]) => (
        <div key={label} className="shamell-glass-surface rounded-xl px-4 py-3">
          <p className="font-brand text-[10px] tracking-[0.16em] text-gold/75">{label}</p>
          <p className="mt-1 truncate font-brand text-lg tracking-wide text-gold md:text-xl">{value}</p>
        </div>
      ))}
    </div>
  );
}
