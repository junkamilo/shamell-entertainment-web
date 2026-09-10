"use client";

import { type FormEvent, useEffect, useId, useState } from "react";
import { Mail, X } from "lucide-react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";

export type EmailVerificationModalProps = {
  open: boolean;
  email: string;
  onVerify: (code: string) => void;
  onResend: () => void;
  onClose: () => void;
  isVerifying?: boolean;
  isResending?: boolean;
  error?: string | null;
  resendCooldownSec?: number;
};

export function EmailVerificationModal({
  open,
  email,
  onVerify,
  onResend,
  onClose,
  isVerifying = false,
  isResending = false,
  error = null,
  resendCooldownSec = 0,
}: EmailVerificationModalProps) {
  const [mounted, setMounted] = useState(false);
  const [code, setCode] = useState("");
  const titleId = useId();
  const descId = useId();
  const inputId = useId();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) {
      setCode("");
      return;
    }
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

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = code.replace(/\D/g, "").slice(0, 6);
    if (trimmed.length !== 6 || isVerifying) return;
    onVerify(trimmed);
  };

  const resendDisabled = isResending || isVerifying || resendCooldownSec > 0;

  return createPortal(
    <AnimatePresence>
      {open ? (
        <motion.div
          key="email-verification-modal"
          className="fixed inset-0 z-[120] flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-4"
          role="presentation"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={descId}
            className="w-full max-w-md overflow-hidden rounded-t-2xl border border-gold/25 bg-[linear-gradient(180deg,#1a1018,#0f0a12)] pb-[max(1rem,env(safe-area-inset-bottom))] shadow-2xl sm:rounded-2xl sm:pb-0"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ type: "spring", damping: 28, stiffness: 340 }}
          >
            <div className="flex items-start justify-between gap-3 border-b border-gold/15 px-4 py-4 sm:px-5">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gold/40 bg-gold/15 text-gold">
                  <Mail className="h-5 w-5" strokeWidth={1.5} aria-hidden />
                </span>
                <h2 id={titleId} className="font-display text-lg text-gold sm:text-xl">
                  Verify your email
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-gold/25 text-foreground/80 transition hover:bg-gold/10 hover:text-gold"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-4 py-4 sm:px-5">
              <p id={descId} className="font-body text-sm leading-relaxed text-foreground/80">
                Enter the code we just sent to {email}.
              </p>
              <p className="mt-1 font-body text-xs text-foreground/48">It expires in 10 minutes.</p>

              <label className="mt-4 block" htmlFor={inputId}>
                <span className="font-brand text-[10px] tracking-[0.14em] text-gold/80 uppercase">
                  Verification code
                </span>
                <input
                  id={inputId}
                  name="verificationCode"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={code}
                  onChange={(event) =>
                    setCode(event.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  className="mt-2 min-h-12 w-full border border-gold/40 bg-black/30 px-4 py-3 text-center font-brand text-[16px] tracking-[0.35em] text-gold outline-none transition-colors focus:border-gold sm:text-xl"
                  aria-invalid={error ? true : undefined}
                />
              </label>

              {error ? (
                <p className="mt-3 text-sm text-red-300" role="alert">
                  {error}
                </p>
              ) : null}

              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="button"
                  onClick={onResend}
                  disabled={resendDisabled}
                  className="min-h-11 text-left font-body text-xs text-foreground/60 underline decoration-foreground/25 underline-offset-2 transition hover:text-gold disabled:cursor-not-allowed disabled:no-underline disabled:opacity-50"
                >
                  {resendCooldownSec > 0
                    ? `Resend code in ${resendCooldownSec}s`
                    : isResending
                      ? "Sending…"
                      : "Resend code"}
                </button>
                <button
                  type="submit"
                  disabled={isVerifying || code.length !== 6}
                  className="inline-flex min-h-12 min-w-32 items-center justify-center rounded-lg bg-gold px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-black transition hover:bg-gold-light disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isVerifying ? "Verifying…" : "Verify"}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
