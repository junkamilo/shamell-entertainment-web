"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import bailarinaLogo from "@/public/01_bailarina.png";
import { cn } from "@/lib/utils";

export type ShamellBusyOverlayProps = {
  active: boolean;
  title: string;
  description?: string;
  /** Defaults to `z-100` (public forms). Use `ADMIN_BUSY_OVERLAY_Z_CLASS` above admin modals. */
  overlayZClass?: string;
};

export default function ShamellBusyOverlay({
  active,
  title,
  description,
  overlayZClass = "z-100",
}: ShamellBusyOverlayProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!active) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [active]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {active ? (
        <motion.div
          key="shamell-busy-overlay"
          className={cn(
            "fixed inset-0 flex items-center justify-center bg-shamell-night/85 px-4 py-10 backdrop-blur-sm",
            overlayZClass,
          )}
          role="presentation"
          aria-live="polite"
          aria-busy="true"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.div
            className="flex max-w-md flex-col items-center text-center"
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.18 } }}
            transition={{ type: "spring", damping: 26, stiffness: 320 }}
          >
            <div className="relative mx-auto flex h-36 w-36 items-center justify-center sm:h-40 sm:w-40">
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-gold/20"
                aria-hidden
              />
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-transparent border-t-gold/80 border-r-gold/40"
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1.1, ease: "linear" }}
                aria-hidden
              />
              <motion.div
                className="relative flex h-24 w-24 items-center justify-center sm:h-28 sm:w-28"
                animate={{ scale: [1, 1.04, 1] }}
                transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
              >
                <Image
                  src={bailarinaLogo}
                  alt=""
                  width={180}
                  height={164}
                  className="h-full w-auto max-w-22 object-contain drop-shadow-[0_8px_28px_rgba(197,165,90,0.35)]"
                  priority
                  aria-hidden
                />
              </motion.div>
            </div>
            <p className="mt-8 font-brand text-sm tracking-[0.2em] text-gold/90 uppercase sm:text-base sm:tracking-[0.22em]">
              {title}
            </p>
            {description ? (
              <p className="mt-3 max-w-sm font-body text-base leading-relaxed text-foreground/75 sm:text-lg sm:leading-relaxed">
                {description}
              </p>
            ) : null}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
