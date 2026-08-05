"use client";

import Image from "next/image";
import { ShamellBackButton } from "@/components/shared";
import bailarinaLogo from "@/public/01_bailarina.png";

export function GalleryHero() {
  return (
    <>
      <Image
        src={bailarinaLogo}
        alt=""
        width={180}
        height={164}
        priority
        className="mx-auto mb-6 h-14 w-auto object-contain drop-shadow-[0_8px_26px_rgba(0,0,0,0.45)] sm:mb-7 sm:h-16"
        aria-hidden
      />

      <div className="relative mb-6 flex min-h-11 items-center justify-center sm:min-h-12">
        <nav className="absolute left-0 top-1/2 z-10 -translate-y-1/2" aria-label="Page navigation">
          <ShamellBackButton
            href="/#gallery"
            label="Back"
            hideLabelOnMobile
          />
        </nav>
        <h1 className="font-brand text-center text-2xl tracking-[0.2em] text-gold md:text-4xl">
          GALLERY
        </h1>
      </div>
    </>
  );
}
