"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import ShamellBusyOverlay from "@/components/shared/ShamellBusyOverlay";

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

  return (
    <>
      <ShamellBusyOverlay
        active={phase === "sending"}
        title="Sending your request"
        description="Please wait while we deliver your inquiry to Shamell's team."
      />
      {phase === "done"
        ? createPortal(
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
                <motion.div
                  key="done"
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="inquiry-submit-feedback-title"
                  className="w-full max-w-lg rounded-2xl border border-gold/35 bg-[rgba(12,6,18,0.96)] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.55)] sm:p-8 md:p-10"
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
                    className="text-center font-brand text-2xl tracking-[0.14em] text-gold uppercase sm:text-3xl sm:tracking-[0.16em]"
                  >
                    Request received
                  </h2>
                  <p className="mt-5 text-center font-body text-lg leading-relaxed text-foreground/82 sm:text-xl sm:leading-relaxed">
                    Your message is on its way. Shamell&apos;s team will get back to you as soon as
                    possible.
                  </p>
                  <p className="mt-3 text-center font-body text-base leading-relaxed text-foreground/58 sm:text-lg">
                    You will be taken to the home page in a few seconds, or tap Accept to continue
                    now.
                  </p>
                  <button
                    type="button"
                    onClick={handleAccept}
                    className="btn-outline-gold mt-8 w-full justify-center py-3.5 font-brand text-sm tracking-[0.18em] uppercase sm:mt-10 sm:py-4 sm:text-base sm:tracking-[0.2em]"
                  >
                    Accept
                  </button>
                </motion.div>
              </motion.div>
            </AnimatePresence>,
            document.body,
          )
        : null}
    </>
  );
}
