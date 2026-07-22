"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export type OccasionOption = { id: string; name: string };

type Props = {
  isOpen: boolean;
  title: string;
  options: OccasionOption[];
  selectedId: string;
  onClose: () => void;
  onSelect: (id: string) => void;
  overlayZClass?: string;
};

export default function ContactOccasionPickerModal({
  isOpen,
  title,
  options,
  selectedId,
  onClose,
  onSelect,
  overlayZClass = "z-[100]",
}: Props) {
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
          key="contact-occasion-picker-overlay"
          className={cn(
            "fixed inset-0 flex items-center justify-center bg-shamell-night/80 px-4 py-8 backdrop-blur-sm",
            overlayZClass,
          )}
          role="presentation"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="contact-occasion-picker-title"
            className="relative flex max-h-[min(85vh,520px)] w-full max-w-md flex-col overflow-hidden rounded-3xl border border-shamell-line-soft bg-shamell-surface-raised shadow-2xl"
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
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={onClose}
              className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-gold/25 text-foreground/80 transition hover:bg-gold/10 hover:text-gold"
              aria-label="Close"
            >
              <X className="h-5 w-5" aria-hidden />
            </button>

            <div className="border-b border-gold/15 bg-shamell-surface-deep px-5 py-5 pr-16">
              <p
                id="contact-occasion-picker-title"
                className="font-brand text-sm tracking-[0.18em] text-gold/95 sm:text-base md:tracking-[0.2em]"
              >
                {title}
              </p>
              <p className="mt-2 font-body text-sm leading-relaxed text-foreground/65 sm:text-base">
                Choose the option that best describes your celebration.
              </p>
            </div>

            <div
              className="min-h-0 flex-1 overflow-y-auto px-3 py-4 sm:px-4"
              role="listbox"
              aria-labelledby="contact-occasion-picker-title"
            >
              <ul className="flex flex-col gap-2">
                {options.map((o) => {
                  const selected = o.id === selectedId;
                  return (
                    <li key={o.id}>
                      <button
                        type="button"
                        role="option"
                        aria-selected={selected}
                        onClick={() => {
                          onSelect(o.id);
                          onClose();
                        }}
                        className={cn(
                          "w-full rounded-xl border px-4 py-3.5 text-left font-body text-base font-medium leading-snug transition sm:text-lg",
                          selected
                            ? "border-gold bg-gold/15 text-gold-light shadow-[inset_0_0_0_1px_rgba(197,165,90,0.25)]"
                            : "border-gold/25 bg-black/25 text-foreground hover:border-gold/45 hover:bg-gold/8",
                        )}
                      >
                        {o.name}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2 border-t border-gold/15 bg-shamell-surface-deep px-5 py-4">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-gold/30 px-4 py-3 font-brand text-xs tracking-[0.14em] text-foreground/75 uppercase transition hover:border-gold/50 hover:text-gold sm:text-sm"
                aria-label="Dismiss without changing selection"
              >
                Choose
              </button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
