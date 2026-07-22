import { Aperture, ChevronDown, Image as ImageIcon, Layers, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatRelativeEn } from "../lib/galleryCategoriesDisplay";
import type { GalleryCategory } from "../types/galleryCategories.types";

type Props = {
  category: GalleryCategory;
  count: number;
  previews: string[];
  isSpotlight: boolean;
  isExpanded: boolean;
  isToggling: boolean;
  onToggleExpand: () => void;
  onEdit: () => void;
  onToggleActive: () => void;
};

export default function GalleryCategoriesCard({
  category,
  count,
  previews,
  isSpotlight,
  isExpanded,
  isToggling,
  onToggleExpand,
  onEdit,
  onToggleActive,
}: Props) {
  const mediaLabel = count === 1 ? "1 item" : `${count} items`;

  return (
    <article
      className={cn(
        "shamell-glass-surface relative flex flex-col overflow-hidden rounded-2xl border p-1 transition",
        isSpotlight
          ? "border-gold/40 ring-1 ring-gold/25 md:col-span-2"
          : "border-gold/16 hover:border-gold/28",
      )}
    >
      <div
        className={cn(
          "pointer-events-none absolute inset-0 rounded-2xl bg-linear-to-br opacity-90",
          isSpotlight
            ? "from-gold/12 via-transparent to-violet-950/20"
            : "from-gold/5 via-transparent to-transparent",
        )}
      />

      <div className="relative z-1 flex min-h-0 flex-1 flex-col gap-3 p-4 md:p-5">
        <div className="flex items-start justify-between gap-3">
          <p
            className={cn(
              "flex items-center gap-2 font-brand text-[10px] tracking-[0.16em]",
              category.isActive ? "text-emerald-400/90" : "text-foreground/45",
            )}
          >
            <span className="text-gold/90">•</span>
            {category.isActive ? "ACTIVE" : "INACTIVE"}
          </p>
          <button
            type="button"
            onClick={onToggleExpand}
            aria-expanded={isExpanded}
            aria-label={
              isExpanded ? `Hide preview for ${category.name}` : `Show preview for ${category.name}`
            }
            className="shrink-0 rounded-lg border border-gold/18 p-1.5 text-gold/85 transition hover:border-gold/40 hover:bg-gold/10"
          >
            <ChevronDown
              className={cn("h-4 w-4 transition-transform duration-200", isExpanded && "rotate-180")}
              strokeWidth={1.75}
            />
          </button>
        </div>

        <h2 className="min-w-0 font-brand text-xl tracking-[0.06em] text-gold md:text-2xl">
          {category.name}
        </h2>

        {isExpanded ? (
          <>
            <p className="flex items-start gap-2 font-body text-xs leading-relaxed text-foreground/50">
              <Layers className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold/40" strokeWidth={1.5} />
              Collection to group photos and videos in the public gallery.
            </p>

            <div className="shamell-glass-surface relative overflow-hidden rounded-xl border border-gold/14 p-3">
              <div className="mb-2 flex items-center gap-2">
                <Aperture className="h-3.5 w-3.5 text-gold/45" strokeWidth={1.5} />
                <p className="font-brand text-[9px] tracking-[0.14em] text-gold/55">PREVIEW</p>
              </div>
              {previews.length > 0 ? (
                <div
                  className={cn(
                    "grid gap-2",
                    isSpotlight ? "grid-cols-3 sm:grid-cols-4 lg:grid-cols-5" : "grid-cols-3 sm:grid-cols-4",
                  )}
                >
                  {previews.slice(0, isSpotlight ? 5 : 4).map((url, i) => (
                    <div
                      key={`${category.id}-${i}`}
                      className="relative aspect-square overflow-hidden rounded-lg border border-gold/22 bg-gold/5 shadow-inner"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt="" className="h-full w-full object-cover" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="shamell-glass-surface flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-gold/20 px-4 py-10 text-center">
                  <ImageIcon className="h-8 w-8 text-gold/30" strokeWidth={1.2} />
                  <p className="font-body text-[11px] text-foreground/40">No preview yet</p>
                </div>
              )}
            </div>
          </>
        ) : null}

        <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-gold/12 pt-4 font-body text-[11px] text-foreground/45">
          <span className="text-gold/70">{mediaLabel}</span>
          <span className="text-gold/25">·</span>
          <span>{formatRelativeEn(category.updatedAt ?? category.createdAt)}</span>
          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={onEdit}
              className="rounded-lg border border-gold/22 p-2 text-foreground/65 transition hover:bg-gold/10 hover:text-gold"
              aria-label={`Edit ${category.name}`}
            >
              <Pencil className="h-3.5 w-3.5" strokeWidth={1.6} />
            </button>
            <button
              type="button"
              onClick={onToggleActive}
              disabled={isToggling}
              className={cn(
                "relative h-7 w-12 shrink-0 rounded-full border transition",
                category.isActive
                  ? "border-emerald-400/45 bg-emerald-500/22"
                  : "border-gold/40 bg-gold/10 ring-1 ring-gold/20",
                isToggling && "cursor-not-allowed opacity-60",
              )}
              aria-label={`${category.isActive ? "Hide" : "Show"} ${category.name}`}
            >
              <span
                className={cn(
                  "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition",
                  category.isActive ? "left-6" : "left-1",
                )}
              />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
