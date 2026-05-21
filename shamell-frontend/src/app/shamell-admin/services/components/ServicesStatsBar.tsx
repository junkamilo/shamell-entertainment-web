import type { ServicesStats } from "../types/services.types";

type Props = {
  stats: ServicesStats;
  typeMostUsedLabel: string;
};

export default function ServicesStatsBar({ stats, typeMostUsedLabel }: Props) {
  return (
    <div className="mb-6 grid min-w-0 grid-cols-2 gap-3 lg:mb-8 lg:grid-cols-4 lg:gap-4">
      {(
        [
          ["TOTAL SERVICES", String(stats.total)],
          ["ACTIVE", String(stats.active)],
          ["TOTAL ITEMS", String(stats.itemsTotal)],
          ["MOST-USED TYPE", typeMostUsedLabel],
        ] as const
      ).map(([label, value]) => (
        <div key={label} className="min-w-0 shamell-glass-surface rounded-xl px-4 py-3">
          <p className="font-brand text-[10px] tracking-[0.16em] text-gold/75">{label}</p>
          <p className="mt-1 line-clamp-2 break-words font-brand text-lg tracking-wide text-gold md:text-xl">
            {value}
          </p>
        </div>
      ))}
    </div>
  );
}
