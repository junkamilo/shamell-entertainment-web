import { type KeyboardEvent, type MouseEvent } from "react";
import { Loader2, Monitor, Smartphone, X } from "lucide-react";
import { clampPercent } from "../lib/headerMediaUtils";
import type { FocusDraft, HeaderPhoto } from "../types/headerMedia.types";
import HeaderMediaFocusMedia from "./HeaderMediaFocusMedia";

type Props = {
  editingFocusPhoto: HeaderPhoto | null;
  focusDraft: FocusDraft;
  setFocusDraft: React.Dispatch<React.SetStateAction<FocusDraft>>;
  focusEditorIsVideo: boolean;
  isSavingFocus: boolean;
  onClose: () => void;
  onSetDraftFromPoint: (event: MouseEvent<HTMLDivElement>, target: "desktop" | "mobile") => void;
  onSave: () => void;
};

export default function HeaderMediaFocusEditor({
  editingFocusPhoto,
  focusDraft,
  setFocusDraft,
  focusEditorIsVideo,
  isSavingFocus,
  onClose,
  onSetDraftFromPoint,
  onSave,
}: Props) {
  if (!editingFocusPhoto) return null;

  const previewKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-2 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="flex max-h-[94svh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-gold/20 bg-[#0b0f14]">
        <div className="flex items-start justify-between gap-4 border-b border-gold/10 px-4 py-3 md:px-6 md:py-4">
          <div>
            <h3 className="font-brand text-base tracking-[0.12em] text-gold">Adjust hero focus</h3>
            <p className="mt-1 text-xs text-foreground/60">
              Click the preview to move the focal point. This improves framing on laptop and mobile.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gold/30 p-1.5 text-foreground/70 transition hover:bg-gold/10 hover:text-gold"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-4 py-4 md:px-6 md:py-5">
          <div
            role="button"
            tabIndex={0}
            onClick={(event) => onSetDraftFromPoint(event, "desktop")}
            onKeyDown={previewKeyDown}
            className="relative aspect-video cursor-crosshair overflow-hidden rounded-xl border border-gold/20 sm:aspect-16/8"
          >
            <HeaderMediaFocusMedia
              url={editingFocusPhoto.imageUrl}
              isVideo={focusEditorIsVideo}
              objectPosition={`${focusDraft.desktopX}% ${focusDraft.desktopY}%`}
              className="object-cover scale-[1.12]"
            />
            <span
              className="pointer-events-none absolute h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-gold bg-black/50"
              style={{ left: `${focusDraft.desktopX}%`, top: `${focusDraft.desktopY}%` }}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_260px] md:items-start">
            <div className="w-full">
              <p className="mb-2 inline-flex items-center gap-1 text-[11px] tracking-widest text-gold/75">
                <Monitor className="h-3.5 w-3.5" />
                PREVIEW DESKTOP
              </p>
              <div
                role="button"
                tabIndex={0}
                onClick={(event) => onSetDraftFromPoint(event, "desktop")}
                onKeyDown={previewKeyDown}
                className="relative aspect-video w-full cursor-crosshair overflow-hidden rounded-xl border border-gold/20"
              >
                <HeaderMediaFocusMedia
                  url={editingFocusPhoto.imageUrl}
                  isVideo={focusEditorIsVideo}
                  objectPosition={`${focusDraft.desktopX}% ${focusDraft.desktopY}%`}
                  className="object-cover scale-[1.12]"
                />
                <span
                  className="pointer-events-none absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-gold bg-black/50"
                  style={{ left: `${focusDraft.desktopX}%`, top: `${focusDraft.desktopY}%` }}
                />
              </div>
              <label className="mt-3 block">
                <span className="mb-1 block text-[11px] tracking-widest text-gold/80">
                  DESKTOP X ({focusDraft.desktopX}%)
                </span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={focusDraft.desktopX}
                  onChange={(event) =>
                    setFocusDraft((prev) => ({
                      ...prev,
                      desktopX: clampPercent(Number(event.target.value)),
                    }))
                  }
                  className="w-full accent-gold"
                />
              </label>
              <label className="mt-3 block">
                <span className="mb-1 block text-[11px] tracking-widest text-gold/80">
                  DESKTOP Y ({focusDraft.desktopY}%)
                </span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={focusDraft.desktopY}
                  onChange={(event) =>
                    setFocusDraft((prev) => ({
                      ...prev,
                      desktopY: clampPercent(Number(event.target.value)),
                    }))
                  }
                  className="w-full accent-gold"
                />
              </label>
            </div>
            <div className="md:justify-self-end">
              <p className="mb-2 inline-flex items-center gap-1 text-[11px] tracking-widest text-gold/75">
                <Smartphone className="h-3.5 w-3.5" />
                PREVIEW MOBILE
              </p>
              <div
                role="button"
                tabIndex={0}
                onClick={(event) => onSetDraftFromPoint(event, "mobile")}
                onKeyDown={previewKeyDown}
                className="relative mx-auto aspect-9/16 w-full max-w-[220px] cursor-crosshair overflow-hidden rounded-xl border border-gold/20 md:mx-0"
              >
                <HeaderMediaFocusMedia
                  url={editingFocusPhoto.imageUrl}
                  isVideo={focusEditorIsVideo}
                  objectPosition={`${focusDraft.mobileX}% ${focusDraft.mobileY}%`}
                  className="object-cover scale-[1.12]"
                />
                <span
                  className="pointer-events-none absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-gold bg-black/50"
                  style={{ left: `${focusDraft.mobileX}%`, top: `${focusDraft.mobileY}%` }}
                />
              </div>
              <label className="mt-3 block">
                <span className="mb-1 block text-[11px] tracking-widest text-gold/80">
                  MOBILE X ({focusDraft.mobileX}%)
                </span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={focusDraft.mobileX}
                  onChange={(event) =>
                    setFocusDraft((prev) => ({
                      ...prev,
                      mobileX: clampPercent(Number(event.target.value)),
                    }))
                  }
                  className="w-full accent-gold"
                />
              </label>
              <label className="mt-3 block">
                <span className="mb-1 block text-[11px] tracking-widest text-gold/80">
                  MOBILE Y ({focusDraft.mobileY}%)
                </span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={focusDraft.mobileY}
                  onChange={(event) =>
                    setFocusDraft((prev) => ({
                      ...prev,
                      mobileY: clampPercent(Number(event.target.value)),
                    }))
                  }
                  className="w-full accent-gold"
                />
              </label>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gold/10 px-4 py-3 md:px-6 md:py-4">
          <p className="text-xs text-foreground/55">
            Tip: use a sharp image with the main subject centered and a little breathing room.
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSavingFocus}
              className="rounded-xl border border-gold/28 px-4 py-2 font-brand text-[10px] tracking-[0.14em] text-foreground/80 transition hover:border-gold/45 hover:text-gold disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onSave}
              disabled={isSavingFocus}
              className="inline-flex items-center gap-2 rounded-xl border border-gold/35 bg-gold/12 px-5 py-2 font-brand text-[10px] tracking-[0.14em] text-gold transition hover:bg-gold/20 disabled:opacity-50"
            >
              {isSavingFocus ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Save focal point
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
