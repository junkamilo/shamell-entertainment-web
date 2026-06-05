"use client";

import Image from "next/image";
import Link from "next/link";
import { CheckCircle2, Home, Loader2, Mail, XCircle } from "lucide-react";
import { motion } from "motion/react";
import bailarinaLogo from "@/public/01_bailarina.png";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";

export type ConfirmationStatus = "loading" | "paid" | "pending" | "error";

export type SessionTicket = {
  sessionLabel: string;
  confirmationReference?: string;
};

export type ClassPaymentConfirmationPanelProps = {
  status: ConfirmationStatus;
  paidTitle: string;
  paidSubtitle: string;
  sessionRows?: SessionTicket[];
  onRefresh?: () => void;
  paidEyebrow?: string;
  paidExtra?: React.ReactNode;
  loadingMessage?: string;
  pendingMessage?: string;
  errorMessage?: string;
};

const panelShellClass =
  "relative w-full rounded-2xl border border-gold/35 shadow-[0_28px_90px_rgba(0,0,0,0.55)] bg-[linear-gradient(180deg,rgba(18,10,22,0.98),rgba(6,4,8,0.99))]";

function ShamellLogo({ pulse }: { pulse?: boolean }) {
  return (
    <div
      className={cn(
        "mx-auto flex h-20 w-20 items-center justify-center sm:h-24 sm:w-24 md:h-28 md:w-28",
        pulse && "animate-pulse",
      )}
    >
      <Image
        src={bailarinaLogo}
        alt="Shamell bailarina"
        width={180}
        height={164}
        priority
        className="h-full w-auto object-contain drop-shadow-[0_0_18px_rgba(197,165,90,0.18)]"
      />
    </div>
  );
}

function ConfirmationPageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative mx-auto w-full max-w-6xl px-4 pb-20 pt-28 sm:px-6 lg:px-8">
      <div
        className="pointer-events-none absolute inset-x-4 top-24 h-72 rounded-full bg-gold/10 blur-3xl sm:inset-x-8 lg:h-96"
        aria-hidden
      />
      <div
        className={cn(
          panelShellClass,
          "relative px-6 py-8 text-center sm:px-8 sm:py-10 lg:px-10 lg:py-12 xl:px-14",
        )}
      >
        {children}
      </div>
    </div>
  );
}

function HomeButton() {
  return (
    <Link
      href="/"
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg border border-gold/35 px-5 py-2.5",
        "font-brand text-xs tracking-[0.14em] text-gold uppercase transition-colors hover:bg-gold/10",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-light",
      )}
    >
      <Home className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
      Home
    </Link>
  );
}

