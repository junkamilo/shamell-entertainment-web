"use client";

import { FormEvent, useCallback, useMemo, useState } from "react";
import {
  BadgeCheck,
  KeyRound,
  Lock,
  Mail,
  RotateCcw,
  Send,
  User,
  UserPlus,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import AdminModuleHero from "@/components/admin/AdminModuleHero";
import { ADMIN_ACCESS_TOKEN_KEY } from "@/lib/adminSession";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type Phase = 1 | 2;

export default function ShamellAdminAgregarAdminPage() {
  const apiBaseUrl = useMemo(
    () => process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:3001",
    [],
  );

  const [phase, setPhase] = useState<Phase>(1);
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const parseErrorMessage = useCallback((data: unknown, fallback: string) => {
    if (typeof data !== "object" || data === null) return fallback;
    const payload = data as { message?: string | string[] };
    if (Array.isArray(payload.message)) return payload.message.join(", ");
    return payload.message ?? fallback;
  }, []);

  const resetFlow = () => {
    setPhase(1);
    setEmail("");
    setFullName("");
    setCode("");
    setPassword("");
  };

  const sendVerificationCode = useCallback(
    async (isRetry = false) => {
      const token = localStorage.getItem(ADMIN_ACCESS_TOKEN_KEY);
      if (!token) {
        toast({
          variant: "destructive",
          title: "Sign-in required",
          description: "You must sign in as an administrator.",
        });
        return;
      }

      const trimmedEmail = email.trim().toLowerCase();
      const trimmedName = fullName.trim();
      if (!trimmedEmail || !trimmedName) {
        toast({
          variant: "destructive",
          title: "Incomplete form",
          description: "Enter the new administrator's email and full name.",
        });
        return;
      }

      setIsSending(true);
      try {
        const response = await fetch(`${apiBaseUrl}/api/v1/auth/admin/invite`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email: trimmedEmail, fullName: trimmedName }),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          toast({
            variant: "destructive",
            title: "Could not send code",
            description: parseErrorMessage(data, "Check the details or server configuration."),
          });
          return;
        }

        toast({
          title: isRetry ? "New invitation sent" : "Invitation sent",
          description: `Check ${trimmedEmail} for the Shamell admin invitation code.`,
        });
        setPhase(2);
        setCode("");
        setPassword("");
      } catch {
        toast({
          variant: "destructive",
          title: "Offline",
          description: "Could not reach the server.",
        });
      } finally {
        setIsSending(false);
      }
    },
    [apiBaseUrl, email, fullName, parseErrorMessage],
  );

  const onSendCodeForm = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void sendVerificationCode(false);
  };

  const onAddAdmin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedCode = code.trim();
    if (!/^\d{6}$/.test(trimmedCode)) {
      toast({
        variant: "destructive",
        title: "Invalid code",
        description: "The code must be exactly 6 digits.",
      });
      return;
    }
    if (password.length < 8) {
      toast({
        variant: "destructive",
        title: "Password too short",
        description: "Password must be at least 8 characters.",
      });
      return;
    }

    setIsVerifying(true);
    try {
      const response = await fetch(`${apiBaseUrl}/api/v1/auth/admin/invite/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: trimmedEmail,
          code: trimmedCode,
          password,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        toast({
          variant: "destructive",
          title: "Could not create administrator",
          description: parseErrorMessage(data, "Wrong or expired code, or email already registered."),
        });
        return;
      }

      toast({
        title: "Administrator created",
        description: `${trimmedEmail} can now sign in to the admin panel with that password.`,
      });
      resetFlow();
    } catch {
      toast({
        variant: "destructive",
        title: "Offline",
        description: "Could not reach the server.",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const emailDisplay = email.trim().toLowerCase();

  const renderAdminDetailsCard = (className?: string) => (
    <div
      className={cn(
        "shamell-glass-surface flex h-full min-h-0 flex-col rounded-2xl border p-5 md:p-6",
        phase === 1 ? "border-gold/28 ring-1 ring-gold/12" : "border-gold/14",
        className,
      )}
    >
      <div className="mb-5 flex items-center gap-3 border-b border-gold/10 pb-4">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gold/35 bg-gold/12 font-brand text-xs text-gold">
          1
        </span>
        <div>
          <p className="font-brand text-[10px] tracking-[0.2em] text-gold/65">NEW ADMIN</p>
          <p className="font-brand text-sm tracking-[0.12em] text-gold">Email and name</p>
        </div>
      </div>

      <form onSubmit={onSendCodeForm} className="flex flex-1 flex-col space-y-5">
        <label className="block">
          <span className="flex items-center gap-2 font-brand text-[11px] tracking-[0.2em] text-gold/95">
            <Mail className="h-3.5 w-3.5 text-gold/70" strokeWidth={1.5} />
            EMAIL
          </span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={phase === 2}
            autoComplete="off"
            placeholder="new.admin@example.com"
            className="mt-2 h-12 w-full rounded-xl border border-gold/30 px-4 text-sm text-foreground outline-none transition placeholder:text-foreground/35 focus:border-gold/55 focus:ring-2 focus:ring-gold/20 disabled:cursor-not-allowed disabled:opacity-55"
            required
          />
          <p className="mt-1.5 font-body text-[11px] text-foreground/45">
            The Shamell admin invitation code will arrive here.
          </p>
        </label>

        <label className="block">
          <span className="flex items-center gap-2 font-brand text-[11px] tracking-[0.2em] text-gold/95">
            <User className="h-3.5 w-3.5 text-gold/70" strokeWidth={1.5} />
            FULL NAME
          </span>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            disabled={phase === 2}
            placeholder="As shown in the admin panel"
            className="mt-2 h-12 w-full rounded-xl border border-gold/30 px-4 text-sm text-foreground outline-none transition placeholder:text-foreground/35 focus:border-gold/55 focus:ring-2 focus:ring-gold/20 disabled:cursor-not-allowed disabled:opacity-55"
            required
            minLength={2}
          />
        </label>

        <div className="mt-auto flex flex-wrap gap-3 pt-1">
          <button
            type="submit"
            disabled={isSending || phase === 2}
            className={cn(
              "flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-gold/45 bg-gold/18 px-4 font-brand text-sm tracking-[0.08em] text-gold transition hover:border-gold/60 hover:bg-gold/28 sm:inline-flex sm:w-auto sm:px-6",
              "disabled:cursor-not-allowed disabled:opacity-50",
            )}
          >
            <Send className="h-4 w-4 shrink-0" strokeWidth={1.6} />
            {isSending ? "Sending…" : "Send invitation"}
          </button>
          {phase === 2 ? (
            <button
              type="button"
              onClick={() => {
                setPhase(1);
                setCode("");
                setPassword("");
              }}
              className="shamell-glass-surface inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-gold/22 px-5 font-brand text-[10px] tracking-[0.12em] text-foreground/75 transition hover:border-gold/40 hover:text-gold sm:w-auto"
            >
              <RotateCcw className="h-3.5 w-3.5" strokeWidth={1.5} />
              Edit email or name
            </button>
          ) : null}
        </div>
      </form>
    </div>
  );

  const renderCodePasswordCard = (className?: string) => (
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
            After you tap <span className="text-gold/85">Send invitation</span>, you can enter the 6-digit code and the
            new administrator&apos;s password here.
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
                <span className="font-mono text-[11px] text-gold/85">{emailDisplay}</span>. If you send a new code,
                always use the newest one. The server checks it against the code generated when it was sent.
              </p>
            </div>
          </div>

          <form onSubmit={onAddAdmin} className="flex flex-1 flex-col space-y-5">
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
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="• • • • • •"
                className="mt-2 h-14 w-full rounded-xl border border-gold/35 px-4 text-center font-mono text-2xl tracking-[0.45em] text-gold placeholder:text-gold/20 placeholder:tracking-[0.2em] focus:border-gold/60 focus:outline-none focus:ring-2 focus:ring-gold/25"
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
                onChange={(e) => setPassword(e.target.value)}
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
                  "flex h-12 w-full items-center justify-center rounded-xl border border-gold/45 bg-gold/18 px-4 font-brand text-sm tracking-[0.08em] text-gold transition hover:border-gold/60 hover:bg-gold/28 sm:inline-flex sm:w-auto sm:px-8",
                  "disabled:cursor-not-allowed disabled:opacity-50",
                )}
              >
                {isVerifying ? "Creating…" : "Add administrator"}
              </button>
              <button
                type="button"
                onClick={() => void sendVerificationCode(true)}
                disabled={isSending}
                className="shamell-glass-surface inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-gold/22 px-5 font-brand text-[10px] tracking-[0.12em] text-foreground/75 transition hover:border-gold/40 hover:text-gold disabled:opacity-50 sm:w-auto"
              >
                Send new code
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  );

  return (
    <div className="mx-auto w-full max-w-6xl">
      <AdminModuleHero
        title="Add administrator"
        subtitle="Send the real admin invitation by email and finish onboarding the new administrator on this screen."
        bordered={false}
      />

      <div
        className="mb-6 h-1 overflow-hidden rounded-full bg-gold/15 ring-1 ring-gold/10"
        aria-hidden
      >
        <div
          className={cn(
            "h-full rounded-full bg-linear-to-r from-gold/40 via-gold/70 to-gold/40 transition-all duration-500 ease-out",
            phase === 2 ? "w-full" : "w-[38%]",
          )}
        />
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 lg:mb-8 lg:grid-cols-4 lg:gap-4">
        {(
          [
            ["STEP 1", "New administrator"],
            ["STEP 2", "Email code"],
            ["STEP 3", "Password"],
            ["STEP 4", "Finish"],
          ] as const
        ).map(([label, value], i) => (
          <div
            key={label}
            className={cn(
              "shamell-glass-surface relative overflow-hidden rounded-xl border px-4 py-3 transition",
              phase === 2 && i >= 1
                ? "border-gold/35 bg-gold/8 ring-1 ring-gold/15"
                : "border-gold/15",
            )}
          >
            <div className="pointer-events-none absolute -right-6 -top-8 h-24 w-24 rounded-full bg-gold/10 blur-2xl" />
            <p className="relative font-brand text-[10px] tracking-[0.18em] text-gold/75">{label}</p>
            <p className="relative mt-1 truncate font-brand text-base tracking-wide text-gold md:text-lg">{value}</p>
          </div>
        ))}
      </div>

      <section
        id="add-admin-flow"
        className="shamell-glass-surface overflow-hidden rounded-2xl border border-gold/14"
      >
        <div className="border-b border-gold/12 bg-linear-to-r from-gold/10 via-transparent to-transparent px-5 py-4 md:px-8 md:py-5">
          <div className="flex flex-wrap items-center gap-2">
            <UserPlus className="h-5 w-5 text-gold/80" strokeWidth={1.4} />
            <h2 className="font-brand text-sm tracking-[0.16em] text-gold">Administrator onboarding</h2>
          </div>
        </div>

        <div className="p-5 md:p-8 lg:hidden">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={phase === 1 ? "admin-details" : "code-password"}
              initial={{ opacity: 0, x: phase === 1 ? -18 : 18 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: phase === 1 ? 18 : -18 }}
              transition={{ duration: 0.24, ease: "easeOut" }}
            >
              {phase === 1 ? renderAdminDetailsCard() : renderCodePasswordCard()}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="hidden gap-6 p-5 md:gap-8 md:p-8 lg:grid lg:grid-cols-2 lg:items-stretch">
          {/* Column: new admin details */}
          <div
            className={cn(
              "shamell-glass-surface flex h-full min-h-0 flex-col rounded-2xl border p-5 md:p-6",
              phase === 1 ? "border-gold/28 ring-1 ring-gold/12" : "border-gold/14",
            )}
          >
            <div className="mb-5 flex items-center gap-3 border-b border-gold/10 pb-4">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gold/35 bg-gold/12 font-brand text-xs text-gold">
                1
              </span>
              <div>
                <p className="font-brand text-[10px] tracking-[0.2em] text-gold/65">NEW ADMIN</p>
                <p className="font-brand text-sm tracking-[0.12em] text-gold">Email and name</p>
              </div>
            </div>

            <form onSubmit={onSendCodeForm} className="flex flex-1 flex-col space-y-5">
              <label className="block">
                <span className="flex items-center gap-2 font-brand text-[11px] tracking-[0.2em] text-gold/95">
                  <Mail className="h-3.5 w-3.5 text-gold/70" strokeWidth={1.5} />
                  EMAIL
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={phase === 2}
                  autoComplete="off"
                  placeholder="new.admin@example.com"
                  className="mt-2 h-12 w-full rounded-xl border border-gold/30 px-4 text-sm text-foreground outline-none transition placeholder:text-foreground/35 focus:border-gold/55 focus:ring-2 focus:ring-gold/20 disabled:cursor-not-allowed disabled:opacity-55"
                  required
                />
                <p className="mt-1.5 font-body text-[11px] text-foreground/45">
                  The Shamell admin invitation code will arrive here.
                </p>
              </label>

              <label className="block">
                <span className="flex items-center gap-2 font-brand text-[11px] tracking-[0.2em] text-gold/95">
                  <User className="h-3.5 w-3.5 text-gold/70" strokeWidth={1.5} />
                  FULL NAME
                </span>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={phase === 2}
                  placeholder="As shown in the admin panel"
                  className="mt-2 h-12 w-full rounded-xl border border-gold/30 px-4 text-sm text-foreground outline-none transition placeholder:text-foreground/35 focus:border-gold/55 focus:ring-2 focus:ring-gold/20 disabled:cursor-not-allowed disabled:opacity-55"
                  required
                  minLength={2}
                />
              </label>

              <div className="mt-auto flex flex-wrap gap-3 pt-1">
                <button
                  type="submit"
                  disabled={isSending || phase === 2}
                  className={cn(
                    "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-gold/45 bg-gold/18 px-6 font-brand text-sm tracking-[0.08em] text-gold transition hover:border-gold/60 hover:bg-gold/28",
                    "disabled:cursor-not-allowed disabled:opacity-50",
                  )}
                >
                  <Send className="h-4 w-4 shrink-0" strokeWidth={1.6} />
                  {isSending ? "Sending…" : "Send invitation"}
                </button>
                {phase === 2 ? (
                  <button
                    type="button"
                    onClick={() => {
                      setPhase(1);
                      setCode("");
                      setPassword("");
                    }}
                    className="shamell-glass-surface inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-gold/22 px-5 font-brand text-[10px] tracking-[0.12em] text-foreground/75 transition hover:border-gold/40 hover:text-gold"
                  >
                    <RotateCcw className="h-3.5 w-3.5" strokeWidth={1.5} />
                    Edit email or name
                  </button>
                ) : null}
              </div>
            </form>
          </div>

          {/* Column: code and password */}
          <div
            className={cn(
              "relative flex h-full min-h-0 flex-col rounded-2xl border p-5 md:p-6",
              phase === 2
                ? "shamell-glass-surface border-gold/30 ring-1 ring-gold/15"
                : "shamell-glass-surface border-gold/10 border-dashed opacity-[0.92]",
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
                      code, always use the newest one. The server checks it against the code generated when it was sent.
                    </p>
                  </div>
                </div>

                <form onSubmit={onAddAdmin} className="flex flex-1 flex-col space-y-5">
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
                      onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      placeholder="• • • • • •"
                      className="mt-2 h-14 w-full max-w-xs rounded-xl border border-gold/35 px-4 text-center font-mono text-2xl tracking-[0.45em] text-gold placeholder:text-gold/20 placeholder:tracking-[0.2em] focus:border-gold/60 focus:outline-none focus:ring-2 focus:ring-gold/25"
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
                      onChange={(e) => setPassword(e.target.value)}
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
                        "inline-flex min-h-11 items-center justify-center rounded-xl border border-gold/45 bg-gold/18 px-8 font-brand text-sm tracking-[0.08em] text-gold transition hover:border-gold/60 hover:bg-gold/28",
                        "disabled:cursor-not-allowed disabled:opacity-50",
                      )}
                    >
                      {isVerifying ? "Creating…" : "Add administrator"}
                    </button>
                    <button
                      type="button"
                      onClick={() => void sendVerificationCode(true)}
                      disabled={isSending}
                      className="shamell-glass-surface inline-flex min-h-11 items-center justify-center rounded-xl border border-gold/22 px-5 font-brand text-[10px] tracking-[0.12em] text-foreground/75 transition hover:border-gold/40 hover:text-gold disabled:opacity-50"
                    >
                      Send new code
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
