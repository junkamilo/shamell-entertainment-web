"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";
import type { Experience } from "@/lib/experiencesData";
import { appendCatalogToContactHref, buildServiceInquireHref } from "@/lib/contactInquiryConstants";
import { cn } from "@/lib/utils";

type ExperienceCardProps = {
  experience: Experience;
  index?: number;
};

export default function ExperienceCard({ experience, index = 0 }: ExperienceCardProps) {
  const delayMs = Math.min(index, 8) * 110;
  const inquireHref = useMemo(
    () =>
      appendCatalogToContactHref(buildServiceInquireHref(experience.contactInquiryCode), "service", experience.id),
    [experience.contactInquiryCode, experience.id],
  );

  return (
    <article
      style={{ animationDelay: `${delayMs}ms` }}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl",
        "border border-gold/22 bg-[linear-gradient(195deg,rgba(18,14,22,0.97)_0%,rgba(8,7,10,0.99)_42%,rgba(3,2,4,1)_100%)]",
        "shadow-[0_18px_52px_rgba(0,0,0,0.58),inset_0_1px_0_rgba(255,255,255,0.04)]",
        "ring-1 ring-white/6",
        "animate-shamell-xp-curtain-in",
        "transition-[box-shadow,border-color,ring-color] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
        "hover:border-white/14 hover:shadow-[0_36px_90px_rgba(0,0,0,0.78),0_1px_0_rgba(255,255,255,0.06)_inset]",
        "hover:ring-white/10",
      )}
    >
      <div
        className="pointer-events-none absolute inset-px rounded-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        aria-hidden
      >
        <div className="absolute inset-0 rounded-2xl bg-[radial-gradient(120%_80%_at_50%_0%,rgba(255,255,255,0.06),transparent_55%)]" />
      </div>

      <span
        className="pointer-events-none absolute bottom-14 left-0 top-14 z-20 w-px bg-linear-to-b from-transparent via-white/18 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        aria-hidden
      />
      <span
        className="pointer-events-none absolute bottom-14 right-0 top-14 z-20 w-px bg-linear-to-b from-transparent via-white/18 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        aria-hidden
      />

      <div
        className={cn(
          "relative z-10 flex flex-1 flex-col transition-[transform] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform",
          "motion-reduce:transition-colors",
          "group-hover:transform-[perspective(1100px)_rotateX(3.5deg)_translateY(-10px)]",
          "motion-reduce:group-hover:transform-none",
        )}
      >
        <div className="relative isolate z-10 aspect-4/5 w-full overflow-hidden">
          <div className="pointer-events-none absolute inset-0 z-10 bg-[linear-gradient(180deg,transparent_40%,rgba(6,5,8,0.5)_70%,rgba(3,2,5,0.92)_100%)]" />
          <div className="pointer-events-none absolute inset-0 z-10 bg-[radial-gradient(ellipse_at_75%_20%,rgba(255,255,255,0.04),transparent_45%)] opacity-80 transition-opacity duration-500 group-hover:opacity-100" />

          <div
            className="pointer-events-none absolute inset-0 z-20 overflow-hidden opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            aria-hidden
          >
            <div className="animate-shamell-xp-spot-sweep absolute left-1/2 top-1/2 h-[190%] w-[75%] -translate-x-1/2 -translate-y-1/2 rounded-[100%] bg-[radial-gradient(ellipse_at_center,rgba(220,228,240,0.14),transparent_62%)] blur-lg" />
          </div>

          {typeof experience.image === "string" ? (
            <img
              src={experience.image}
              alt={`${experience.title} — special experience`}
              className="h-full w-full scale-100 object-cover transition-[transform,filter] duration-1100 ease-out group-hover:scale-[1.05] group-hover:brightness-[1.05] group-hover:-rotate-1 motion-reduce:group-hover:scale-100 motion-reduce:group-hover:rotate-0"
            />
          ) : (
            <Image
              src={experience.image}
              alt={`${experience.title} — special experience`}
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              className="object-cover transition-[transform,filter] duration-1100 ease-out group-hover:scale-[1.05] group-hover:brightness-[1.05] group-hover:-rotate-1 motion-reduce:group-hover:scale-100 motion-reduce:group-hover:rotate-0"
              priority={experience.slug === "fire"}
            />
          )}

          <div className="absolute bottom-0 left-0 right-0 z-30 flex items-end justify-between gap-3 border-t border-white/10 bg-[linear-gradient(180deg,rgba(10,8,12,0.35),rgba(6,5,8,0.92))] px-4 py-3 backdrop-blur-[3px] md:px-5 md:py-3.5">
            <h3 className="min-w-0 font-brand text-sm tracking-[0.22em] text-gold drop-shadow-[0_2px_14px_rgba(0,0,0,0.9)] transition-[letter-spacing,color] duration-500 group-hover:tracking-[0.26em] group-hover:text-gold-light md:text-base">
              {experience.title.toUpperCase()}
            </h3>
            <Link
              href={inquireHref}
              prefetch={false}
              className={cn(
                "relative shrink-0 overflow-hidden border border-white/20 bg-black/60 px-3.5 py-2 font-brand text-[10px] tracking-[0.18em] text-gold",
                "transition-all duration-300",
                "before:pointer-events-none before:absolute before:inset-0 before:-translate-y-full before:bg-[linear-gradient(180deg,transparent,rgba(255,255,255,0.12),transparent)] before:transition-transform before:duration-500",
                "hover:border-white/35 hover:text-gold-light group-hover:before:translate-y-full",
              )}
            >
              <span className="relative z-10">INQUIRE</span>
            </Link>
          </div>
        </div>

        <div className="relative z-10 flex flex-1 flex-col gap-5 border-t border-white/[0.07] bg-[linear-gradient(188deg,rgba(14,11,18,0.72),rgba(5,4,6,0.96))] p-5 md:p-6">
          <p className="font-body text-base leading-relaxed text-foreground/80 transition-colors duration-300 group-hover:text-foreground/92">
            {experience.description}
          </p>

          <div>
            <h4 className="relative mb-3 inline-block w-full text-center font-brand text-xs tracking-[0.26em] text-gold">
              <span className="relative z-10">ITEMS</span>
              <span
                className="absolute -bottom-1 left-1/2 h-px w-[85%] max-w-xs -translate-x-1/2 origin-center scale-x-0 bg-linear-to-r from-transparent via-white/35 to-transparent transition-transform duration-500 ease-out group-hover:scale-x-100"
                aria-hidden
              />
            </h4>
            <div className="relative pl-1">
              <span
                className="absolute bottom-1 left-[0.45rem] top-1.5 w-px origin-top scale-y-75 bg-linear-to-b from-white/5 via-white/22 to-white/5 opacity-90 transition-transform duration-500 group-hover:scale-y-100 group-hover:via-white/35"
                aria-hidden
              />
              <ul className="relative space-y-2.5">
                {experience.items.map((item, i) => (
                  <li
                    key={`${experience.id}-${i}`}
                    style={{ transitionDelay: `${i * 40}ms` }}
                    className="relative flex gap-2.5 pl-5 text-sm leading-snug text-foreground/68 transition-[transform,color] duration-300 group-hover:-translate-x-0.5 group-hover:text-foreground/88 motion-reduce:group-hover:translate-x-0"
                  >
                    <span className="absolute left-0 top-[0.35rem] text-[9px] text-gold/75 transition-transform duration-300 group-hover:-rotate-12 group-hover:text-gold/95">
                      ✦
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
