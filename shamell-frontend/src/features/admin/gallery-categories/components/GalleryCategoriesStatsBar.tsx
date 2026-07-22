import type { GalleryCategoriesStats } from "../types/galleryCategories.types";

type Props = {
  stats: GalleryCategoriesStats;
};

export default function GalleryCategoriesStatsBar({ stats }: Props) {
  return (
    <div className="mb-6 grid grid-cols-2 gap-3 lg:mb-8 lg:grid-cols-4 lg:gap-4">
      {(
        [
          ["TOTAL", String(stats.total)],
          ["ACTIVE", String(stats.active)],
          ["WITH MEDIA", String(stats.withMedia)],
          ["SPOTLIGHT", stats.star],
        ] as const
      ).map(([label, value]) => (
        <div
          key={label}
          className="group relative overflow-hidden shamell-glass-surface rounded-xl px-4 py-3 transition hover:border-gold/25"
        >
          <div className="pointer-events-none absolute -right-6 -top-8 h-24 w-24 rounded-full bg-gold/10 blur-2xl transition group-hover:bg-gold/15" />
          <p className="relative font-brand text-[10px] tracking-[0.18em] text-gold/75">{label}</p>
          <p className="relative mt-1 truncate font-brand text-lg tracking-wide text-gold md:text-xl">
            {value}
          </p>
        </div>
      ))}
    </div>
  );
}
