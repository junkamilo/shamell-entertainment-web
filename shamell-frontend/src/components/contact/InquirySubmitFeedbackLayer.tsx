"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import bailarinaLogo from "@/public/01_bailarina.png";

export type InquirySubmitFeedbackPhase = "idle" | "sending" | "done";

const REDIRECT_MS = 10_000;

type Props = {
  phase: InquirySubmitFeedbackPhase;
  /** Clears auto-redirect timer, then parent should reset state and navigate home. */
  onAccept: () => void;
};

export default function InquirySubmitFeedbackLayer({ phase, onAccept }: Props) {
  const [mounted, setMounted] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (phase !== "done") {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      return;
    }
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      onAccept();
    }, REDIRECT_MS);
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [phase, onAccept]);

  useEffect(() => {
    if (phase === "idle") return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [phase]);

  const handleAccept = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    onAccept();
  };

  if (!mounted || phase === "idle") return null;

  return createPortal(
    <AnimatePresence>
      <motion.div
        key="inquiry-submit-feedback-root"
        className="fixed inset-0 z-100 flex items-center justify-center bg-shamell-night/85 px-4 py-10 backdrop-blur-sm"
        role="presentation"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        aria-live="polite"
      >
        <AnimatePresence mode="wait">
          {phase === "sending" ? (
            <motion.div
              key="sending"
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
              <p className="mt-8 font-brand text-xs tracking-[0.22em] text-gold/90 uppercase">
                Sending your request
              </p>
              <p className="mt-2 max-w-sm font-body text-sm leading-relaxed text-foreground/70">
                Please wait while we deliver your inquiry to Shamell&apos;s team.
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="done"
              role="dialog"
              aria-modal="true"
              aria-labelledby="inquiry-submit-feedback-title"
              className="w-full max-w-md rounded-2xl border border-gold/35 bg-[rgba(12,6,18,0.96)] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.55)] sm:p-8"
              initial={{ opacity: 0, scale: 0.94, y: 16 }}
              animate={{
                opacity: 1,
                scale: 1,
                y: 0,
                transition: { type: "spring", damping: 28, stiffness: 340, mass: 0.88 },
              }}
              exit={{ opacity: 0, scale: 0.97, y: 10, transition: { duration: 0.2 } }}
            >
              <h2
                id="inquiry-submit-feedback-title"
                className="text-center font-brand text-xl tracking-[0.14em] text-gold uppercase sm:text-2xl"
              >
                Request received
              </h2>
              <p className="mt-4 text-center font-body text-sm leading-relaxed text-foreground/75 sm:text-base">
                Your message is on its way. Shamell&apos;s team will get back to you as soon as possible.
              </p>
              <p className="mt-2 text-center font-body text-xs text-foreground/50">
                You will be taken to the home page in a few seconds, or tap Accept to continue now.
              </p>
              <button
                type="button"
                onClick={handleAccept}
                className="btn-outline-gold mt-8 w-full justify-center py-3 font-brand text-xs tracking-[0.18em] uppercase"
              >
                Accept
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>,
    document.body,
  );
}
