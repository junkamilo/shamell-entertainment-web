"use client";

import type { ReactNode } from "react";
import { Download } from "lucide-react";
import Link from "next/link";

export type ModuleHeroProps = {
  title: string;
  subtitle?: ReactNode;
  eyebrow?: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  /** Optional outline action (e.g. export) shown before the primary gold button */
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  /** Rendered before primary/secondary actions (e.g. section tabs) */
  extraActions?: ReactNode;
  bordered?: boolean;
};

const actionButtonClass =
  "admin-btn-primary inline-flex min-h-11 shrink-0 items-center justify-center px-6 font-brand text-sm font-medium tracking-[0.06em] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2";

const secondaryButtonClass =
  "admin-btn-secondary inline-flex min-h-11 shrink-0 items-center justify-center gap-2 px-5 font-brand text-sm font-medium tracking-[0.06em] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2";

export function ModuleHero({
  title,
  subtitle,
  eyebrow = "SHAMELL ADMIN",
  actionLabel,
  actionHref,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  extraActions,
  bordered = true,
}: ModuleHeroProps) {
  const hasSecondary = Boolean(secondaryActionLabel && onSecondaryAction);
  const hasPrimary = Boolean(actionLabel && (actionHref || onAction));
  const hasActions = Boolean(extraActions || hasSecondary || hasPrimary);

  return (
    <section
      className={`mb-8 rounded-xl px-4 py-7 md:px-6 md:py-9 ${
        bordered ? "admin-panel" : "bg-transparent"
      }`}
    >
      <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between md:gap-8">
        <div className="min-w-0 text-left">
          <p className="font-brand text-[10px] tracking-[0.28em] text-gold/85">{eyebrow}</p>
          <h1 className="mt-2 font-brand text-[1.75rem] leading-tight tracking-[0.06em] text-gold sm:text-3xl md:text-4xl lg:text-[2.65rem] lg:leading-tight">
            {title}
          </h1>
          {subtitle ? (
            <p className="mt-3 max-w-xl font-elegant text-xl leading-[1.65] text-foreground/92 sm:font-body sm:text-sm sm:leading-relaxed sm:text-foreground/55">
              {subtitle}
            </p>
          ) : null}
        </div>

        {hasActions ? (
          <div
            className={`flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center md:pt-1 ${hasSecondary ? "sm:flex-wrap" : ""}`}
          >
            {extraActions ? (
              <div className="flex w-full justify-start sm:w-auto sm:justify-end">{extraActions}</div>
            ) : null}
            {hasSecondary ? (
              <button type="button" onClick={onSecondaryAction} className={`${secondaryButtonClass} w-full sm:w-auto`}>
                <Download className="h-4 w-4 shrink-0 opacity-90" strokeWidth={1.75} />
                {secondaryActionLabel}
              </button>
            ) : null}
            {hasPrimary ? (
              actionHref ? (
                <Link href={actionHref} className={`${actionButtonClass} w-full sm:w-auto`}>
                  + {actionLabel}
                </Link>
              ) : (
                <button type="button" onClick={onAction} className={`${actionButtonClass} w-full sm:w-auto`}>
                  + {actionLabel}
                </button>
              )
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}
