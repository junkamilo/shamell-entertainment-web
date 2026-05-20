"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import RevealFromDepth from "@/components/shared/RevealFromDepth";
import bailarinaLogo from "@/public/01_bailarina.png";

const gateCards = [
  {
    href: "/contacto?mode=booking",
    eyebrow: "Ready to inquire",
    title: "I know the experience I want",
    body: "Continue to the full booking inquiry for Private Galas, VIP Events, or Bespoke collaborations.",
    cta: "Start booking inquiry",
  },
  {
    href: "/contacto?mode=concierge",
    eyebrow: "Concierge guidance",
    title: "Guide me toward the right experience",
    body: "Share your vision and Shamell's team will recommend the best direction before you reserve.",
    cta: "Start concierge inquiry",
  },
];

export default function ConciergeGate() {
  return (
    <div className="mx-auto max-w-5xl pt-8 text-center sm:pt-10">
      <RevealFromDepth delay={0}>
        <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center sm:h-24 sm:w-24">
          <Image
            src={bailarinaLogo}
            alt="Shamell bailarina"
            className="h-full w-auto object-contain drop-shadow-[0_0_18px_rgba(197,165,90,0.18)]"
            priority
          />
        </div>
      </RevealFromDepth>
      <RevealFromDepth delay={110}>
        <p className="mb-3 font-brand text-xs tracking-[0.28em] text-gold/80 uppercase">
          Begin your Shamell experience
        </p>
      </RevealFromDepth>
      <RevealFromDepth delay={220}>
        <h1 className="mx-auto max-w-3xl font-brand text-3xl tracking-[0.14em] text-gold uppercase md:text-5xl">
          How clear is your vision?
        </h1>
      </RevealFromDepth>
      <RevealFromDepth delay={340}>
        <p className="mx-auto mt-5 max-w-2xl px-1 font-elegant text-xl leading-[1.65] text-foreground/88 sm:text-2xl sm:leading-relaxed md:text-3xl">
          Every celebration is different. Tell us whether you are ready to request a specific
          experience, or if you would like Shamell&apos;s team to guide the first step.
        </p>
      </RevealFromDepth>

      <div className="mt-10 grid gap-4 text-left md:grid-cols-2">
        {gateCards.map((card, index) => (
          <RevealFromDepth key={card.href} delay={480 + index * 120} className="h-full">
            <Link
              href={card.href}
              className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-gold/25 bg-black/35 p-6 sm:p-7 transition-all duration-300 hover:-translate-y-1 hover:border-gold/60 hover:bg-gold/8 hover:shadow-[0_22px_55px_rgba(0,0,0,0.35)]"
            >
              <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-gold/60 to-transparent opacity-60" />
              <p className="font-brand text-xs tracking-[0.2em] text-gold/80 uppercase sm:text-sm">
                {card.eyebrow}
              </p>
              <h2 className="mt-3 font-brand text-[1.65rem] leading-snug tracking-[0.06em] text-gold-light uppercase sm:mt-4 sm:text-3xl md:text-[2rem]">
                {card.title}
              </h2>
              <p className="mt-4 font-body text-2xl leading-[1.6] text-foreground/90 sm:text-[1.75rem] sm:leading-relaxed md:text-3xl">
                {card.body}
              </p>
              <span className="mt-6 inline-flex items-center gap-2 font-brand text-sm tracking-[0.14em] text-gold uppercase sm:text-base">
                {card.cta}
                <ArrowRight className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-1 sm:h-5 sm:w-5" aria-hidden />
              </span>
            </Link>
          </RevealFromDepth>
        ))}
      </div>

      <RevealFromDepth delay={740}>
        <p className="mx-auto mt-8 max-w-xl font-body text-xs leading-relaxed text-foreground/45">
          If you selected a service or event from the site, we will take you directly to the matching
          inquiry details.
        </p>
      </RevealFromDepth>
    </div>
  );
}
