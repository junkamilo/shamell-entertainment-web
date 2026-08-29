"use client";

import { useId, useState } from "react";
import { ChevronDown, Ticket, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { formatCatalogPriceAmount } from "@/lib/services/formatCatalogPrice";
import { cn } from "@/lib/utils";
import type {
  FixedEventActivityPublic,
  FixedEventPackagePublic,
} from "../../services/fetchOnComingEventDetail";
import {
  nightRowCardClass,
  nightRowContainerClass,
  nightRowNeedsScroll,
} from "./nightExperienceRow";

type Props = {
  packages: FixedEventPackagePublic[];
  onSelect: (pkg: FixedEventPackagePublic) => void;
  prefersReducedMotion?: boolean;
};

const CTA_GOLD =
  "bg-[linear-gradient(165deg,#f4e6c4_0%,#d4b76a_38%,#c5a55a_62%,#a8873f_100%)] border border-[#f5e6c8]/70 text-[#1a1208]";

function includedActivities(
  pkg: FixedEventPackagePublic,
): FixedEventActivityPublic[] {
  return [...pkg.activities]
    .filter((a) => a.title.trim())
    .sort((a, b) => a.displayOrder - b.displayOrder);
}

function PackageIncludesPanel({
  activities,
  inclusionSummary,
}: {
  activities: FixedEventActivityPublic[];
  inclusionSummary: string;
}) {
  if (activities.length > 0) {
    return (
      <ul className="space-y-4 md:space-y-5">
        {activities.map((activity) => (
          <li
            key={activity.id}
            className="flex items-start gap-3.5 font-body text-xl leading-snug text-foreground md:text-2xl"
          >
            <span
              className="mt-2.5 h-3 w-3 shrink-0 rounded-full ring-1 ring-gold/40 md:mt-3 md:h-3.5 md:w-3.5"
              style={{
                backgroundColor: activity.accentColor?.trim() || "#c5a55a",
              }}
              aria-hidden
            />
            <span className="font-medium">{activity.title}</span>
          </li>
        ))}
      </ul>
    );
  }

  if (inclusionSummary.trim()) {
    return (
      <p className="font-body text-xl leading-snug text-foreground md:text-2xl">
        {inclusionSummary.trim()}
      </p>
    );
  }

  return (
    <p className="font-body text-lg text-foreground/70 md:text-xl">
      No inclusions listed.
    </p>
  );
}

export function FixedEventPackagePricingRow({
  packages,
  onSelect,
  prefersReducedMotion = false,
}: Props) {
  const sorted = [...packages]
    .filter((p) => p.isActive !== false)
    .sort((a, b) => a.displayOrder - b.displayOrder);

  const [openIncludesId, setOpenIncludesId] = useState<string | null>(null);
  const baseId = useId();

  if (sorted.length === 0) return null;

  const count = sorted.length;
  const scrolls = nightRowNeedsScroll(count);

  return (
    <div
      className={cn(nightRowContainerClass(count), "gap-5 md:gap-6")}
      role="list"
      aria-label="Ticket packages"
      data-scroll-row={scrolls ? "true" : "false"}
    >
      {sorted.map((pkg, index) => {
        const activities = includedActivities(pkg);
        const soldOut = pkg.soldOut;
        const inventoryLabel = soldOut
          ? "Sold out"
          : `${pkg.ticketsRemaining} tickets left`;
        const includesOpen = openIncludesId === pkg.id;
        const panelId = `${baseId}-includes-${pkg.id}`;
        const hasIncludes =
          activities.length > 0 || Boolean(pkg.inclusionSummary?.trim());

        return (
          <motion.article
            key={pkg.id}
            role="listitem"
            className={cn(
              nightRowCardClass(count),
              "group/pkg relative flex flex-col gap-4 overflow-hidden rounded-xl",
              "border border-gold/30 bg-[#0a0908]/90 p-5 pt-6 md:gap-5 md:p-6 md:pt-7",
              "shadow-[0_8px_24px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.03)]",
              "transition-[border-color,box-shadow] duration-400",
              soldOut
                ? "opacity-75"
                : "hover:border-gold/55 hover:shadow-[0_14px_40px_rgba(0,0,0,0.55),0_0_28px_rgba(197,165,90,0.12)]",
            )}
            initial={prefersReducedMotion ? false : { opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{
              delay: index * 0.08,
              duration: 0.4,
              ease: [0.16, 1, 0.3, 1],
            }}
            whileHover={
              prefersReducedMotion || soldOut || includesOpen
                ? undefined
                : { y: -4 }
            }
          >
            {!soldOut ? (
              <div
                className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover/pkg:opacity-100"
                aria-hidden
              >
                <div className="absolute inset-0 bg-[radial-gradient(90%_70%_at_100%_0%,rgba(197,165,90,0.12),transparent_55%)]" />
              </div>
            ) : null}

            <div
              className="pointer-events-none absolute inset-0 z-[1] opacity-0 transition-opacity duration-400 group-hover/pkg:opacity-100"
              aria-hidden
            >
              <span className="absolute left-2.5 top-2.5 h-5 w-5 rounded-tl-md border-l border-t border-gold/45" />
              <span className="absolute bottom-2.5 right-2.5 h-5 w-5 rounded-br-md border-b border-r border-gold/35" />
            </div>

            <div
              className={cn(
                "absolute top-3 right-3 z-[2] min-w-[4.25rem] rounded-lg px-3 py-2 text-center md:top-4 md:right-4",
                "border border-gold/40 bg-black/75",
                "shadow-[0_6px_18px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.05)]",
              )}
              aria-label={inventoryLabel}
            >
              <span
                className="pointer-events-none absolute left-1.5 top-1.5 h-2.5 w-2.5 border-l border-t border-gold/50"
                aria-hidden
              />
              {soldOut ? (
                <p className="font-brand text-[11px] leading-tight tracking-[0.14em] text-gold uppercase">
                  Sold out
                </p>
              ) : (
                <>
                  <p className="font-display text-3xl leading-none tabular-nums text-gold md:text-4xl">
                    {pkg.ticketsRemaining}
                  </p>
                  <p className="mt-1.5 font-brand text-[11px] tracking-[0.16em] text-gold/85 uppercase">
                    Left
                  </p>
                </>
              )}
            </div>

            <div className="relative z-[1] pr-20 md:pr-24">
              <p className="font-display text-4xl tabular-nums text-gold md:text-5xl">
                ${formatCatalogPriceAmount(pkg.price)}
              </p>
              {pkg.badge ? (
                <p className="mt-2 font-brand text-[10px] tracking-[0.16em] text-gold/75 uppercase">
                  {pkg.badge}
                </p>
              ) : null}
              <h3 className="mt-1 font-brand text-xl tracking-[0.1em] text-gold uppercase line-clamp-2 md:text-2xl">
                {pkg.title}
              </h3>
            </div>

            {hasIncludes ? (
              <div className="relative z-[1] w-full min-w-0">
                <button
                  type="button"
                  aria-expanded={includesOpen}
                  aria-controls={panelId}
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenIncludesId((prev) =>
                      prev === pkg.id ? null : pkg.id,
                    );
                  }}
                  className={cn(
                    "flex w-full items-center justify-between gap-3 rounded-lg border border-gold/40 bg-black/35 px-4 py-4",
                    "font-brand text-base tracking-[0.12em] text-gold uppercase md:text-lg",
                    "transition-[border-color,background-color] duration-300",
                    "hover:border-gold/60 hover:bg-gold/[0.08]",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/55",
                    includesOpen && "border-gold/65 bg-gold/[0.1]",
                  )}
                >
                  <span>[ Includes ]</span>
                  <ChevronDown
                    className={cn(
                      "h-6 w-6 shrink-0 transition-transform duration-300",
                      includesOpen && "rotate-180",
                    )}
                    strokeWidth={1.75}
                    aria-hidden
                  />
                </button>
              </div>
            ) : null}

            <div className="relative z-[1] w-full min-w-0 rounded-xl border border-gold/35 bg-gold/[0.06] px-4 py-4 md:px-5 md:py-5">
              <p className="font-brand text-sm tracking-[0.14em] text-gold/85 uppercase md:text-base">
                Arrival
              </p>
              <div className="mt-2.5 flex items-center gap-3">
                <Ticket
                  className="h-6 w-6 shrink-0 text-gold"
                  strokeWidth={1.5}
                  aria-hidden
                />
                <p className="font-brand text-lg tracking-[0.04em] text-gold md:text-xl">
                  {pkg.arrivalLabel}
                </p>
              </div>
            </div>

            <button
              type="button"
              disabled={soldOut}
              aria-disabled={soldOut}
              onClick={() => onSelect(pkg)}
              className={cn(
                "relative z-[1] mt-auto w-full min-w-0 rounded-lg px-4 py-4",
                "font-brand text-base tracking-[0.12em] uppercase md:text-lg",
                "shadow-[0_6px_20px_rgba(0,0,0,0.35)]",
                "transition-[transform,box-shadow,opacity,filter] duration-300",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0908]",
                soldOut
                  ? "cursor-not-allowed border border-gold/20 bg-black/40 text-foreground/40 opacity-60"
                  : cn(
                      CTA_GOLD,
                      "hover:shadow-[0_10px_28px_rgba(197,165,90,0.28)]",
                      "group-hover/pkg:brightness-105 group-hover/pkg:scale-[1.01]",
                    ),
              )}
            >
              {soldOut ? "Sold out" : "Buy"}
            </button>

            <AnimatePresence>
              {includesOpen ? (
                <motion.div
                  key="includes-overlay"
                  id={panelId}
                  role="dialog"
                  aria-label={`Included in ${pkg.title}`}
                  className="absolute inset-2 z-[5] flex flex-col overflow-hidden rounded-xl border border-gold/45 bg-[#0c0a08]/98 p-5 shadow-[0_12px_36px_rgba(0,0,0,0.65)] md:inset-3 md:p-7"
                  initial={
                    prefersReducedMotion
                      ? false
                      : { opacity: 0, scale: 0.96, y: 8 }
                  }
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={
                    prefersReducedMotion
                      ? { opacity: 0 }
                      : { opacity: 0, scale: 0.96, y: 6 }
                  }
                  transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                >
                  <div className="mb-5 flex items-start justify-between gap-3 border-b border-gold/25 pb-4">
                    <div>
                      <p className="font-brand text-sm tracking-[0.14em] text-gold uppercase md:text-base">
                        Includes
                      </p>
                      <p className="mt-2 font-body text-lg text-foreground/85 md:text-xl">
                        What&apos;s in this package
                      </p>
                    </div>
                    <button
                      type="button"
                      aria-label="Close includes"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenIncludesId(null);
                      }}
                      className={cn(
                        "rounded-md border border-gold/30 p-2.5 text-gold/80",
                        "transition-colors hover:border-gold/55 hover:text-gold",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/55",
                      )}
                    >
                      <X className="h-6 w-6" strokeWidth={1.75} />
                    </button>
                  </div>
                  <div className="min-h-0 flex-1 overflow-y-auto pr-1">
                    <PackageIncludesPanel
                      activities={activities}
                      inclusionSummary={pkg.inclusionSummary ?? ""}
                    />
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </motion.article>
        );
      })}
    </div>
  );
}
