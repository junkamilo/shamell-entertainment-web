import { Trash2, X } from "lucide-react";

type Props = {
  imagePreviewUrl: string | null;
  existingImageUrl: string | null;
  formPreviewMediaIsVideo: boolean;
  editingId: string | null;
  hasSelectedFile: boolean;
  isSubmitting: boolean;
  isClearingMedia: boolean;
  onRemoveSelectedFile: () => void;
  onRequestClearSavedMedia: () => void;
  onOpenLightbox: () => void;
};

export default function ServicesFormPreview({
  imagePreviewUrl,
  existingImageUrl,
  formPreviewMediaIsVideo,
  editingId,
  hasSelectedFile,
  isSubmitting,
  isClearingMedia,
  onRemoveSelectedFile,
  onRequestClearSavedMedia,
  onOpenLightbox,
}: Props) {
  if (!imagePreviewUrl && !existingImageUrl) return null;

  return (
    <div className="shamell-glass-surface rounded-xl p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-xs text-gold/85">
          {hasSelectedFile
            ? formPreviewMediaIsVideo
              ? "Preview of selected video"
              : "Preview of selected image"
            : formPreviewMediaIsVideo
              ? "Current service video"
              : "Current service image"}
        </p>
        <div className="flex shrink-0 items-center gap-1">
          {imagePreviewUrl && hasSelectedFile ? (
            <button
              type="button"
              onClick={onRemoveSelectedFile}
              className="rounded-full border border-gold/30 p-1 text-gold/85 transition hover:bg-gold/10 hover:text-gold"
              aria-label="Remove selected file"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : null}
          {editingId && !hasSelectedFile && existingImageUrl ? (
            <button
              type="button"
              onClick={onRequestClearSavedMedia}
              disabled={isClearingMedia}
              className="rounded-full border border-red-400/35 p-1.5 text-red-300/90 transition hover:bg-red-500/15 disabled:opacity-45"
              aria-label="Delete saved media from storage"
              title="Remove from Cloudinary and database"
            >
              <Trash2 className="h-3.5 w-3.5" strokeWidth={1.6} />
            </button>
          ) : null}
        </div>
      </div>
      <div className="shamell-glass-surface overflow-hidden rounded-lg p-2">
        <button
          type="button"
          onClick={onOpenLightbox}
          className="block w-full"
          aria-label="Open enlarged preview"
          disabled={isSubmitting}
        >
          {formPreviewMediaIsVideo ? (
            <video
              src={imagePreviewUrl ?? existingImageUrl ?? ""}
              className="h-44 w-full rounded-md object-cover transition hover:opacity-90"
              muted
              playsInline
              controls
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imagePreviewUrl ?? existingImageUrl ?? ""}
              alt="Vista previa"
              className="h-44 w-full rounded-md object-cover transition hover:opacity-90"
            />
          )}
        </button>
      </div>
    </div>
  );
}
