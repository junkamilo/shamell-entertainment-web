"use client";

import { motion } from "motion/react";
import { CardMedia } from "@/components/media";
import { cn } from "@/lib/utils";
import type { FixedEventActivityPublic } from "../../services/fetchOnComingEventDetail";
import {
  nightRowCardClass,
  nightRowContainerClass,
  nightRowNeedsScroll,
} from "./nightExperienceRow";
import { resolveActivityAccent } from "./resolveActivityAccent";

type Props = {
  activities: FixedEventActivityPublic[];
  prefersReducedMotion?: boolean;
};

export function FixedEventActivitiesBanner({
  activities,
  prefersReducedMotion = false,
}: Props) {
  const sorted = [...activities].sort((a, b) => a.displayOrder - b.displayOrder);
  if (sorted.length === 0) return null;

  const count = sorted.length;
  const scrolls = nightRowNeedsScroll(count);

  return (
    <ol
      className={cn(nightRowContainerClass(count), "gap-5 md:gap-6")}
      data-scroll-row={scrolls ? "true" : "false"}
      aria-label="Activities"
    >
      {sorted.map((activity, index) => {
        const accent = resolveActivityAccent(activity.accentColor, index);
        const hasMedia = Boolean(activity.mediaUrl?.trim());
        const showText = activity.showText !== false;

        return (
          <motion.li
            key={activity.id}
            className={cn(
              nightRowCardClass(count),
              "relative list-none overflow-hidden rounded-xl",
              "min-h-[16rem] border border-gold/25 md:min-h-[20rem]",
              "shadow-[0_8px_24px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.04)]",
            )}
            initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{
              delay: index * 0.08,
              duration: 0.45,
              ease: [0.16, 1, 0.3, 1],
            }}
          >
            {hasMedia ? (
              <div className="absolute inset-0">
                <CardMedia
                  mediaType={activity.mediaType === "VIDEO" ? "VIDEO" : "IMAGE"}
                  imageUrl={
                    activity.mediaType === "VIDEO" ? null : activity.mediaUrl
                  }
                  videoUrl={
                    activity.mediaType === "VIDEO" ? activity.mediaUrl : null
                  }
                  posterUrl={
                    activity.mediaType === "VIDEO" ? activity.mediaUrl : null
                  }
                  alt={showText ? activity.title : ""}
                  className="h-full"
                  isActive
                  sizes="(max-width: 767px) 90vw, 33vw"
                />
              </div>
            ) : null}

            <div
              className="absolute inset-0"
              style={{
                background: hasMedia
                  ? showText
                    ? `linear-gradient(165deg, ${accent}aa 0%, ${accent}55 28%, #060504f5 72%, #040303fc 100%)`
                    : `linear-gradient(180deg, transparent 40%, ${accent}33 100%)`
                  : `linear-gradient(165deg, ${accent}f0 0%, ${accent}b0 38%, #0a0908 100%)`,
              }}
              aria-hidden
            />
            {!hasMedia ? (
              <div
                className="pointer-events-none absolute inset-0 bg-[radial-gradient(80%_60%_at_50%_20%,rgba(245,230,184,0.12),transparent_60%)]"
                aria-hidden
              />
            ) : null}

            {showText ? (
              <div className="relative z-[1] flex h-full min-h-[16rem] flex-col justify-end gap-3 p-5 md:min-h-[20rem] md:gap-4 md:p-6">
                <h3 className="font-brand text-xl uppercase tracking-[0.1em] text-gold line-clamp-3 md:text-2xl">
                  <span className="text-gold-light">{index + 1}. </span>
                  {activity.title}
                </h3>
                {activity.description ? (
                  <p className="font-body text-lg leading-relaxed text-foreground line-clamp-5 md:text-xl md:leading-relaxed">
                    {activity.description}
                  </p>
                ) : null}
              </div>
            ) : (
              <span className="sr-only">
                {index + 1}. {activity.title}
              </span>
            )}
          </motion.li>
        );
      })}
    </ol>
  );
}
