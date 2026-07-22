import { type FormEvent } from "react";
import { Mail, RotateCcw, Send, User } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AgregarAdminCardLayout, AgregarAdminPhase } from "../types/agregarAdmin.types";

type Props = {
  phase: AgregarAdminPhase;
  layout: AgregarAdminCardLayout;
  email: string;
  fullName: string;
  isSending: boolean;
  onEmailChange: (value: string) => void;
  onFullNameChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onEditEmailOrName: () => void;
  className?: string;
};

export default function AgregarAdminDetailsCard({
  phase,
  layout,
  email,
  fullName,
  isSending,
  onEmailChange,
  onFullNameChange,
  onSubmit,
  onEditEmailOrName,
  className,
}: Props) {
  const isMobile = layout === "mobile";

  return (
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

      <form onSubmit={onSubmit} className="flex flex-1 flex-col space-y-5">
        <label className="block">
          <span className="flex items-center gap-2 font-brand text-[11px] tracking-[0.2em] text-gold/95">
            <Mail className="h-3.5 w-3.5 text-gold/70" strokeWidth={1.5} />
            EMAIL
          </span>
          <input
            type="email"
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
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
            onChange={(e) => onFullNameChange(e.target.value)}
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
              "items-center justify-center gap-2 rounded-xl border border-gold/45 bg-gold/18 font-brand text-sm tracking-[0.08em] text-gold transition hover:border-gold/60 hover:bg-gold/28",
              "disabled:cursor-not-allowed disabled:opacity-50",
              isMobile
                ? "flex h-12 w-full px-4 sm:inline-flex sm:w-auto sm:px-6"
                : "inline-flex min-h-11 px-6",
            )}
          >
            <Send className="h-4 w-4 shrink-0" strokeWidth={1.6} />
            {isSending ? "Sending…" : "Send invitation"}
          </button>
          {phase === 2 ? (
            <button
              type="button"
              onClick={onEditEmailOrName}
              className={cn(
                "shamell-glass-surface inline-flex items-center justify-center gap-2 rounded-xl border border-gold/22 px-5 font-brand text-[10px] tracking-[0.12em] text-foreground/75 transition hover:border-gold/40 hover:text-gold",
                isMobile ? "min-h-11 w-full sm:w-auto" : "min-h-11",
              )}
            >
              <RotateCcw className="h-3.5 w-3.5" strokeWidth={1.5} />
              Edit email or name
            </button>
          ) : null}
        </div>
      </form>
    </div>
  );
}
