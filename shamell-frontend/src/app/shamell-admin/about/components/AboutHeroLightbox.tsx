"use client";

import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";
import type { LightboxDisplay } from "../types/aboutAdmin.types";

type AboutHeroLightboxProps = {
  portalReady: boolean;
  isOpen: boolean;
  display: LightboxDisplay | null;
  onClose: () => void;
  onExitComplete: () => void;
};

export function AboutHeroLightbox({
  portalReady,
  isOpen,
  display,
  onClose,
  onExitComplete,
}: AboutHeroLightboxProps) {
  if (!portalReady) return null;

  return createPortal(
    <AnimatePresence onExitComplete={onExitComplete}>
      {isOpen && display ? (
        <motion.div
          key={`${display.src}-${display.isVideo ? "v" : "i"}`}
          className="admin-theme fixed inset-0 z-190 flex items-center justify-center bg-black/88 px-4 py-8 backdrop-blur-sm"
          role="presentation"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
          onClick={onClose}
        >
          <motion.div
            className="relative w-full max-w-5xl rounded-2xl border border-gold/30 bg-[#0a0d12] p-3 shadow-2xl ring-1 ring-gold/10"
            initial={{ opacity: 0, scale: 0.9, y: 28 }}
            animate={{
              opacity: 1,
              scale: 1,
              y: 0,
              transition: { type: "spring", damping: 26, stiffness: 320, mass: 0.88 },
            }}
            exit={{
              opacity: 0,
              scale: 0.96,
              y: 14,
              transition: { duration: 0.2, ease: [0.4, 0, 1, 1] },
            }}
            onClick={(event) => event.stopPropagation()}
          >
            <motion.button
              type="button"
              onClick={onClose}
              className="shamell-glass-surface absolute right-3 top-3 z-10 rounded-full border border-gold/30 p-2 text-gold transition hover:bg-gold/10"
              aria-label="Close preview"
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{
                opacity: 1,
                scale: 1,
                transition: { delay: 0.08, type: "spring", stiffness: 400, damping: 22 },
              }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <X className="h-5 w-5" />
            </motion.button>
            <motion.div
              className="pt-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{
                opacity: 1,
                y: 0,
                transition: { delay: 0.06, duration: 0.26, ease: [0.22, 1, 0.36, 1] },
              }}
              exit={{ opacity: 0, transition: { duration: 0.12 } }}
            >
              {display.isVideo ? (
                <video
                  src={display.src}
                  className="max-h-[82vh] w-full rounded-xl object-contain"
                  controls
                  playsInline
                  preload="metadata"
                  aria-label="Expanded About view"
                />
              ) : (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={display.src}
                  alt="Expanded About view"
                  className="max-h-[82vh] w-full rounded-xl object-contain"
                />
              )}
            </motion.div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
