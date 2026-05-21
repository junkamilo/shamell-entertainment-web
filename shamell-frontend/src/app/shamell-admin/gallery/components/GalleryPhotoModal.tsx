import { type FormEvent } from "react";
import { Image as ImageIcon, Sparkles, Upload } from "lucide-react";
import AdminModal from "@/components/admin/AdminModal";
import { GALLERY_CATCHALL_SLUG, GALLERY_UPLOAD_MAX_FILES } from "@/lib/galleryConstants";
import { cn } from "@/lib/utils";
import type { GalleryCategory } from "../types/gallery.types";

type Props = {
  isOpen: boolean;
  isSubmitting: boolean;
  editingId: string | null;
  canSubmitPhoto: boolean;
  selectedCategoryId: string;
  onSelectedCategoryIdChange: (id: string) => void;
  imageFiles: File[];
  onImageFilesChange: (files: File[]) => void;
  sortedActiveCategories: GalleryCategory[];
  countByCategory: Record<string, number>;
  selectedCategoryName: string | undefined;
  selectedCategorySlug: string | undefined;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export default function GalleryPhotoModal({
  isOpen,
  isSubmitting,
  editingId,
  canSubmitPhoto,
  selectedCategoryId,
  onSelectedCategoryIdChange,
  imageFiles,
  onImageFilesChange,
  sortedActiveCategories,
  countByCategory,
  selectedCategoryName,
  selectedCategorySlug,
  onClose,
  onSubmit,
}: Props) {
  return (
    <AdminModal
      title={editingId ? "Edit media" : "Upload to a category"}
      isOpen={isOpen}
      onClose={onClose}
    >
      <form id="gallery-photo-form" onSubmit={onSubmit} className="space-y-6">
        <div className="rounded-xl border border-gold/20 bg-gold/5 px-4 py-3">
          <p className="flex items-start gap-2 font-body text-xs leading-relaxed text-foreground/75">
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-gold" strokeWidth={1.5} />
            <span>
              <strong className="text-gold/95">Important:</strong> files are saved to the category you
              select below. New uploads: select up to {GALLERY_UPLOAD_MAX_FILES} files at once. When
              editing, only one replacement file applies.
            </span>
          </p>
        </div>

        <div>
          <p className="font-brand text-[11px] tracking-[0.2em] text-gold/95">1 · DESTINATION CATEGORY</p>
          <div className="mt-3 grid max-h-52 grid-cols-1 gap-2 overflow-y-auto sm:grid-cols-2">
            {sortedActiveCategories.map((c) => {
              const selected = selectedCategoryId === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => onSelectedCategoryIdChange(c.id)}
                  className={cn(
                    "flex flex-col rounded-xl border px-3 py-3 text-left transition",
                    selected
                      ? "border-gold/55 bg-gold/15 ring-1 ring-gold/30"
                      : "shamell-glass-surface border-gold/15 hover:border-gold/30",
                  )}
                >
                  <span className="font-brand text-sm tracking-[0.06em] text-gold">{c.name}</span>
                  <span className="mt-0.5 font-mono text-[10px] text-foreground/45">/{c.slug}</span>
                  <span className="mt-2 font-body text-[10px] text-foreground/40">
                    {countByCategory[c.id] ?? 0} file(s) in this album
                  </span>
                </button>
              );
            })}
          </div>
          {selectedCategoryName ? (
            <p className="mt-3 font-body text-xs text-foreground/55">
              Destino: <span className="text-gold/90">«{selectedCategoryName}»</span>
            </p>
          ) : (
            <p className="mt-3 text-xs text-amber-300/90">Select a category to continue.</p>
          )}
          {selectedCategorySlug === GALLERY_CATCHALL_SLUG ? (
            <p className="mt-2 max-w-xl font-body text-xs leading-relaxed text-foreground/55">
              This «All» album is for general uploads. On the public site these photos appear under the{" "}
              <span className="text-gold/90">All</span> filter only; this album is not listed as a separate
              tab.
            </p>
          ) : null}
        </div>

        <label className="block">
          <p className="font-brand text-[11px] tracking-[0.2em] text-gold/95">2 · FILE</p>
          <div className="shamell-glass-surface mt-2 flex flex-col items-center justify-center rounded-xl border border-dashed border-gold/25 px-4 py-8 text-center">
            <Upload className="mx-auto h-8 w-8 text-gold/50" strokeWidth={1.3} />
            <p className="mt-2 font-body text-xs text-foreground/55">
              {editingId
                ? "Optional: one new file (replaces the current one)."
                : `Images or videos — select up to ${GALLERY_UPLOAD_MAX_FILES} files at once.`}
            </p>
            <input
              type="file"
              accept="image/*,video/*"
              multiple={!editingId}
              onChange={(event) => {
                const list = event.target.files;
                if (!list?.length) {
                  onImageFilesChange([]);
                  return;
                }
                if (editingId) {
                  onImageFilesChange([list[0]]);
                } else {
                  onImageFilesChange(Array.from(list));
                }
              }}
              className="mt-4 w-full max-w-xs cursor-pointer rounded-lg border border-gold/20 px-3 py-2 text-xs file:mr-3 file:rounded-md file:border-0 file:bg-gold/20 file:px-3 file:py-1.5 file:text-gold"
            />
            {imageFiles.length > 0 ? (
              <div className="mt-3 w-full max-w-md text-left">
                <p className="font-body text-xs text-foreground/60">
                  {imageFiles.length} file(s) selected
                  {!editingId && imageFiles.length > GALLERY_UPLOAD_MAX_FILES
                    ? ` — max ${GALLERY_UPLOAD_MAX_FILES} per batch. Remove extras before uploading.`
                    : null}
                </p>
                <ul className="mt-1 max-h-24 overflow-y-auto font-mono text-[10px] text-foreground/45">
                  {imageFiles.slice(0, 12).map((f) => (
                    <li key={`${f.name}-${f.size}`} className="truncate">
                      {f.name}
                    </li>
                  ))}
                  {imageFiles.length > 12 ? (
                    <li className="text-foreground/35">…and {imageFiles.length - 12} more</li>
                  ) : null}
                </ul>
              </div>
            ) : null}
          </div>
        </label>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-gold/30 px-5 py-3 text-sm tracking-[0.08em] text-foreground/80 transition hover:bg-white/5"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !canSubmitPhoto}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-gold/35 bg-gold/15 px-5 py-3 font-brand text-sm tracking-[0.08em] text-gold transition hover:bg-gold/25 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <ImageIcon className="h-4 w-4" strokeWidth={1.5} />
            {isSubmitting ? "Saving..." : editingId ? "Save changes" : "Upload to this category"}
          </button>
        </div>
      </form>
    </AdminModal>
  );
}
