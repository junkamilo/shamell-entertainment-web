import { type FormEvent } from "react";
import { BadgeCheck, KeyRound, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AgregarAdminCardLayout, AgregarAdminPhase } from "../types/agregarAdmin.types";

type Props = {
  phase: AgregarAdminPhase;
  layout: AgregarAdminCardLayout;
  emailDisplay: string;
  code: string;
  password: string;
  isSending: boolean;
  isVerifying: boolean;
  onCodeChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onResendCode: () => void;
  className?: string;
};

export default function AgregarAdminVerifyCard({
  phase,
  layout,
  emailDisplay,
  code,
  password,
  isSending,
  isVerifying,
  onCodeChange,
  onPasswordChange,
  onSubmit,
  onResendCode,
  className,
}: Props) {
  const isMobile = layout === "mobile";

  return (
    <div
      className={cn(
        "relative flex h-full min-h-0 flex-col rounded-2xl border p-5 md:p-6",
        phase === 2
          ? "shamell-glass-surface border-gold/30 ring-1 ring-gold/15"
          : "shamell-glass-surface border-gold/10 border-dashed opacity-[0.92]",
        className,
      )}
    >
      <div className="mb-4 flex items-center gap-3 border-b border-gold/10 pb-4">
        <span
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border font-brand text-xs",
            phase === 2
              ? "border-gold/40 bg-gold/15 text-gold"
              : "border-gold/15 bg-gold/8 text-foreground/40",
          )}
        >
          2
        </span>
        <div>
          <p className="font-brand text-[10px] tracking-[0.2em] text-gold/65">VERIFICATION</p>
          <p className="font-brand text-sm tracking-[0.12em] text-gold">Code and password</p>
        </div>
      </div>

      {phase === 1 ? (
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 px-2 py-6 text-center md:py-10">
          <KeyRound className="h-10 w-10 text-gold/25" strokeWidth={1.2} />
          <p className="max-w-xs font-body text-sm leading-relaxed text-foreground/50">
            After you tap <span className="text-gold/85">Send invitation</span>, you can enter the 6-digit
            code and the new administrator&apos;s password here.
          </p>
        </div>
      ) : (
        <>
          <div className="mb-5 flex gap-3 rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 shadow-[inset_0_1px_0_rgba(52,211,153,0.08)]">
            <BadgeCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300/95" strokeWidth={1.75} />
            <div className="min-w-0 text-left">
              <p className="font-brand text-[10px] tracking-[0.14em] text-emerald-200/95">Valid code format</p>
              <p className="mt-1 font-body text-xs leading-relaxed text-foreground/75">
                We only accept the <strong className="text-gold/90">6-digit numeric code</strong> from the{" "}
                <strong className="text-gold/90">latest email</strong> the system sent to{" "}
                <span className="font-mono text-[11px] text-gold/85">{emailDisplay}</span>. If you send a new
                code, always use the newest one. The server checks it against the code generated when it was
                sent.
              </p>
            </div>
          </div>

          <form onSubmit={onSubmit} className="flex flex-1 flex-col space-y-5">
            <label className="block">
              <span className="flex items-center gap-2 font-brand text-[11px] tracking-[0.2em] text-gold/95">
                <KeyRound className="h-3.5 w-3.5 text-gold/70" strokeWidth={1.5} />
                VERIFICATION CODE
              </span>
              <input
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={code}
                onChange={(e) => onCodeChange(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="• • • • • •"
                className={cn(
                  "mt-2 h-14 rounded-xl border border-gold/35 px-4 text-center font-mono text-2xl tracking-[0.45em] text-gold placeholder:text-gold/20 placeholder:tracking-[0.2em] focus:border-gold/60 focus:outline-none focus:ring-2 focus:ring-gold/25",
                  isMobile ? "w-full" : "w-full max-w-xs",
                )}
                required
              />
              <p className="mt-1.5 font-body text-[11px] text-foreground/45">
                {code.length}/6 digits — must match the email you received.
              </p>
            </label>

            <label className="block">
              <span className="flex items-center gap-2 font-brand text-[11px] tracking-[0.2em] text-gold/95">
                <Lock className="h-3.5 w-3.5 text-gold/70" strokeWidth={1.5} />
                NEW ADMIN PASSWORD
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => onPasswordChange(e.target.value)}
                autoComplete="new-password"
                placeholder="At least 8 characters"
                minLength={8}
                className="mt-2 h-12 w-full rounded-xl border border-gold/30 px-4 text-sm text-foreground outline-none transition placeholder:text-foreground/35 focus:border-gold/55 focus:ring-2 focus:ring-gold/20"
                required
              />
            </label>

            <div className="mt-auto flex flex-wrap gap-3 border-t border-gold/10 pt-5">
              <button
                type="submit"
                disabled={isVerifying}
                className={cn(
                  "items-center justify-center rounded-xl border border-gold/45 bg-gold/18 font-brand text-sm tracking-[0.08em] text-gold transition hover:border-gold/60 hover:bg-gold/28",
                  "disabled:cursor-not-allowed disabled:opacity-50",
                  isMobile
                    ? "flex h-12 w-full px-4 sm:inline-flex sm:w-auto sm:px-8"
                    : "inline-flex min-h-11 px-8",
                )}
              >
                {isVerifying ? "Creating…" : "Add administrator"}
              </button>
              <button
                type="button"
                onClick={onResendCode}
                disabled={isSending}
                className={cn(
                  "shamell-glass-surface inline-flex items-center justify-center rounded-xl border border-gold/22 px-5 font-brand text-[10px] tracking-[0.12em] text-foreground/75 transition hover:border-gold/40 hover:text-gold disabled:opacity-50",
                  isMobile ? "min-h-11 w-full sm:w-auto" : "min-h-11",
                )}
              >
                Send new code
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  );
}
