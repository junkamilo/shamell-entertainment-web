"use client";

import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCatalogPriceWithSuffix } from "@/lib/formatCatalogPrice";

export type InquiryPricingPreviewLine = { name: string; price: number | null };

/** Occasion rows are name-only (no catalog price on occasion types). */
export type InquiryPreviewOccasionLine = { name: string };

function formatLinePrice(price: number | null): string {
  return formatCatalogPriceWithSuffix(price) ?? "On request";
}

export default function InquirySelectionSummary({
  eventLine,
  occasionLines,
  serviceLines,
  guideInvestment,
  loadingService = false,
  stackCards = false,
}: {
  eventLine: InquiryPricingPreviewLine | null;
  occasionLines: InquiryPreviewOccasionLine[];
  serviceLines: InquiryPricingPreviewLine[];
  /** When set, shows estimated total from event + service guide prices (matches server ack email logic). */
  guideInvestment?: { totalUsd: number | null; isPartial: boolean } | null;
  loadingService?: boolean;
  stackCards?: boolean;
}) {
  return (
    <section
      className={cn(
        "min-w-0 max-w-full overflow-x-hidden rounded-2xl border border-gold/30 bg-black/20 p-4 md:p-5",
        stackCards ? "mb-0" : "mb-6",
      )}
    >
      <p className="text-center font-brand text-base tracking-[0.24em] text-gold/95 uppercase sm:text-lg md:text-xl">
        Pricing preview
      </p>
      <p className="mt-3 text-center font-body text-base leading-relaxed text-foreground/72 sm:text-lg">
        Typical investment shown is a guide only. Final proposals depend on your date, venue, production scope, and
        travel — we align every quote with Shamell&apos;s standards.
      </p>

      <div
        className={cn(
          "relative mt-5 space-y-4 rounded-xl border border-gold/20 bg-black/25 px-4 py-4 sm:px-5 sm:py-5",
          loadingService && "opacity-90",
        )}
      >
        {loadingService ? (
          <div className="absolute right-3 top-3 inline-flex items-center gap-2 rounded-full border border-gold/35 bg-black/60 px-3 py-2">
            <Loader2 className="h-4 w-4 shrink-0 animate-spin text-gold" aria-hidden />
            <span className="font-brand text-xs tracking-[0.14em] text-gold/85 uppercase sm:text-sm">
              Loading
            </span>
          </div>
        ) : null}

        <div>
          <p className="font-brand text-xs tracking-[0.22em] text-gold/80 uppercase sm:text-sm md:text-base">
            Event offering
          </p>
          {eventLine ? (
            <div className="mt-2 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-b border-gold/15 pb-3">
              <p className="min-w-0 flex-1 font-brand text-base tracking-[0.12em] text-foreground/95 uppercase sm:text-lg">
                {eventLine.name}
              </p>
              <p className="shrink-0 font-body text-base text-gold/90 tabular-nums sm:text-lg">
                {formatLinePrice(eventLine.price)}
              </p>
            </div>
          ) : (
            <p className="mt-2 font-body text-base text-foreground/55 sm:text-lg">
              Select a catalog offering to see its guide price.
            </p>
          )}
        </div>

        <div>
          <p className="font-brand text-xs tracking-[0.22em] text-gold/80 uppercase sm:text-sm md:text-base">Occasion</p>
          {occasionLines.length > 0 ? (
            <ul className="mt-2 space-y-2 border-b border-gold/15 pb-3">
              {occasionLines.map((row, idx) => (
                <li
                  key={`${row.name}-${idx}`}
                  className="font-body text-base leading-snug text-foreground/90 sm:text-lg"
                >
                  {row.name}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 font-body text-base text-foreground/55 sm:text-lg">
              Select an occasion type to see it here.
            </p>
          )}
        </div>

        <div>
          <p className="font-brand text-xs tracking-[0.22em] text-gold/80 uppercase sm:text-sm md:text-base">
            Service types
          </p>
          {serviceLines.length > 0 ? (
            <ul className="mt-2 space-y-2.5">
              {serviceLines.map((row, idx) => (
                <li
                  key={`${row.name}-${idx}`}
                  className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-b border-gold/10 pb-2 last:border-0 last:pb-0"
                >
                  <span className="min-w-0 flex-1 font-body text-base text-foreground/90 sm:text-lg">{row.name}</span>
                  <span className="shrink-0 font-body text-base text-gold/85 tabular-nums sm:text-lg">
                    {formatLinePrice(row.price)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 font-body text-base text-foreground/55 sm:text-lg">
              Service selections and guide prices appear here when you choose service types.
            </p>
          )}
        </div>

        {guideInvestment ? (
          <div className="border-t-2 border-gold/35 pt-5">
            <p className="font-brand text-xs tracking-[0.22em] text-gold/90 uppercase sm:text-sm md:text-base">
              Estimated guide investment
            </p>
            <p className="mt-2 font-body text-xl font-medium tabular-nums text-gold/95 sm:text-2xl">
              {guideInvestment.totalUsd != null
                ? formatCatalogPriceWithSuffix(guideInvestment.totalUsd)
                : "On request"}
            </p>
            {guideInvestment.isPartial ? (
              <p className="mt-2 font-body text-sm leading-relaxed text-foreground/60 sm:text-base">
                Some selections are priced on request; the total above includes only items with a published guide
                price.
              </p>
            ) : null}
            <p className="mt-3 font-body text-sm leading-relaxed text-foreground/55 sm:text-base">
              Non-binding guide — final proposals depend on date, venue, production scope, and travel.
            </p>
          </div>
        ) : null}
      </div>
    </section>
  );
}
