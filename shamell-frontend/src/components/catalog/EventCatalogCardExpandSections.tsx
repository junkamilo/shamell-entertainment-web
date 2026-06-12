"use client";

import { useId, useState } from "react";
import { CatalogExpandRow } from "@/components/catalog/CatalogExpandRow";
import { cn } from "@/lib/utils";

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
    <div className="mt-4 overflow-hidden rounded-xl border border-gold/28 bg-black/25 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] lg:mt-5">
      <div className="border-b border-gold/15">
        <div className="px-3 py-3 lg:px-4 lg:py-3.5 xl:px-5">
          <CatalogExpandRow
            label="DESCRIPTION"
            expanded={!isDescriptionCollapsed}
            onToggle={() => setIsDescriptionCollapsed((prev) => !prev)}
            controlsId={descriptionPanelId}
          />
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
          <p className="px-3 py-3 font-body text-base font-medium leading-[1.7] text-foreground/88 lg:px-4 lg:py-3.5 lg:text-lg lg:leading-relaxed xl:px-5">
            {description}
          </p>
        </div>
      </div>

      <div>
        <div className="border-b border-gold/15 px-3 py-3 lg:px-4 lg:py-3.5 xl:px-5">
          <CatalogExpandRow
            label="EVENT TYPES"
            expanded={!isTypesCollapsed}
            onToggle={() => setIsTypesCollapsed((prev) => !prev)}
            controlsId={eventTypesPanelId}
          />
        </div>
        <div
          id={eventTypesPanelId}
          className={cn(
            "relative transition-all duration-300 motion-reduce:transition-none",
            isTypesCollapsed ? "max-h-0 overflow-hidden opacity-0" : "max-h-88 overflow-y-auto opacity-100",
          )}
        >
          <span
            className="absolute bottom-1 left-[1.2rem] top-1 w-px bg-linear-to-b from-white/6 via-white/22 to-white/6 lg:left-[1.45rem]"
            aria-hidden
          />
          <ul className="relative px-3 py-3 pl-5 lg:px-4 lg:py-3.5 lg:pl-6 xl:px-5 xl:pl-7">
            {eventTypes.map((item, i) => (
              <li
                key={`${cardId}-event-type-${i}`}
                className="relative flex gap-2.5 border-b border-white/6 py-2.5 pl-5 font-body text-base font-medium leading-snug text-foreground/85 first:pt-0 last:border-b-0 last:pb-0 lg:text-lg lg:leading-snug"
              >
                <span className="absolute left-0 top-[0.55rem] text-xs text-gold/85 lg:top-[0.62rem]">✦</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
