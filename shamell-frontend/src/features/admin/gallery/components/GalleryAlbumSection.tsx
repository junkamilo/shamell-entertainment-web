import { ChevronDown, Image as ImageIcon, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import type { GalleryCategory, GalleryPhoto } from "../types/gallery.types";
import GalleryPhotoCard from "./GalleryPhotoCard";

type Props = {
  category: GalleryCategory;
  photos: GalleryPhoto[];
  isExpanded: boolean;
  onToggleExpand: () => void;
  onUploadHere: () => void;
  onEditPhoto: (photo: GalleryPhoto) => void;
  onDeletePhoto: (photoId: string) => void;
  onTogglePhoto: (photo: GalleryPhoto) => void;
};

export default function GalleryAlbumSection({
  category,
  photos,
  isExpanded,
  onToggleExpand,
  onUploadHere,
  onEditPhoto,
  onDeletePhoto,
  onTogglePhoto,
}: Props) {
  const n = photos.length;

  return (
    <article className="shamell-glass-surface relative overflow-hidden rounded-2xl border border-gold/14">
      <div className="pointer-events-none absolute inset-0 rounded-2xl bg-linear-to-br from-gold/6 via-transparent to-transparent opacity-90" />
      <div className="shamell-glass-surface relative border-b border-gold/12 px-5 py-4 md:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div className="min-w-0 w-full sm:flex-1 sm:pr-1">
            <p className="font-brand text-[9px] tracking-[0.18em] text-gold/55">ALBUM</p>
            <h3 className="mt-1 wrap-break-word font-brand text-xl tracking-[0.06em] text-gold md:text-2xl">
              {category.name}
            </h3>
            <p className="mt-1 font-body text-xs text-foreground/45">
              {n === 0 ? "No files in this album" : n === 1 ? "1 file" : `${n} files`}
            </p>
          </div>
          <div className="flex w-full shrink-0 items-center gap-2 sm:w-auto sm:justify-end">
            <button
              type="button"
              onClick={onUploadHere}
              className="inline-flex min-h-11 min-w-0 flex-1 items-center justify-center gap-2 rounded-xl border border-gold/35 bg-gold/10 px-4 py-2.5 font-brand text-[10px] tracking-[0.14em] text-gold transition hover:border-gold/55 hover:bg-gold/18 sm:flex-initial sm:px-4"
            >
              <Upload className="h-3.5 w-3.5 shrink-0" strokeWidth={1.6} />
              <span className="truncate sm:whitespace-normal">Upload here</span>
            </button>
            <button
              type="button"
              onClick={onToggleExpand}
              aria-expanded={isExpanded}
              aria-label={
                isExpanded ? `Hide album preview ${category.name}` : `Show album preview ${category.name}`
              }
              className="shrink-0 rounded-xl border border-gold/18 p-2.5 text-gold/85 transition hover:border-gold/40 hover:bg-gold/10"
            >
              <ChevronDown
                className={cn("h-4 w-4 transition-transform duration-200", isExpanded && "rotate-180")}
                strokeWidth={1.75}
              />
            </button>
          </div>
        </div>
      </div>

      {isExpanded ? (
        <div className="relative p-4 md:p-5">
          {n === 0 ? (
            <div className="shamell-glass-surface flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-gold/20 px-6 py-12 text-center">
              <ImageIcon className="h-9 w-9 text-gold/25" strokeWidth={1.2} />
              <p className="font-body text-sm text-foreground/45">No media in this album yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {photos.map((photo) => (
                <GalleryPhotoCard
                  key={photo.id}
                  photo={photo}
                  categoryName={category.name}
                  onEdit={() => onEditPhoto(photo)}
                  onDelete={() => onDeletePhoto(photo.id)}
                  onToggle={() => onTogglePhoto(photo)}
                />
              ))}
            </div>
          )}
        </div>
      ) : null}
    </article>
  );
}
