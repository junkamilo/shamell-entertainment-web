"use client";

import Image from "next/image";
import Link from "next/link";
import { useId, useMemo, useState } from "react";
import { CatalogExpandRow } from "@/components/catalog/CatalogExpandRow";
import type { Experience } from "@/lib/experiencesData";
import { appendCatalogToContactHref, buildServiceInquireHref } from "@/lib/contactInquiryConstants";
import { serviceCatalogMediaTypeFromUrl } from "@/lib/serviceCatalogMedia";
import { cn } from "@/lib/utils";

type ExperienceCardProps = {
  experience: Experience;
  index?: number;
};

export default function ExperienceCard({ experience }: ExperienceCardProps) {
  const [isDescriptionCollapsed, setIsDescriptionCollapsed] = useState(true);
  const [isItemsCollapsed, setIsItemsCollapsed] = useState(true);
  const descriptionPanelId = useId();
  const itemsPanelId = useId();
  const inquireHref = useMemo(
    () =>
      appendCatalogToContactHref(buildServiceInquireHref(experience.contactInquiryCode), "service", experience.id),
    [experience.contactInquiryCode, experience.id],
  );

  const stringMediaUrl = typeof experience.image === "string" ? experience.image.trim() : "";
  const heroIsVideo =
    experience.heroMediaType === "VIDEO" ||
    (stringMediaUrl.length > 0 && serviceCatalogMediaTypeFromUrl(stringMediaUrl) === "VIDEO");

  return (
    <article
      className={cn(
        "@container group relative flex h-full flex-col overflow-hidden rounded-2xl",
        "border border-gold/22 bg-[linear-gradient(195deg,rgba(18,14,22,0.97)_0%,rgba(8,7,10,0.99)_42%,rgba(3,2,4,1)_100%)]",
        "shadow-[0_18px_52px_rgba(0,0,0,0.58),inset_0_1px_0_rgba(255,255,255,0.04)]",
        "ring-1 ring-white/6",
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
        <div className="relative isolate z-10 aspect-[3/4] w-full overflow-hidden @[300px]:aspect-4/5">
          <div className="pointer-events-none absolute inset-0 z-10 bg-[linear-gradient(180deg,transparent_40%,rgba(6,5,8,0.5)_70%,rgba(3,2,5,0.92)_100%)]" />
          <div className="pointer-events-none absolute inset-0 z-10 bg-[radial-gradient(ellipse_at_75%_20%,rgba(255,255,255,0.04),transparent_45%)] opacity-80 transition-opacity duration-500 group-hover:opacity-100" />

          <div
            className="pointer-events-none absolute inset-0 z-20 overflow-hidden opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            aria-hidden
          >
            <div className="animate-shamell-xp-spot-sweep absolute left-1/2 top-1/2 h-[190%] w-[75%] -translate-x-1/2 -translate-y-1/2 rounded-[100%] bg-[radial-gradient(ellipse_at_center,rgba(220,228,240,0.14),transparent_62%)] blur-lg" />
          </div>

          {typeof experience.image === "string" ? (
            heroIsVideo ? (
              <video
                src={experience.image}
                className="h-full w-full scale-100 object-cover transition-[transform,filter] duration-1100 ease-out group-hover:scale-[1.05] group-hover:brightness-[1.05] group-hover:-rotate-1 motion-reduce:group-hover:scale-100 motion-reduce:group-hover:rotate-0"
                muted
                playsInline
                loop
                autoPlay
                aria-label={`${experience.title} — video preview`}
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={experience.image}
                alt={`${experience.title} — special experience`}
                className="h-full w-full scale-100 object-cover transition-[transform,filter] duration-1100 ease-out group-hover:scale-[1.05] group-hover:brightness-[1.05] group-hover:-rotate-1 motion-reduce:group-hover:scale-100 motion-reduce:group-hover:rotate-0"
              />
            )
          ) : (
            <Image
              src={experience.image}
              alt={`${experience.title} — special experience`}
              fill
              sizes="(max-width: 1023px) 92vw, (max-width: 1279px) 50vw, 33vw"
              className="object-cover transition-[transform,filter] duration-1100 ease-out group-hover:scale-[1.05] group-hover:brightness-[1.05] group-hover:-rotate-1 motion-reduce:group-hover:scale-100 motion-reduce:group-hover:rotate-0"
              priority={experience.slug === "fire"}
            />
          )}

          <div className="absolute bottom-0 left-0 right-0 z-30 border-t border-white/10 bg-[linear-gradient(180deg,rgba(10,8,12,0.35),rgba(6,5,8,0.92))] px-4 py-3 backdrop-blur-[3px] lg:px-5 lg:py-3.5">
            <h3 className="text-balance font-brand text-sm font-semibold leading-snug tracking-[0.14em] text-gold drop-shadow-[0_2px_14px_rgba(0,0,0,0.9)] transition-[letter-spacing,color] duration-500 group-hover:text-gold-light lg:text-base lg:tracking-[0.18em] xl:text-lg xl:tracking-[0.22em]">
              {experience.title.toUpperCase()}
            </h3>
          </div>
        </div>

        <div className="relative z-10 flex flex-1 flex-col gap-4 border-t border-white/[0.07] bg-[linear-gradient(188deg,rgba(14,11,18,0.72),rgba(5,4,6,0.96))] p-4 lg:gap-5 lg:p-5 xl:p-6">
          <div className="mb-0 shrink-0">
            <CatalogExpandRow
              label="DESCRIPTION"
              expanded={!isDescriptionCollapsed}
              onToggle={() => setIsDescriptionCollapsed((prev) => !prev)}
              controlsId={descriptionPanelId}
              showLabelHoverLine
            />
            <div
              id={descriptionPanelId}
              className={cn(
                "relative mt-4 transition-all duration-300 motion-reduce:transition-none",
                isDescriptionCollapsed
                  ? "max-h-0 overflow-hidden opacity-0"
                  : "max-h-96 overflow-y-auto pr-1 opacity-100",
              )}
            >
              <p className="font-body text-base font-medium leading-relaxed text-foreground/88 transition-colors duration-300 group-hover:text-foreground/95 lg:text-lg lg:leading-relaxed">
                {experience.description}
              </p>
            </div>
          </div>

          <div className="mb-0 min-h-0 flex-1">
            <CatalogExpandRow
              label="ITEMS"
              expanded={!isItemsCollapsed}
              onToggle={() => setIsItemsCollapsed((prev) => !prev)}
              controlsId={itemsPanelId}
              showLabelHoverLine
            />
            <div
              id={itemsPanelId}
              className={cn(
                "relative mt-4 pl-1 transition-all duration-300 motion-reduce:transition-none",
                isItemsCollapsed ? "max-h-0 overflow-hidden opacity-0" : "max-h-88 overflow-y-auto pr-1 opacity-100",
              )}
            >
              <span
                className="absolute bottom-1 left-[0.45rem] top-1 w-px bg-linear-to-b from-white/5 via-white/22 to-white/5 opacity-90 transition-all duration-500 group-hover:via-white/35"
                aria-hidden
              />
              <ul className="relative">
                {experience.items.map((item, i) => (
                  <li
                    key={`${experience.id}-${i}`}
                    style={{ transitionDelay: `${i * 40}ms` }}
                    className="relative flex gap-2.5 border-b border-white/6 py-2.5 pl-5 text-base font-medium leading-snug text-foreground/85 transition-[transform,color] duration-300 first:pt-0 last:border-b-0 last:pb-0 group-hover:-translate-x-0.5 group-hover:text-foreground/92 motion-reduce:group-hover:translate-x-0 lg:text-lg lg:leading-snug"
                  >
                    <span className="absolute left-0 top-[0.45rem] text-xs text-gold/80 transition-transform duration-300 group-hover:-rotate-12 group-hover:text-gold/95 lg:top-2">
                      ✦
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="relative z-10 mt-auto shrink-0 border-t border-white/[0.07] pt-4 lg:pt-5">
            <Link
              href={inquireHref}
              prefetch={false}
              className={cn(
                "relative flex w-full min-w-0 items-center justify-center overflow-hidden border border-white/20 bg-black/60 px-3 py-3 font-brand text-xs font-semibold tracking-[0.14em] text-gold lg:px-4 lg:tracking-[0.16em] xl:tracking-[0.18em]",
                "transition-all duration-300",
                "before:pointer-events-none before:absolute before:inset-0 before:-translate-y-full before:bg-[linear-gradient(180deg,transparent,rgba(255,255,255,0.12),transparent)] before:transition-transform before:duration-500",
                "hover:border-white/35 hover:text-gold-light group-hover:before:translate-y-full",
              )}
            >
              <span className="relative z-10">INQUIRE</span>
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
