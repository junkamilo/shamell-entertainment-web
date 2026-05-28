"use client";

import { cn } from "@/lib/utils";
import RevealOnView from "@/components/shared/RevealOnView";
import type { OnComingEventSchedule } from "../services/fetchOnComingEventDetail";
import { parseScheduleViewModel } from "../lib/parseScheduleViewModel";
import { OnComingEventScheduleCalendar } from "./schedule/OnComingEventScheduleCalendar";
import { OnComingEventScheduleTimeArc } from "./schedule/OnComingEventScheduleTimeArc";

export function OnComingEventScheduleSection({
  schedule,
}: {
  schedule: OnComingEventSchedule | null;
}) {
  const model = parseScheduleViewModel(schedule);
  if (!model) return null;

  return (
    <RevealOnView className="mt-12" delay={60}>
      <article
        className={cn(
          "mx-auto max-w-4xl overflow-hidden rounded-2xl border border-gold/30",
          "bg-[linear-gradient(168deg,rgba(18,15,12,0.98)_0%,rgba(8,7,5,0.95)_48%,rgba(3,2,2,0.98)_100%)]",
          "shadow-[0_18px_56px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.04)]",
        )}
      >
        <h2 className="border-b border-gold/15 px-6 py-4 text-center font-brand text-xs tracking-[0.2em] text-gold/90">
          SCHEDULE
        </h2>

        <div className="grid gap-8 p-6 md:grid-cols-2 md:gap-6 md:p-8">
          <OnComingEventScheduleCalendar model={model} />
          <div className="md:border-l md:border-gold/10 md:pl-8">
            <OnComingEventScheduleTimeArc model={model} />
          </div>
        </div>

        <footer className="border-t border-gold/10 px-6 py-4 text-center">
          {model.humanLines.map((line) => (
            <p key={line} className="font-body text-sm text-foreground/75">
              {line}
            </p>
          ))}
          <p className="mt-2 text-xs text-gold/55">
            Times shown in {model.timezoneLabel}
          </p>
        </footer>
      </article>
    </RevealOnView>
  );
}
