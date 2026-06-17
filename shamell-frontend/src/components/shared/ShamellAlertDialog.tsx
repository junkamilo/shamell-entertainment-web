"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";

export type ShamellAlertDialogProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  description: string;
};

export default function ShamellAlertDialog({
  open,
  onClose,
  title,
  description,
}: ShamellAlertDialogProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open ? (
        <motion.div
          key="shamell-alert-dialog"
          className="fixed inset-0 z-[120] flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-4"
          role="presentation"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
        >
          <motion.div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="shamell-alert-title"
            aria-describedby="shamell-alert-description"
            className="w-full max-w-md overflow-hidden rounded-t-2xl border border-gold/25 bg-[linear-gradient(180deg,#1a1018,#0f0a12)] shadow-2xl sm:rounded-2xl"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ type: "spring", damping: 28, stiffness: 340 }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 border-b border-gold/15 px-4 py-4 sm:px-5">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-amber-400/40 bg-amber-500/15 text-amber-200">
                  <AlertTriangle className="h-5 w-5" strokeWidth={1.5} aria-hidden />
                </span>
                <h2
                  id="shamell-alert-title"
                  className="font-display text-lg text-gold sm:text-xl"
                >
                  {title}
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gold/25 text-foreground/80 transition hover:bg-gold/10 hover:text-gold"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p
              id="shamell-alert-description"
              className="px-4 py-4 text-sm leading-relaxed text-foreground/80 sm:px-5"
            >
              {description}
            </p>

            <div className="flex justify-end border-t border-gold/12 px-4 py-4 sm:px-5">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg bg-gold px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-black transition hover:bg-gold-light"
              >
                OK
              </button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
