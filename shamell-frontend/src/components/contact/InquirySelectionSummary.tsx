"use client";

import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type SummaryCardData = {
  title: string;
  subtitle?: string;
  description?: string;
  items?: string[];
  imageUrl?: string | null;
  /** When set to VIDEO, `imageUrl` is played as muted inline video. */
  imageMediaType?: "IMAGE" | "VIDEO";
};

function SummaryCard({
  data,
  emptyLabel,
}: {
  data: SummaryCardData | null;
  emptyLabel: string;
}) {
  if (!data) {
    return (
      <div className="min-w-0 overflow-hidden rounded-xl border border-gold/25 bg-black/25 px-4 py-4 md:px-5 md:py-5">
        <p className="font-brand text-sm tracking-[0.2em] text-gold/80 uppercase sm:text-base">Pending</p>
        <p className="mt-2 wrap-break-word font-body text-base leading-relaxed text-foreground/75 md:text-lg">{emptyLabel}</p>
      </div>
    );
  }

  const topItems = (data.items ?? []).filter(Boolean).slice(0, 3);

  return (
    <div className="min-w-0 overflow-hidden rounded-xl border border-gold/30 bg-[linear-gradient(165deg,rgba(21,12,24,0.92),rgba(8,6,10,0.98))]">
      {data.imageUrl ? (
        <div className="relative aspect-video w-full min-w-0 overflow-hidden border-b border-gold/20">
          {data.imageMediaType === "VIDEO" ? (
            <video
              src={data.imageUrl}
              className="h-full w-full object-cover"
              muted
              playsInline
              loop
              autoPlay
              aria-hidden
            />
          ) : (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={data.imageUrl} alt="" className="h-full w-full object-cover" />
            </>
          )}
          <div
            className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,transparent_35%,rgba(3,2,4,0.72)_100%)]"
            aria-hidden
          />
        </div>
      ) : null}
      <div className="min-w-0 px-4 py-4 md:px-5 md:py-5">
        <p className="wrap-break-word font-brand text-base tracking-[0.14em] text-gold uppercase sm:text-lg">{data.title}</p>
        {data.subtitle ? (
          <p className="mt-1 wrap-break-word font-body text-base tracking-[0.14em] text-gold/70 uppercase sm:text-lg">{data.subtitle}</p>
        ) : null}
        {data.description ? (
          <p className="mt-2 wrap-break-word font-body text-base leading-relaxed text-foreground/80 line-clamp-3 md:text-lg">
            {data.description}
          </p>
        ) : null}
        {topItems.length > 0 ? (
          <ul className="mt-3 space-y-1.5">
            {topItems.map((item, i) => (
              <li key={`${item}-${i}`} className="wrap-break-word font-body text-base text-foreground/75 md:text-lg">
                <span className="mr-2 text-gold/80">✦</span>
                {item}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
}

function PlusDivider({ stackCards }: { stackCards: boolean }) {
  return (
    <div
      className={cn(
        "flex items-center justify-center text-gold/75 font-brand text-lg",
        stackCards ? "py-1" : "hidden md:flex",
      )}
      aria-hidden
    >
      +
    </div>
  );
}

export default function InquirySelectionSummary({
  eventCard,
  occasionCard,
  serviceCard,
  serviceCards,
  loadingService,
  stackCards = false,
}: {
  eventCard: SummaryCardData | null;
  occasionCard: SummaryCardData | null;
  serviceCard: SummaryCardData | null;
  /** When set (2+ entries), renders stacked previews instead of a single `serviceCard`. */
  serviceCards?: SummaryCardData[] | null;
  loadingService?: boolean;
  /** Narrow sidebar (e.g. checkout column): single column of cards + vertical dividers. */
  stackCards?: boolean;
}) {
  return (
    <section
      className={cn(
        "min-w-0 max-w-full overflow-x-hidden rounded-2xl border border-gold/30 bg-black/20 p-4 md:p-5",
        stackCards ? "mb-0" : "mb-6",
      )}
    >
      <p className="text-center font-brand text-sm tracking-[0.24em] text-gold/95 uppercase sm:text-base md:text-lg">
        Your Selection Summary
      </p>
      <p className="mt-2 text-center font-body text-base leading-relaxed text-foreground/72 md:text-lg md:leading-relaxed">
        This preview updates as you choose an event, occasion, and service.
      </p>

      <div
        className={cn(
          "mt-4 grid min-w-0 w-full gap-3",
          stackCards
            ? "grid-cols-1"
            : "mx-auto max-w-[1180px] grid-cols-1 md:grid-cols-[1fr_auto_1fr_auto_1fr] md:items-stretch md:justify-center",
        )}
      >
        <SummaryCard data={eventCard} emptyLabel="Select an event to preview image and details." />
        <PlusDivider stackCards={stackCards} />
        <SummaryCard data={occasionCard} emptyLabel="Select an occasion type to continue." />
        <PlusDivider stackCards={stackCards} />
        <div className={cn("relative min-w-0", loadingService && "opacity-90")}>
          {serviceCards && serviceCards.length > 0 ? (
            <div className="space-y-3">
              {serviceCards.map((card, idx) => (
                <SummaryCard
                  key={`${card.title}-${idx}`}
                  data={card}
                  emptyLabel="Service details will appear from your inquiry type."
                />
              ))}
            </div>
          ) : (
            <SummaryCard data={serviceCard} emptyLabel="Service details will appear from your inquiry type." />
          )}
          {loadingService ? (
            <div className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full border border-gold/35 bg-black/60 px-2.5 py-1.5">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-gold" />
              <span className="font-brand text-sm tracking-[0.14em] text-gold/85 uppercase">Loading</span>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

