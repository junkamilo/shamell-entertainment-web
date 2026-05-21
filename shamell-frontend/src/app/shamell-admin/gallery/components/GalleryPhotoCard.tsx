import Image from "next/image";
import { Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatRelativeEn, isVideoMedia } from "../lib/galleryDisplay";
import type { GalleryPhoto } from "../types/gallery.types";

type Props = {
  photo: GalleryPhoto;
  categoryName: string;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: () => void;
};

export default function GalleryPhotoCard({ photo, categoryName, onEdit, onDelete, onToggle }: Props) {
  return (
    <div
      className={cn(
        "shamell-glass-surface group flex flex-col overflow-hidden rounded-xl border border-gold/16 transition hover:border-gold/30",
        !photo.isActive && "opacity-60",
      )}
    >
      <div className="relative aspect-square w-full overflow-hidden bg-gold/5">
        {isVideoMedia(photo) ? (
          <video
            src={photo.imageUrl}
            className="h-full w-full object-cover"
            muted
            playsInline
            preload="metadata"
          />
        ) : (
          <Image
            src={photo.imageUrl}
            alt={`Medio en ${categoryName}`}
            fill
            className="object-cover transition duration-300 group-hover:scale-[1.02]"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
          />
        )}
        <div className="absolute left-2 top-2 flex flex-wrap gap-1">
          {isVideoMedia(photo) ? (
            <span className="shamell-glass-surface rounded border border-sky-400/35 px-1.5 py-0.5 font-body text-[8px] uppercase tracking-wide text-sky-100/95">
              Video
            </span>
          ) : null}
          {!photo.isActive ? (
            <span className="shamell-glass-surface rounded border border-foreground/25 px-1.5 py-0.5 font-brand text-[8px] tracking-[0.1em] text-foreground/70">
              Oculto
            </span>
          ) : null}
        </div>
      </div>
      <div className="flex flex-col gap-2 border-t border-gold/10 p-2.5">
        <p className="truncate font-body text-[10px] text-foreground/40">
          {formatRelativeEn(photo.updatedAt ?? photo.createdAt)}
        </p>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onEdit}
            className="rounded-lg border border-gold/20 p-1.5 text-foreground/65 transition hover:bg-gold/10 hover:text-gold"
            aria-label="Edit media"
          >
            <Pencil className="h-3.5 w-3.5" strokeWidth={1.6} />
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="rounded-lg border border-red-400/25 p-1.5 text-foreground/65 transition hover:bg-red-500/10 hover:text-red-300"
            aria-label="Delete media"
          >
            <Trash2 className="h-3.5 w-3.5" strokeWidth={1.6} />
          </button>
          <button
            type="button"
            onClick={onToggle}
            className={cn(
              "relative ml-auto h-7 w-12 shrink-0 rounded-full border transition",
              photo.isActive
                ? "border-emerald-400/45 bg-emerald-500/22"
                : "border-gold/40 bg-gold/10 ring-1 ring-gold/20",
            )}
            title={photo.isActive ? "Visible on site" : "Hidden on site"}
            aria-label={`${photo.isActive ? "Hide" : "Show"} on site`}
          >
            <span
              className={cn(
                "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition",
                photo.isActive ? "left-6" : "left-1",
              )}
            />
          </button>
        </div>
      </div>
    </div>
  );
}
