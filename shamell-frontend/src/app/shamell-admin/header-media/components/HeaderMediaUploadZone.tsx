import { type RefObject } from "react";
import { CloudUpload } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  fileInputRef: RefObject<HTMLInputElement | null>;
  dragOver: boolean;
  onPickFiles: () => void;
  onInputChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onDropzoneDragOver: (e: React.DragEvent<HTMLButtonElement>) => void;
  onDropzoneDragLeave: (e: React.DragEvent<HTMLButtonElement>) => void;
  onDropzoneDrop: (e: React.DragEvent<HTMLButtonElement>) => void;
};

export default function HeaderMediaUploadZone({
  fileInputRef,
  dragOver,
  onPickFiles,
  onInputChange,
  onDropzoneDragOver,
  onDropzoneDragLeave,
  onDropzoneDrop,
}: Props) {
  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        multiple
        className="hidden"
        onChange={onInputChange}
      />
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="font-brand text-[11px] tracking-[0.2em] text-gold/90">01 — UPLOAD MEDIA</p>
      </div>
      <button
        type="button"
        onClick={onPickFiles}
        onDragOver={onDropzoneDragOver}
        onDragLeave={onDropzoneDragLeave}
        onDrop={onDropzoneDrop}
        className={cn(
          "flex min-h-[200px] w-full flex-col items-center justify-center rounded-2xl border border-dashed px-6 py-10 text-center transition",
          dragOver
            ? "border-gold/50 bg-gold/8 ring-2 ring-gold/20"
            : "border-gold/25 bg-black/10 hover:border-gold/38",
        )}
      >
        <CloudUpload className="h-10 w-10 text-gold/80" strokeWidth={1.25} aria-hidden />
        <p className="mt-4 font-body text-sm text-foreground">
          Drag images or videos here or{" "}
          <span className="font-medium text-gold underline decoration-gold/40 underline-offset-4">
            choose files
          </span>
        </p>
        <p className="mt-2 max-w-md font-body text-xs text-foreground/55">
          JPG · PNG · WebP · MP4 · WebM · 1920 × 1080 recommended · multiple files allowed
        </p>
      </button>
    </>
  );
}
