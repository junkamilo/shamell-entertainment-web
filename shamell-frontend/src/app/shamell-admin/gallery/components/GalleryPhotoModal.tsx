import { type FormEvent } from "react";
import { Image as ImageIcon } from "lucide-react";
import AdminModal from "@/components/admin/AdminModal";
import { AdminMediaPickControl } from "@/components/admin/AdminMediaPickControl";
import { GALLERY_UPLOAD_MAX_FILES } from "@/lib/galleryConstants";
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
                </button>
              );
            })}
          </div>
        </div>

        <div className="block">
          <p className="font-brand text-[11px] tracking-[0.2em] text-gold/95">2 · FILE</p>
          <div className="shamell-glass-surface mt-2 flex flex-col items-center rounded-xl border border-dashed border-gold/25 px-4 py-6">
            <p className="max-w-md text-center font-body text-xs text-foreground/55">
              {editingId
                ? "Optional: one new file (replaces the current one)."
                : `Images or videos — select up to ${GALLERY_UPLOAD_MAX_FILES} files at once.`}
            </p>
            <AdminMediaPickControl
              className="mt-3 w-full max-w-md"
              multiple={!editingId}
              disabled={isSubmitting}
              emptySelectionLabel={editingId ? "No file chosen" : "No files chosen"}
              selectedFileName={editingId ? (imageFiles[0]?.name ?? null) : null}
              selectedFileCount={editingId ? 0 : imageFiles.length}
              onFileChange={
                editingId
                  ? (file) => onImageFilesChange(file ? [file] : [])
                  : undefined
              }
              onFilesChange={editingId ? undefined : onImageFilesChange}
              aria-label={
                editingId
                  ? "Select replacement image or video"
                  : "Select images or videos to upload"
              }
            />
            {!editingId && imageFiles.length > GALLERY_UPLOAD_MAX_FILES ? (
              <p className="mt-3 max-w-md text-center font-body text-xs text-amber-300/90">
                Max {GALLERY_UPLOAD_MAX_FILES} files per batch. Remove extras before uploading.
              </p>
            ) : null}
            {!editingId && imageFiles.length > 0 ? (
              <ul className="mt-3 max-h-24 w-full max-w-md overflow-y-auto font-mono text-[10px] text-foreground/45">
                {imageFiles.slice(0, 12).map((f) => (
                  <li key={`${f.name}-${f.size}`} className="truncate">
                    {f.name}
                  </li>
                ))}
                {imageFiles.length > 12 ? (
                  <li className="text-foreground/35">…and {imageFiles.length - 12} more</li>
                ) : null}
              </ul>
            ) : null}
          </div>
        </div>

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
