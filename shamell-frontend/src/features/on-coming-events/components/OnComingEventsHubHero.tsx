"use client";

import Image from "next/image";
import bailarinaLogo from "@/public/01_bailarina.png";
import { ShamellBackButton } from "@/components/shared/ShamellBackButton";

type Props = {
  onBackNavigateStart?: () => void;
};

export function OnComingEventsHubHero({ onBackNavigateStart }: Props) {
  return (
    <header className="relative mb-10">
      <nav className="mb-6 md:mb-8" aria-label="Page navigation">
        <ShamellBackButton
          href="/"
          label="Back"
          hideLabelOnMobile
          onNavigateStart={onBackNavigateStart}
        />
      </nav>

      <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center sm:mb-8 sm:h-28 sm:w-28 md:h-32 md:w-32">
        <Image
          src={bailarinaLogo}
          alt="Shamell bailarina"
          width={180}
          height={164}
          priority
          className="h-full w-auto object-contain drop-shadow-[0_0_18px_rgba(197,165,90,0.18)]"
        />
      </div>

      <h1 className="mt-2 text-center font-brand text-2xl font-semibold tracking-[0.14em] text-gold md:mt-3 md:text-4xl">
        ON COMING EVENTS
      </h1>
    </header>
  );
}
