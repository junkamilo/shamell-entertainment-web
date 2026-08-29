"use client";

import { RevealOnView } from "@/components/shared";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";
import type {
  FixedEventActivityPublic,
  FixedEventPackagePublic,
} from "../../services/fetchOnComingEventDetail";
import { FixedEventActivitiesBanner } from "./FixedEventActivitiesBanner";
import { FixedEventPackagePricingRow } from "./FixedEventPackagePricingRow";

type Props = {
  activities: FixedEventActivityPublic[];
  packages: FixedEventPackagePublic[];
  onSelectPackage: (pkg: FixedEventPackagePublic) => void;
};

export function FixedEventNightExperience({
  activities,
  packages,
  onSelectPackage,
}: Props) {
  const prefersReducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const hasActivities = activities.length > 0;
  const hasPackages = packages.some((p) => p.isActive !== false);

  if (!hasActivities && !hasPackages) return null;

  return (
    <RevealOnView className="mx-auto w-full max-w-6xl px-4 md:max-w-7xl" delay={60}>
      <section
        aria-labelledby="fixed-event-night-heading"
        className={cn(
          "relative overflow-visible rounded-xl",
          "border border-gold/25",
          "bg-[radial-gradient(120%_80%_at_50%_0%,rgba(28,20,14,0.95)_0%,#0a0908_55%,#060504_100%)]",
          "shadow-[0_12px_40px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.04)]",
        )}
      >
        <div className="pointer-events-none absolute inset-0 z-10" aria-hidden>
          <span className="absolute left-3 top-3 h-7 w-7 rounded-tl-md border-l border-t border-gold/40" />
          <span className="absolute right-3 top-3 h-7 w-7 rounded-tr-md border-r border-t border-gold/35" />
          <span className="absolute bottom-3 left-3 h-7 w-7 rounded-bl-md border-b border-l border-gold/30" />
          <span className="absolute bottom-3 right-3 h-7 w-7 rounded-br-md border-b border-r border-gold/30" />
        </div>

        <div className="relative z-[1] space-y-5 px-4 py-5 md:space-y-6 md:px-6 md:py-6">
          <header>
            <h2
              id="fixed-event-night-heading"
              className="font-brand text-[11px] tracking-[0.22em] text-gold uppercase md:text-xs"
            >
              Activities of the night
            </h2>
          </header>

          {hasActivities ? (
            <FixedEventActivitiesBanner
              activities={activities}
              prefersReducedMotion={prefersReducedMotion}
            />
          ) : null}

          {hasActivities && hasPackages ? (
            <div
              className="h-px w-full bg-gradient-to-r from-transparent via-gold/45 to-transparent"
              aria-hidden
            />
          ) : null}

          {hasPackages ? (
            <FixedEventPackagePricingRow
              packages={packages}
              onSelect={onSelectPackage}
              prefersReducedMotion={prefersReducedMotion}
            />
          ) : null}
        </div>
      </section>
    </RevealOnView>
  );
}
