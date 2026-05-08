"use client";

import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type SummaryCardData = {
  title: string;
  subtitle?: string;
  description?: string;
  items?: string[];
  imageUrl?: string | null;
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
      <div className="rounded-xl border border-gold/25 bg-black/25 px-4 py-4">
        <p className="font-brand text-[10px] tracking-[0.2em] text-gold/80 uppercase">Pending</p>
        <p className="mt-2 font-body text-sm text-foreground/65">{emptyLabel}</p>
      </div>
    );
  }

  const topItems = (data.items ?? []).filter(Boolean).slice(0, 3);

  return (
    <div className="overflow-hidden rounded-xl border border-gold/30 bg-[linear-gradient(165deg,rgba(21,12,24,0.92),rgba(8,6,10,0.98))]">
      {data.imageUrl ? (
        <div className="relative aspect-video w-full overflow-hidden border-b border-gold/20">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={data.imageUrl} alt="" className="h-full w-full object-cover" />
          <div
            className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,transparent_35%,rgba(3,2,4,0.72)_100%)]"
            aria-hidden
          />
        </div>
      ) : null}
      <div className="px-4 py-4">
        <p className="font-brand text-sm tracking-[0.14em] text-gold uppercase">{data.title}</p>
        {data.subtitle ? (
          <p className="mt-1 font-body text-[11px] tracking-[0.14em] text-gold/65 uppercase">{data.subtitle}</p>
        ) : null}
        {data.description ? (
          <p className="mt-2 font-body text-sm leading-relaxed text-foreground/74 line-clamp-3">{data.description}</p>
        ) : null}
        {topItems.length > 0 ? (
          <ul className="mt-3 space-y-1">
            {topItems.map((item, i) => (
              <li key={`${item}-${i}`} className="font-body text-xs text-foreground/70">
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

export default function InquirySelectionSummary({
  eventCard,
  occasionCard,
  serviceCard,
  loadingService,
}: {
  eventCard: SummaryCardData | null;
  occasionCard: SummaryCardData | null;
  serviceCard: SummaryCardData | null;
  loadingService?: boolean;
}) {
  return (
    <section className="mb-6 rounded-2xl border border-gold/30 bg-black/20 p-4 md:p-5">
      <p className="text-center font-brand text-[10px] tracking-[0.24em] text-gold/95 uppercase">
        Your Selection Summary
      </p>
      <p className="mt-2 text-center font-body text-sm text-foreground/65">
        This preview updates as you choose an event, occasion, and service.
      </p>

      <div className="mx-auto mt-4 grid max-w-[1180px] grid-cols-1 gap-3 md:grid-cols-[1fr_auto_1fr_auto_1fr] md:items-stretch md:justify-center">
        <SummaryCard data={eventCard} emptyLabel="Select an event to preview image and details." />
        <div className="hidden md:flex items-center justify-center text-gold/75 font-brand text-lg">+</div>
        <SummaryCard data={occasionCard} emptyLabel="Select an occasion type to continue." />
        <div className="hidden md:flex items-center justify-center text-gold/75 font-brand text-lg">+</div>
        <div className={cn("relative", loadingService && "opacity-90")}>
          <SummaryCard data={serviceCard} emptyLabel="Service details will appear from your inquiry type." />
          {loadingService ? (
            <div className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full border border-gold/35 bg-black/60 px-2 py-1">
              <Loader2 className="h-3 w-3 animate-spin text-gold" />
              <span className="font-brand text-[9px] tracking-[0.14em] text-gold/85 uppercase">Loading</span>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

