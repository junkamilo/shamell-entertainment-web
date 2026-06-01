"use client";

import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";

type AdminModalProps = {
  title: string;
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  /** `narrow` for short confirmations (delete, etc.). */
  size?: "default" | "narrow";
};

export default function AdminModal({
  title,
  isOpen,
  onClose,
  children,
  size = "default",
}: AdminModalProps) {
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

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          key="admin-modal-root"
          className="admin-theme fixed inset-0 z-200 flex items-center justify-center bg-shamell-night/80 px-4 py-6 backdrop-blur-sm"
          role="presentation"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-modal-title"
            className={
              size === "narrow"
                ? "flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-3xl border border-shamell-line-soft bg-shamell-surface-raised shadow-2xl"
                : "flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-shamell-line-soft bg-shamell-surface-raised shadow-2xl"
            }
            initial={{ opacity: 0, scale: 0.94, y: 18 }}
            animate={{
              opacity: 1,
              scale: 1,
              y: 0,
              transition: { type: "spring", damping: 28, stiffness: 340, mass: 0.85 },
            }}
            exit={{
              opacity: 0,
              scale: 0.97,
              y: 10,
              transition: { duration: 0.2, ease: [0.4, 0, 1, 1] },
            }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex shrink-0 items-center justify-between border-b border-gold/15 bg-shamell-surface-deep px-6 py-5">
              <h2
                id="admin-modal-title"
                className={
                  size === "narrow"
                    ? "admin-text-brand font-brand text-2xl leading-tight tracking-[0.08em] sm:text-3xl"
                    : "admin-text-brand font-brand text-[1.75rem] leading-tight tracking-[0.08em] sm:text-3xl md:text-4xl"
                }
              >
                {title}
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-gold/25 text-foreground/80 transition hover:bg-gold/10 hover:text-gold"
                aria-label="Close dialog"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <motion.div
              className="admin-modal-scroll min-h-0 flex-1 overflow-y-auto bg-shamell-surface-raised p-6 md:p-8 shamell-scrollbar [&_input:where([type=text],[type=email],[type=search],[type=password],[type=number],[type=tel],[type=url])]:bg-shamell-surface-deep [&_textarea]:bg-shamell-surface-deep"
              initial={{ opacity: 0, y: 8 }}
              animate={{
                opacity: 1,
                y: 0,
                transition: { delay: 0.05, duration: 0.22, ease: [0.22, 1, 0.36, 1] },
              }}
              exit={{ opacity: 0, transition: { duration: 0.12 } }}
            >
              {children}
            </motion.div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
