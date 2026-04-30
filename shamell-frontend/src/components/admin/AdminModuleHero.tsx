"use client";

import Link from "next/link";

type AdminModuleHeroProps = {
  title: string;
  eyebrow?: string;
  actionLabel: string;
  actionHref?: string;
  onAction?: () => void;
  bordered?: boolean;
};

export default function AdminModuleHero({
  title,
  eyebrow = "SHAMELL ADMIN",
  actionLabel,
  actionHref,
  onAction,
  bordered = true,
}: AdminModuleHeroProps) {
  return (
    <section
      className={`mb-8 rounded-md px-4 py-8 text-center md:px-6 md:py-10 ${
        bordered ? "border border-gold/20 bg-black/20" : "bg-transparent"
      }`}
    >
      <p className="font-brand text-[10px] tracking-[0.28em] text-gold/80">{eyebrow}</p>
      <h1 className="mt-2 font-brand text-3xl tracking-[0.08em] text-gold md:text-5xl">{title}</h1>

      <div className="mx-auto mt-4 flex w-full max-w-[170px] items-center justify-center gap-3">
        <span className="h-px flex-1 bg-gold/35" />
        <span className="h-2 w-2 rounded-full bg-gold/60" />
        <span className="h-px flex-1 bg-gold/35" />
      </div>

      {actionHref ? (
        <Link
          href={actionHref}
          className="mx-auto mt-5 inline-flex min-h-11 min-w-[220px] items-center justify-center rounded-full border border-gold/30 bg-gold/15 px-6 font-brand text-sm tracking-[0.06em] text-gold transition hover:bg-gold/25"
        >
          + {actionLabel}
        </Link>
      ) : (
        <button
          type="button"
          onClick={onAction}
          className="mx-auto mt-5 inline-flex min-h-11 min-w-[220px] items-center justify-center rounded-full border border-gold/30 bg-gold/15 px-6 font-brand text-sm tracking-[0.06em] text-gold transition hover:bg-gold/25"
        >
          + {actionLabel}
        </button>
      )}
    </section>
  );
}