function SessionTicketsList({ sessionRows }: { sessionRows: SessionTicket[] }) {
  const multiColumn = sessionRows.length > 1;
  return (
    <ul
      className={cn(
        "mx-auto w-full max-w-2xl space-y-2.5 text-center",
        multiColumn && "sm:grid sm:grid-cols-2 sm:gap-3 sm:space-y-0 lg:max-w-4xl",
      )}
    >
      {sessionRows.map((row) => (
        <li
          key={`${row.sessionLabel}-${row.confirmationReference ?? ""}`}
          className="rounded-xl border border-gold/22 bg-black/20 px-4 py-3 sm:px-5 sm:py-4"
        >
          <p className="text-sm text-foreground/85 sm:text-base">{row.sessionLabel}</p>
          {row.confirmationReference ? (
            <p className="mt-1.5 font-brand text-[11px] tracking-[0.12em] text-gold tabular-nums uppercase sm:text-xs">
              Confirmation #{row.confirmationReference}
            </p>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

function PaidTitleRow({ title }: { title: string }) {
  return (
    <div className="mt-4 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
      <h1 className="font-display text-2xl text-gold sm:text-3xl lg:text-4xl">{title}</h1>
      <span
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-gold/30 bg-gold/10 sm:h-12 sm:w-12"
        aria-hidden
      >
        <CheckCircle2 className="h-6 w-6 text-gold sm:h-7 sm:w-7" strokeWidth={1.75} />
      </span>
    </div>
  );
}

function PaidContent({
  title,
  subtitle,
  eyebrow,
  sessionRows,
  paidExtra,
  animate,
}: {
  title: string;
  subtitle: string;
  eyebrow: string;
  sessionRows?: SessionTicket[];
  paidExtra?: React.ReactNode;
  animate: boolean;
}) {
  const hasTickets = sessionRows && sessionRows.length > 0;

  const body = (
    <div className="mx-auto flex w-full max-w-3xl flex-col items-center lg:max-w-4xl">
      <ShamellLogo />
      <p className="mt-5 font-brand text-xs tracking-[0.28em] text-gold/80 uppercase">{eyebrow}</p>
      <PaidTitleRow title={title} />
      <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-foreground/80 sm:text-base">
        {subtitle}
      </p>
      {paidExtra ? <div className="mt-4">{paidExtra}</div> : null}
      <div className="mx-auto mt-5 flex w-full max-w-xl items-start gap-3 rounded-xl border border-gold/20 bg-black/25 px-4 py-3 text-left sm:max-w-2xl">
        <Mail className="mt-0.5 h-4 w-4 shrink-0 text-gold/80" aria-hidden />
        <p className="text-xs leading-relaxed text-foreground/75 sm:text-sm">
          Check your inbox for your confirmation email. Present it at check-in.
        </p>
      </div>

      {hasTickets ? (
        <div className="mt-8 w-full">
          <p className="mb-4 font-brand text-[10px] tracking-[0.22em] text-gold/70 uppercase">
            Your reservations
          </p>
          <SessionTicketsList sessionRows={sessionRows} />
        </div>
      ) : null}

      <div className="mt-8 flex justify-center">
        <HomeButton />
      </div>
    </div>
  );

  if (!animate) {
    return body;
  }

  return (
    <motion.div
      className="w-full"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
    >
      {body}
    </motion.div>
  );
}

function CenteredState({
  children,
  showHome,
}: {
  children: React.ReactNode;
  showHome: boolean;
}) {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col items-center text-center">
      {children}
      {showHome ? (
        <div className="mt-8 flex justify-center">
          <HomeButton />
        </div>
      ) : null}
    </div>
  );
}

export function ClassPaymentConfirmationPanel({
  status,
  paidTitle,
  paidSubtitle,
  sessionRows,
  onRefresh,
  paidEyebrow = "You're on the list",
  paidExtra,
  loadingMessage = "Confirming your booking…",
  pendingMessage = "Payment is still processing. This page will update automatically.",
  errorMessage = "We could not confirm payment. Contact us if you were charged.",
}: ClassPaymentConfirmationPanelProps) {
  const prefersReducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const animatePaid = status === "paid" && !prefersReducedMotion;

  return (
    <ConfirmationPageShell>
      {status === "loading" ? (
        <CenteredState showHome={false}>
          <ShamellLogo pulse />
          <div className="mt-6 flex items-center justify-center gap-2 text-sm text-foreground/75">
            <Loader2 className="h-4 w-4 animate-spin text-gold/80" aria-hidden />
            <span>{loadingMessage}</span>
          </div>
        </CenteredState>
      ) : null}

      {status === "paid" ? (
        <PaidContent
          title={paidTitle}
          subtitle={paidSubtitle}
          eyebrow={paidEyebrow}
          sessionRows={sessionRows}
          paidExtra={paidExtra}
          animate={animatePaid}
        />
      ) : null}

      {status === "pending" ? (
        <CenteredState showHome>
          <ShamellLogo />
          <h2 className="mt-5 font-display text-xl text-gold sm:text-2xl">Almost there</h2>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-foreground/80 sm:text-base">
            {pendingMessage}
          </p>
          {onRefresh ? (
            <button
              type="button"
              onClick={onRefresh}
              className="mt-5 rounded-xl border border-gold/30 px-4 py-2 font-brand text-xs tracking-[0.12em] text-gold uppercase transition hover:border-gold/50 hover:bg-gold/10"
            >
              Refresh now
            </button>
          ) : null}
        </CenteredState>
      ) : null}

      {status === "error" ? (
        <CenteredState showHome>
          <ShamellLogo />
          <div className="mx-auto mt-5 flex h-12 w-12 items-center justify-center rounded-full border border-red-400/30 bg-red-950/30">
            <XCircle className="h-7 w-7 text-red-300" strokeWidth={1.75} aria-hidden />
          </div>
          <h2 className="mt-4 font-display text-xl text-red-300 sm:text-2xl">Something went wrong</h2>
          <p className="mx-auto mt-3 max-w-lg text-sm text-foreground/75 sm:text-base">{errorMessage}</p>
        </CenteredState>
      ) : null}
    </ConfirmationPageShell>
  );
}

/** Shell for Suspense fallback: logo + loading inside the same card layout. */
export function ClassPaymentConfirmationFallback({
  loadingMessage = "Confirming your booking…",
}: {
  loadingMessage?: string;
}) {
  return (
    <main className="min-h-screen text-foreground">
      <ConfirmationPageShell>
        <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
          <ShamellLogo pulse />
          <div className="mt-6 flex items-center justify-center gap-2 text-sm text-foreground/75">
            <Loader2 className="h-4 w-4 animate-spin text-gold/80" aria-hidden />
            <span>{loadingMessage}</span>
          </div>
        </div>
      </ConfirmationPageShell>
    </main>
  );
}
