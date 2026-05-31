"use client";

import Image from "next/image";
import Link from "next/link";
import RevealOnView from "@/components/shared/RevealOnView";
import { useOnComingEventsSettings } from "@/hooks/use-on-coming-events-settings";
import { ON_COMING_EVENTS_PUBLIC_PATH } from "@/lib/onComingEventsRoutes";

export default function OnComingEventsPromoSection() {
  const { clientEnabled, promo, isLoading } = useOnComingEventsSettings();

  if (isLoading || !clientEnabled) return null;

  const title = promo.promoTitle?.trim() || "On Coming Events";
  const description =
    promo.promoDescription?.trim() ||
    "View the interactive floor plan and choose your table for an unforgettable evening.";

  return (
    <section id="on-coming-events" className="bg-transparent px-4 py-20 md:py-24">
      <div className="mx-auto max-w-6xl">
        <RevealOnView className="relative mb-12 text-center md:mb-16" delay={40}>
          <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="h-36 w-[min(28rem,94vw)] rounded-[100%] bg-[radial-gradient(ellipse_at_center,rgba(197,165,90,0.08),transparent_72%)] blur-3xl opacity-80" />
          </div>
          <div className="relative">
            <h2 className="font-brand text-2xl font-semibold tracking-[0.14em] text-gold md:text-4xl md:tracking-[0.16em]">
              {title}
            </h2>
            <div
              className="mx-auto mt-5 h-px w-20 max-w-48 bg-linear-to-r from-transparent via-white/25 to-transparent"
              aria-hidden
            />
          </div>
        </RevealOnView>

        <div className="grid items-stretch gap-10 md:grid-cols-2 md:gap-14">
          <RevealOnView delay={80} amount={0.18}>
            <div className="relative aspect-3/4 w-full overflow-hidden rounded-2xl border border-gold/20 bg-[radial-gradient(ellipse_at_center,rgba(32,28,24,1)_0%,#060606_70%)] shadow-[0_12px_48px_rgba(0,0,0,0.45)]">
              {promo.promoImageUrl ? (
                <Image
                  src={promo.promoImageUrl}
                  alt=""
                  fill
                  className="object-contain object-center p-3 sm:p-4"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-foreground/50">
                  On Coming Events
                </div>
              )}
            </div>
          </RevealOnView>

          <RevealOnView className="flex flex-col justify-center" delay={120} amount={0.18}>
            <p className="whitespace-pre-wrap font-body text-base leading-relaxed text-foreground/88 md:text-lg md:leading-relaxed">
              {description}
            </p>
            <Link
              href={ON_COMING_EVENTS_PUBLIC_PATH}
              className="mt-8 inline-flex w-fit rounded-lg border border-gold/45 bg-gold/10 px-6 py-3 font-brand text-xs font-semibold uppercase tracking-[0.14em] text-gold transition hover:bg-gold/20"
            >
              Explore the floor plan
            </Link>
          </RevealOnView>
        </div>
      </div>
    </section>
  );
}
