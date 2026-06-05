"use client";

import { cn } from "@/lib/utils";
import RevealOnView from "@/components/shared/RevealOnView";
import type { OnComingEventSchedule } from "../services/fetchOnComingEventDetail";
import { parseScheduleViewModel } from "../lib/parseScheduleViewModel";
import { OnComingEventScheduleCalendar } from "./schedule/OnComingEventScheduleCalendar";
import { OnComingEventScheduleTimeArc } from "./schedule/OnComingEventScheduleTimeArc";
import { ScheduleMobileSwipePanels } from "./schedule/ScheduleMobileSwipePanels";

export function OnComingEventScheduleSection({
  schedule,
  calendarBookable,
  onCalendarDateClick,
}: {
  schedule: OnComingEventSchedule | null;
  calendarBookable?: boolean;
  onCalendarDateClick?: (iso: string) => void;
}) {
  const model = parseScheduleViewModel(schedule);
  if (!model) return null;

  return (
    <RevealOnView
      className="mt-12 w-full min-w-0 max-w-full overflow-x-hidden px-4 pb-36 sm:px-6 md:pb-40 lg:px-8"
      delay={60}
    >
      <article
        className={cn(
          "mx-auto w-full min-w-0 max-w-7xl overflow-hidden rounded-2xl border border-gold/30",
          "bg-[linear-gradient(168deg,rgba(18,15,12,0.98)_0%,rgba(8,7,5,0.95)_48%,rgba(3,2,2,0.98)_100%)]",
          "shadow-[0_18px_56px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.04)]",
        )}
      >
        <h2 className="border-b border-gold/15 px-4 py-3 text-center font-brand text-xs tracking-[0.2em] text-gold/90 md:px-6">
          SCHEDULE
        </h2>

        {/* Mobile: one full-width panel per swipe (calendar | time + info) */}
        <div className="min-w-0 p-4 md:hidden">
          <ScheduleMobileSwipePanels
            calendar={
              <OnComingEventScheduleCalendar
                model={model}
                bookable={calendarBookable}
                onDateClick={onCalendarDateClick}
                mobileSlide
              />
            }
            timePanel={<OnComingEventScheduleTimeArc model={model} mobileSlide />}
          />
        </div>

        {/* Tablet/desktop: side-by-side grid */}
        <div className="hidden gap-5 p-4 md:grid md:grid-cols-2 md:items-center md:gap-8 md:p-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:gap-10 lg:p-8">
          <OnComingEventScheduleCalendar
            model={model}
            bookable={calendarBookable}
            onDateClick={onCalendarDateClick}
          />
          <div className="border-l border-gold/10 pl-6 lg:pl-8">
            <OnComingEventScheduleTimeArc model={model} />
          </div>
        </div>
      </article>
    </RevealOnView>
  );
}
