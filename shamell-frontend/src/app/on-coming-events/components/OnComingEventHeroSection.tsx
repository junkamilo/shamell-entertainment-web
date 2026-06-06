"use client";

import type { ReactNode } from "react";
import { ShamellBackButton } from "@/components/shared/ShamellBackButton";
import { formatCatalogPriceAmount } from "@/lib/formatCatalogPrice";
import { serviceCatalogMediaTypeFromUrl } from "@/lib/serviceCatalogMedia";

type Props = {
  title: string;
  heroImageUrl: string | null;
  heroMediaType?: "IMAGE" | "VIDEO" | null;
  backFallbackHref: string;
  onBackNavigate?: () => void;
  price?: number | null;
  showPrice?: boolean;
  priceAriaLabel?: string;
  priceBadge?: ReactNode;
};

export function OnComingEventHeroSection({
  title,
  heroImageUrl,
  heroMediaType,
  backFallbackHref,
  onBackNavigate,
  price,
  showPrice = false,
  priceAriaLabel,
  priceBadge,
}: Props) {
  const heroIsVideo =
    heroMediaType === "VIDEO" || serviceCatalogMediaTypeFromUrl(heroImageUrl) === "VIDEO";
  const hasSimplePrice = showPrice && price != null && !Number.isNaN(Number(price));
  const showPriceBadge = Boolean(priceBadge) || hasSimplePrice;

  return (
    <section className="relative min-h-[42vh] w-full overflow-hidden md:min-h-[50vh]">
      {heroImageUrl ? (
        heroIsVideo ? (
          <video
            src={heroImageUrl}
            className="absolute inset-0 h-full w-full object-cover object-center"
            muted
            playsInline
            loop
            autoPlay
            aria-label={`${title} hero`}
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={heroImageUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover object-center"
          />
        )
      ) : (
        <div className="absolute inset-0 bg-[#0a0908]" />
      )}
      <div className="absolute inset-0 bg-black/55" aria-hidden />
      <div className="absolute left-4 top-4 z-10 md:left-8 md:top-6">
        <ShamellBackButton
          fallbackHref={backFallbackHref}
          label="Back"
          hideLabelOnMobile
          onNavigateStart={onBackNavigate}
        />
      </div>
      <div className="relative flex min-h-[42vh] flex-col items-center justify-center px-4 py-24 md:min-h-[50vh]">
        {showPriceBadge ? (
          <div
            className="absolute right-4 top-4 rounded-lg border border-gold/50 bg-black/60 px-4 py-2 text-center shadow-lg md:right-8 md:top-6"
            aria-label={
              priceAriaLabel ??
              (hasSimplePrice ? `Price ${formatCatalogPriceAmount(price!)} USD` : undefined)
            }
          >
            {priceBadge ?? (
              <>
                <span className="font-display text-2xl text-gold md:text-3xl">
                  {formatCatalogPriceAmount(price!)}
                </span>
                <span className="mt-0.5 block font-brand text-[10px] tracking-[0.2em] text-gold/80">
                  USD
                </span>
              </>
            )}
          </div>
        ) : null}
        <h1 className="max-w-3xl text-center font-display text-3xl text-gold md:text-5xl">{title}</h1>
      </div>
    </section>
  );
}
