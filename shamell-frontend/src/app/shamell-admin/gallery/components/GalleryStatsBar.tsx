import type { GalleryStats } from "../types/gallery.types";

type Props = {
  stats: GalleryStats;
};

export default function GalleryStatsBar({ stats }: Props) {
  return (
    <div className="mb-6 grid grid-cols-2 gap-3 lg:mb-8 lg:grid-cols-4 lg:gap-4">
      {(
        [
          ["TOTAL MEDIOS", String(stats.total)],
          ["VISIBLES", String(stats.visible)],
          ["ALBUMS IN USE", String(stats.catsWith)],
          ["LAST UPLOAD", stats.recent],
        ] as const
      ).map(([label, value]) => (
        <div key={label} className="shamell-glass-surface rounded-xl px-4 py-3">
          <p className="font-brand text-[10px] tracking-[0.16em] text-gold/75">{label}</p>
          <p className="mt-1 truncate font-brand text-lg tracking-wide text-gold md:text-xl">
            {value}
          </p>
        </div>
      ))}
    </div>
  );
}
