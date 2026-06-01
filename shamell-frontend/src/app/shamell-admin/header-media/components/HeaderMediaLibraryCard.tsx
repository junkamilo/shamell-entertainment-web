import { Crosshair, Eye, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { clampPercent } from "../lib/headerMediaUtils";
import type { HeaderPhoto } from "../types/headerMedia.types";
import HeaderMediaLibraryMedia from "./HeaderMediaLibraryMedia";

type Props = {
  photo: HeaderPhoto;
  globalIndex: number;
  onView: (photo: HeaderPhoto, globalIndex: number) => void;
  onFocus: (photo: HeaderPhoto) => void;
  onToggle: (photo: HeaderPhoto) => void;
  onDelete: (photo: HeaderPhoto) => void;
};

export default function HeaderMediaLibraryCard({
  photo,
  globalIndex,
  onView,
  onFocus,
  onToggle,
  onDelete,
}: Props) {
  return (
    <article
      className={cn("overflow-hidden rounded-xl border border-gold/18", !photo.isActive && "opacity-55")}
    >
      <div className="relative aspect-video">
        <HeaderMediaLibraryMedia
          photo={photo}
          className="object-cover"
          style={{
            objectPosition: `${clampPercent(photo.focalX)}% ${clampPercent(photo.focalY)}%`,
          }}
        />
        <span className="absolute left-2 top-2 rounded-md border border-gold/35 bg-black/55 px-2 py-0.5 font-brand text-[10px] tracking-widest text-gold">
          #{globalIndex}
        </span>
        <span
          className={cn(
            "absolute right-2 top-2 rounded-md border px-2 py-0.5 font-brand text-[10px] tracking-widest",
            photo.isActive
              ? "border-emerald-400/45 bg-black/55 text-emerald-200"
              : "border-gold/30 bg-black/55 text-foreground/60",
          )}
        >
          {photo.isActive ? "● ACTIVE" : "● INACTIVE"}
        </span>
      </div>
      <div className="flex flex-wrap items-center justify-end gap-2 border-t border-gold/12 bg-black/20 px-2.5 py-2">
        <button
          type="button"
          onClick={() => onView(photo, globalIndex)}
          className="shrink-0 rounded-lg border border-gold/25 p-1.5 text-gold transition hover:bg-gold/10"
          aria-label="Preview media"
        >
          <Eye className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => onFocus(photo)}
          className="shrink-0 rounded-lg border border-gold/25 p-1.5 text-gold transition hover:bg-gold/10"
          aria-label="Adjust focus"
        >
          <Crosshair className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => onToggle(photo)}
          className={cn(
            "relative h-7 w-12 shrink-0 rounded-full border transition",
            photo.isActive
              ? "border-emerald-400/45 bg-emerald-500/22"
              : "border-gold/40 bg-gold/10",
          )}
          aria-label={photo.isActive ? "Hide from slider" : "Show in slider"}
        >
          <span
            className={cn(
              "absolute top-0.5 h-5 w-5 rounded-full bg-white transition",
              photo.isActive ? "left-6" : "left-1",
            )}
          />
        </button>
        <button
          type="button"
          onClick={() => onDelete(photo)}
          className="shrink-0 rounded-lg border border-red-400/30 p-1.5 text-red-200 transition hover:bg-red-500/10"
          aria-label="Delete item"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </article>
  );
}
