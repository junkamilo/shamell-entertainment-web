"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { MODAL_LAYERS } from "../../overlays/Modal/modalLayers";
import { cn } from "@/lib/utils";

export type MediaPreviewModalProps = {
  isOpen: boolean;
  onClose: () => void;
  src: string;
  title?: string;
  mediaType?: "IMAGE" | "VIDEO";
  alt?: string;
};

/**
 * Full-screen admin preview for remote media (e.g. Cloudinary URLs).
 * Renders inside Shamell — does not open a new browser tab.
 */
export function MediaPreviewModal({
  isOpen,
  onClose,
  src,
  title = "Preview",
  mediaType = "IMAGE",
  alt = "",
}: MediaPreviewModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && src ? (
        <motion.div
          key="admin-media-preview"
          className={cn(
            "admin-theme fixed inset-0 flex items-center justify-center bg-shamell-night/88 px-4 py-6 backdrop-blur-sm",
            MODAL_LAYERS.mediaPreview,
          )}
          role="presentation"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-media-preview-title"
            className="relative flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-gold/20 bg-shamell-surface-raised shadow-2xl"
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 8 }}
            transition={{ type: "spring", damping: 28, stiffness: 340 }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex shrink-0 items-center justify-between border-b border-gold/15 px-4 py-3 sm:px-5">
              <h2
                id="admin-media-preview-title"
                className="font-brand text-sm tracking-[0.12em] text-gold sm:text-base"
              >
                {title}
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-gold/25 text-foreground/80 transition hover:bg-gold/10 hover:text-gold"
                aria-label="Close preview"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex min-h-0 flex-1 items-center justify-center bg-black/40 p-3 sm:p-5">
              {mediaType === "VIDEO" ? (
                <video
                  key={src}
                  src={src}
                  controls
                  playsInline
                  autoPlay
                  className="max-h-[min(78vh,720px)] w-full max-w-full rounded-lg object-contain"
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element -- external Cloudinary URLs, arbitrary aspect ratios
                <img
                  src={src}
                  alt={alt || title}
                  className="max-h-[min(78vh,720px)] max-w-full rounded-lg object-contain"
                />
              )}
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
