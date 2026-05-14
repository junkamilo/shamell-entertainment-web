"use client";

import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCatalogPriceWithSuffix } from "@/lib/formatCatalogPrice";
import { serviceCatalogMediaTypeFromUrl } from "@/lib/serviceCatalogMedia";

export type CatalogOfferingDetailPrimaryAction = {
  label: string;
  onClick: () => void;
  disabled?: boolean;
};

export type CatalogOfferingDetailModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  items: string[];
  imageUrl?: string | null;
  imageMediaType?: "IMAGE" | "VIDEO";
  price: number | null;
  currencySuffix?: string;
  /** When set, shown next to Close (e.g. add/remove service or choose catalog line). */
  primaryAction?: CatalogOfferingDetailPrimaryAction;
  /** When false, only `primaryAction` is shown in the footer (header X still closes). */
  showCloseButton?: boolean;
};

export default function CatalogOfferingDetailModal({
  isOpen,
  onClose,
  title,
  description,
  items,
  imageUrl,
  imageMediaType,
  price,
  currencySuffix = "USD",
  primaryAction,
  showCloseButton = true,
}: CatalogOfferingDetailModalProps) {
  const [mounted, setMounted] = useState(false);
  const titleId = useId();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [isOpen, onClose]);

  const heroIsVideo =
    imageMediaType === "VIDEO" || (imageUrl ? serviceCatalogMediaTypeFromUrl(imageUrl) === "VIDEO" : false);
  const priceLine = formatCatalogPriceWithSuffix(price, currencySuffix);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          key="catalog-offering-detail-overlay"
          className="fixed inset-0 z-110 flex items-end justify-center bg-shamell-night/88 px-3 py-6 backdrop-blur-sm sm:items-center sm:px-4 sm:py-10"
          role="presentation"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="flex max-h-[min(88dvh,42rem)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-gold/35 bg-[linear-gradient(180deg,rgba(18,10,22,0.98),rgba(6,4,8,0.99))] shadow-[0_28px_90px_rgba(0,0,0,0.65)] sm:max-h-[min(85dvh,44rem)] sm:max-w-xl"
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
              transition: { type: "spring", damping: 28, stiffness: 340, mass: 0.9 },
            }}
            exit={{ opacity: 0, y: 16, scale: 0.98, transition: { duration: 0.18 } }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-gold/20 px-4 py-3 sm:px-5">
              <p id={titleId} className="min-w-0 font-brand text-xs tracking-[0.2em] text-gold uppercase sm:text-sm">
                {title}
              </p>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-lg border border-gold/35 text-gold transition hover:bg-gold/10"
                aria-label="Close details"
              >
                <X className="h-5 w-5" strokeWidth={1.5} />
              </button>
            </div>

            <div className="shamell-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain">
              {imageUrl ? (
                <motion.div
                  className="relative max-h-[38vh] w-full shrink-0 overflow-hidden bg-black/50 sm:max-h-[40vh]"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.05, duration: 0.25 }}
                >
                  {heroIsVideo ? (
                    <video
                      src={imageUrl}
                      className="h-full max-h-[38vh] w-full object-cover sm:max-h-[40vh]"
                      muted
                      playsInline
                      loop
                      autoPlay
                      aria-hidden
                    />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={imageUrl} alt="" className="h-full max-h-[38vh] w-full object-cover sm:max-h-[40vh]" />
                  )}
                  <div
                    className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,transparent_40%,rgba(4,2,6,0.75)_100%)]"
                    aria-hidden
                  />
                </motion.div>
              ) : null}

              <motion.div
                className="space-y-4 px-4 py-5 sm:px-6 sm:py-6"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08, duration: 0.28 }}
              >
                <div>
                  <p className="font-brand text-[10px] tracking-[0.22em] text-gold/75 uppercase">Investment guide</p>
                  <p className="mt-1 font-body text-lg text-foreground sm:text-xl">
                    {priceLine ?? "Investment on request — we will tailor a proposal to your production."}
                  </p>
                </div>

                {description.trim() ? (
                  <div>
                    <p className="font-brand text-[10px] tracking-[0.2em] text-gold/75 uppercase">Overview</p>
                    <p className="mt-2 whitespace-pre-wrap font-body text-base leading-relaxed text-foreground/85 sm:text-lg">
                      {description.trim()}
                    </p>
                  </div>
                ) : null}

                {items.filter(Boolean).length > 0 ? (
                  <div>
                    <p className="font-brand text-[10px] tracking-[0.2em] text-gold/75 uppercase">What is included</p>
                    <ul className="mt-3 space-y-2.5">
                      {items
                        .filter(Boolean)
                        .map((item, i) => (
                          <motion.li
                            key={`${i}-${item.slice(0, 24)}`}
                            className="flex gap-3 font-body text-base leading-relaxed text-foreground/82 sm:text-[1.05rem]"
                            initial={{ opacity: 0, x: -6 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.12 + i * 0.04, duration: 0.22 }}
                          >
                            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold/70" aria-hidden />
                            <span>{item}</span>
                          </motion.li>
                        ))}
                    </ul>
                  </div>
                ) : null}
              </motion.div>
            </div>

            <div
              className={cn(
                "shrink-0 border-t border-gold/20 p-4 sm:px-6",
                primaryAction && showCloseButton && "flex flex-col gap-3 sm:flex-row sm:justify-end",
                primaryAction && !showCloseButton && "flex flex-col",
              )}
            >
              {primaryAction ? (
                <button
                  type="button"
                  disabled={primaryAction.disabled}
                  onClick={primaryAction.onClick}
                  className={cn(
                    "btn-outline-gold justify-center py-3 font-brand text-xs tracking-[0.18em] uppercase",
                    showCloseButton ? "w-full sm:min-w-44 sm:flex-1" : "w-full",
                    primaryAction.disabled && "pointer-events-none opacity-50",
                  )}
                >
                  {primaryAction.label}
                </button>
              ) : null}
              {showCloseButton ? (
                <button
                  type="button"
                  onClick={onClose}
                  className={cn(
                    "w-full justify-center rounded-xl border border-gold/30 bg-black/20 py-3 font-brand text-xs tracking-[0.18em] text-foreground/85 uppercase transition hover:border-gold/50 hover:text-gold sm:py-3",
                    primaryAction ? "sm:min-w-36 sm:flex-initial" : "btn-outline-gold",
                  )}
                >
                  Close
                </button>
              ) : null}
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
