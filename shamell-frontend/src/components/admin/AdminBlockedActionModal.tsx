"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { ADMIN_MODAL_OVERLAY_Z_CLASS } from "@/components/admin/adminModalLayers";

export type AdminBlockedActionModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
};

/**
 * Warning dialog when an admin action is blocked (e.g. deactivate while links exist).
 * Copy should be English. Reuse across catalog / types admin modules.
 */
export default function AdminBlockedActionModal({
  isOpen,
  onClose,
  title,
  description,
}: AdminBlockedActionModalProps) {
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
      {isOpen ? (
        <motion.div
          key="admin-blocked-action-modal"
          className={`admin-theme fixed inset-0 flex items-center justify-center bg-shamell-night/82 px-4 py-6 backdrop-blur-sm ${ADMIN_MODAL_OVERLAY_Z_CLASS}`}
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
            aria-labelledby="admin-blocked-action-title"
            aria-describedby="admin-blocked-action-description"
            className="w-full max-w-md overflow-hidden rounded-2xl border border-amber-400/35 bg-shamell-surface-raised shadow-2xl"
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 6 }}
            transition={{ type: "spring", damping: 28, stiffness: 340 }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 border-b border-gold/15 px-5 py-4">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-amber-400/40 bg-amber-500/15 text-amber-200">
                  <AlertTriangle className="h-5 w-5" strokeWidth={1.5} aria-hidden />
                </span>
                <h2
                  id="admin-blocked-action-title"
                  className="font-brand text-lg tracking-[0.06em] text-gold"
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
              id="admin-blocked-action-description"
              className="px-5 py-4 font-body text-sm leading-relaxed text-foreground/80"
            >
              {description}
            </p>

            <div className="flex justify-end border-t border-gold/12 px-5 py-4">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-gold/35 bg-gold/15 px-5 py-2 font-brand text-xs tracking-[0.14em] text-gold transition hover:bg-gold/25"
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
