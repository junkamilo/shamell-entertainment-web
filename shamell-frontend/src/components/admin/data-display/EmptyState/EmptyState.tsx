"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const actionClass =
  "inline-flex items-center justify-center rounded-xl border border-gold/45 bg-gold/12 px-8 py-3.5 font-brand text-[11px] tracking-[0.18em] text-gold shadow-sm transition hover:border-gold/70 hover:bg-gold/20";

export type EmptyStateProps = {
  title: string;
  description?: ReactNode;
  /** Empty catalog vs no search/filter matches. */
  tone?: "primary" | "muted";
  /** Embedded in tables or short containers. */
  variant?: "default" | "embedded";
  icon?: LucideIcon;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  className?: string;
};

export function EmptyState({
  title,
  description,
  tone = "primary",
  variant = "default",
  icon: Icon = Sparkles,
  action,
  className,
}: EmptyStateProps) {
  const isPrimary = tone === "primary";
  const isEmbedded = variant === "embedded";

  const ActionEl =
    action &&
    (action.href ? (
      <Link href={action.href} className={actionClass}>
        {action.label}
      </Link>
    ) : action.onClick ? (
      <button type="button" onClick={action.onClick} className={actionClass}>
        {action.label}
      </button>
    ) : null);

  return (
    <div
      role="status"
      className={cn(
        "flex flex-col items-center justify-center px-4 text-center",
        isEmbedded ? "gap-4 py-8 md:gap-5 md:py-10" : "gap-5 py-12 md:gap-6 md:py-14",
        !isEmbedded && isPrimary && "min-h-[280px] md:min-h-[300px]",
        !isEmbedded && !isPrimary && "min-h-[220px] md:min-h-[260px]",
        className,
      )}
    >
      {isPrimary ? (
        <div
          className={cn(
            "flex shrink-0 items-center justify-center rounded-full border border-gold/28 bg-gold/10",
            isEmbedded ? "h-14 w-14" : "h-16 w-16",
          )}
        >
          <Icon className={cn("text-gold/95", isEmbedded ? "h-7 w-7" : "h-8 w-8")} strokeWidth={1.35} />
        </div>
      ) : (
        <div
          className={cn(
            "flex shrink-0 items-center justify-center rounded-full border border-gold/22 bg-gold/8",
            isEmbedded ? "h-11 w-11" : "h-12 w-12",
          )}
        >
          <Icon className={cn("text-gold/80", isEmbedded ? "h-5 w-5" : "h-6 w-6")} strokeWidth={1.35} />
        </div>
      )}
      <div className={cn("max-w-lg space-y-3", !description && !ActionEl && "space-y-0")}>
        <p
          className={cn(
            "font-brand tracking-[0.06em] text-gold",
            isEmbedded
              ? isPrimary
                ? "text-lg md:text-xl"
                : "text-base md:text-lg"
              : isPrimary
                ? "text-xl sm:text-2xl md:text-[1.65rem]"
                : "text-lg sm:text-xl",
          )}
        >
          {title}
        </p>
        {description ? (
          <div className="mx-auto font-body text-base leading-relaxed text-foreground/55">{description}</div>
        ) : null}
      </div>
      {ActionEl}
    </div>
  );
}
