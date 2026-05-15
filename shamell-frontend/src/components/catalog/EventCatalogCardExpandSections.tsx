"use client";

import { ChevronDown } from "lucide-react";
import { useId, useState } from "react";
import { cn } from "@/lib/utils";

const expandButtonClass = cn(
  "inline-flex shrink-0 items-center gap-1 rounded-full border border-gold/30 bg-black/35 px-3 py-2 font-brand text-xs font-semibold text-gold/95 transition hover:border-gold/45 hover:text-gold md:px-3.5",
);

const sectionLabelClass =
  "relative mb-0 inline-block font-brand text-sm font-semibold tracking-[0.2em] text-gold/95 md:text-base md:tracking-[0.22em]";

type EventCatalogCardExpandSectionsProps = {
  description: string;
  eventTypes: string[];
  cardId: string;
};

/**
 * Shared expand panel for all event-type catalog cards (DESCRIPTION + EVENT TYPES).
 */
export function EventCatalogCardExpandSections({
  description,
  eventTypes,
  cardId,
}: EventCatalogCardExpandSectionsProps) {
  const [isDescriptionCollapsed, setIsDescriptionCollapsed] = useState(true);
  const [isTypesCollapsed, setIsTypesCollapsed] = useState(true);
  const descriptionPanelId = useId();
  const eventTypesPanelId = useId();

  return (
    <div className="mt-5 overflow-hidden rounded-xl border border-gold/28 bg-black/25 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
      <div className="border-b border-gold/15">
        <div className="flex items-center justify-between gap-3 px-4 py-3.5 md:px-5">
          <h4 className={sectionLabelClass}>DESCRIPTION</h4>
          <button
            type="button"
            onClick={() => setIsDescriptionCollapsed((prev) => !prev)}
            className={expandButtonClass}
            aria-expanded={!isDescriptionCollapsed}
            aria-controls={descriptionPanelId}
          >
            <span className="font-body text-xs font-semibold uppercase tracking-[0.12em]">
              {isDescriptionCollapsed ? "Expand" : "Collapse"}
            </span>
            <ChevronDown
              className={cn(
                "h-3.5 w-3.5 transition-transform motion-reduce:transition-none",
                !isDescriptionCollapsed && "rotate-180",
              )}
              strokeWidth={2}
              aria-hidden
            />
          </button>
        </div>
        <div
          id={descriptionPanelId}
          className={cn(
            "transition-all duration-300 motion-reduce:transition-none",
            isDescriptionCollapsed
              ? "max-h-0 overflow-hidden opacity-0"
              : "max-h-96 overflow-y-auto border-t border-gold/12 opacity-100",
          )}
        >
          <p className="px-4 py-3.5 font-body text-base font-medium leading-[1.7] text-foreground/88 md:px-5 md:text-lg md:leading-relaxed">
            {description}
          </p>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between gap-3 border-b border-gold/15 px-4 py-3.5 md:px-5">
          <h4 className={sectionLabelClass}>EVENT TYPES</h4>
          <button
            type="button"
            onClick={() => setIsTypesCollapsed((prev) => !prev)}
            className={expandButtonClass}
            aria-expanded={!isTypesCollapsed}
            aria-controls={eventTypesPanelId}
          >
            <span className="font-body text-xs font-semibold uppercase tracking-[0.12em]">
              {isTypesCollapsed ? "Expand" : "Collapse"}
            </span>
            <ChevronDown
              className={cn(
                "h-3.5 w-3.5 transition-transform motion-reduce:transition-none",
                !isTypesCollapsed && "rotate-180",
              )}
              strokeWidth={2}
              aria-hidden
            />
          </button>
        </div>
        <div
          id={eventTypesPanelId}
          className={cn(
            "relative transition-all duration-300 motion-reduce:transition-none",
            isTypesCollapsed ? "max-h-0 overflow-hidden opacity-0" : "max-h-88 overflow-y-auto opacity-100",
          )}
        >
          <span
            className="absolute bottom-1 left-[1.2rem] top-1 w-px bg-linear-to-b from-white/6 via-white/22 to-white/6 md:left-[1.45rem]"
            aria-hidden
          />
          <ul className="relative px-4 py-3.5 pl-6 md:px-5 md:pl-7">
            {eventTypes.map((item, i) => (
              <li
                key={`${cardId}-event-type-${i}`}
                className="relative flex gap-2.5 border-b border-white/6 py-2.5 pl-5 font-body text-base font-medium leading-snug text-foreground/85 first:pt-0 last:border-b-0 last:pb-0 md:text-lg md:leading-snug"
              >
                <span className="absolute left-0 top-[0.55rem] text-xs text-gold/85 md:top-[0.62rem]">✦</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
