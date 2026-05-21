import { type FormEvent } from "react";
import Image from "next/image";
import { ImagePlus, Loader2, Upload, X } from "lucide-react";
import { fileKey } from "../lib/headerMediaUtils";

type Props = {
  pendingFiles: File[];
  pendingPreviews: Record<string, string>;
  pendingTotalBytes: number;
  formatFileSize: (bytes: number) => string;
  isSaving: boolean;
  onSubmit: (event: FormEvent) => void;
  onPickFiles: () => void;
  onClearPending: () => void;
  onRemovePendingOne: (key: string) => void;
};

export default function HeaderMediaPendingQueue({
  pendingFiles,
  pendingPreviews,
  pendingTotalBytes,
  formatFileSize,
  isSaving,
  onSubmit,
  onPickFiles,
  onClearPending,
  onRemovePendingOne,
}: Props) {
  if (pendingFiles.length === 0) return null;

  return (
    <form onSubmit={onSubmit}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <p className="inline-flex rounded-full border border-gold/35 px-3 py-1 font-brand text-[10px] tracking-[0.16em] text-gold">
          02 — READY TO PUBLISH
        </p>
        <button
          type="button"
          onClick={onPickFiles}
          className="rounded-full border border-gold/28 px-3 py-1.5 font-brand text-[10px] tracking-[0.14em] text-gold transition hover:bg-gold/12"
        >
          + ADD MORE
        </button>
      </div>

      <div className="rounded-xl border border-dashed border-gold/22 bg-black/15 px-4 py-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gold/10 pb-3">
          <p className="font-body text-sm text-foreground">
            <span className="font-semibold text-gold/90">{pendingFiles.length}</span> file
            {pendingFiles.length === 1 ? "" : "s"} selected
            {" · "}
            <span className="text-foreground/70">{formatFileSize(pendingTotalBytes)} total</span>
          </p>
        </div>
        <ul className="mt-3 space-y-3">
          {pendingFiles.map((file) => {
            const k = fileKey(file);
            const previewUrl = pendingPreviews[k];
            return (
              <li
                key={k}
                className="flex flex-wrap items-center gap-3 rounded-lg border border-gold/12 bg-black/20 p-3"
              >
                <div className="relative h-14 w-18 shrink-0 overflow-hidden rounded-md border border-gold/15 bg-black/30">
                  {previewUrl ? (
                    file.type.startsWith("video/") ? (
                      <video
                        src={previewUrl}
                        muted
                        playsInline
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                    ) : (
                      <Image src={previewUrl} alt="" fill unoptimized className="object-cover" />
                    )
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <ImagePlus className="h-6 w-6 text-gold/30" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-body text-xs text-foreground">{file.name}</p>
                  <p className="font-body text-[11px] text-foreground/50">
                    {formatFileSize(file.size)}
                    {isSaving ? (
                      <>
                        {" · "}
                        <span className="text-gold">Publicando...</span>
                      </>
                    ) : (
                      <>
                        {" · "}
                        <span className="text-foreground/45">Queued</span>
                      </>
                    )}
                  </p>
                  {isSaving ? (
                    <div className="mt-2 h-1 overflow-hidden rounded-full bg-gold/15">
                      <div className="h-full w-[60%] animate-pulse rounded-full bg-gold/55" />
                    </div>
                  ) : null}
                </div>
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => onRemovePendingOne(k)}
                  className="shrink-0 rounded-lg border border-gold/25 p-1.5 text-foreground/70 transition hover:bg-gold/10 hover:text-gold disabled:opacity-40"
                  aria-label="Remove file"
                >
                  <X className="h-4 w-4" />
                </button>
              </li>
            );
          })}
        </ul>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-gold/10 pt-4">
          <p className="flex items-center gap-2 font-body text-xs text-foreground/50">
            <span className="inline-block h-2 w-2 rounded-full bg-gold/50" aria-hidden />
            Images and videos publish when you confirm.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={isSaving}
              onClick={onClearPending}
              className="rounded-xl border border-gold/28 px-4 py-2 font-brand text-[10px] tracking-[0.14em] text-foreground/80 transition hover:border-gold/45 hover:text-gold disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving || pendingFiles.length === 0}
              className="inline-flex items-center gap-2 rounded-xl border border-gold/35 bg-gold/12 px-5 py-2 font-brand text-[10px] tracking-[0.14em] text-gold transition hover:bg-gold/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              Publish {pendingFiles.length} file{pendingFiles.length === 1 ? "" : "s"}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
