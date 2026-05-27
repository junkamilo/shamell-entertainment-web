"use client";

import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  icon: LucideIcon;
  title: string;
  description?: string;
  headerAction?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
};

export function VenueLayoutPromoModuleSection({
  icon: Icon,
  title,
  description,
  headerAction,
  className,
  children,
}: Props) {
  return (
    <section
      className={cn(
        "shamell-glass-surface overflow-hidden rounded-2xl border border-gold/14",
        className,
      )}
    >
      <div className="border-b border-gold/12 bg-linear-to-r from-gold/10 via-transparent to-transparent px-5 py-4 md:px-8 md:py-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <Icon className="h-5 w-5 shrink-0 text-gold/80" strokeWidth={1.4} />
              <h2 className="font-brand text-sm tracking-[0.16em] text-gold">{title}</h2>
            </div>
            {description ? (
              <p className="mt-2 max-w-2xl text-xs text-foreground/55">{description}</p>
            ) : null}
          </div>
          {headerAction ? <div className="shrink-0">{headerAction}</div> : null}
        </div>
      </div>
      <div className="px-5 py-5 md:px-8 md:py-6">{children}</div>
    </section>
  );
}
