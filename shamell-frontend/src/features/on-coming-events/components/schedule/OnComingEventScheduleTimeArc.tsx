"use client";

import { type ReactNode } from "react";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScheduleTimeGauge } from "./ScheduleTimeGauge";
import { formatDateDisplayUs } from "@/lib/contactLogisticsUtils";
import type { ScheduleViewModel } from "../../lib/parseScheduleViewModel";

function formatMinutesRange(start: number, end: number): string {
  const fmt = (m: number) => {
    const d = new Date();
    d.setHours(Math.floor(m / 60), m % 60, 0, 0);
    return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  };
  return `${fmt(start)} – ${fmt(end)}`;
}

function InfoBlock({
  title,
  children,
  className,
  mobileSlide = false,
}: {
  title: string;
  children: ReactNode;
  className?: string;
  mobileSlide?: boolean;
}) {
  return (
    <section className={cn("space-y-2", mobileSlide && "space-y-2.5", className)}>
      <h3
        className={cn(
          "font-brand tracking-[0.16em] text-gold/85 uppercase",
          mobileSlide ? "text-sm" : "text-[10px] sm:text-xs",
        )}
      >
        {title}
      </h3>
      {children}
    </section>
  );
}

function ScheduleInfoPanel({
  model,
  className,
  mobileSlide = false,
}: {
  model: ScheduleViewModel;
  className?: string;
  mobileSlide?: boolean;
}) {
  const bodyText = mobileSlide ? "font-body text-base leading-relaxed text-foreground/88" : "font-body text-sm text-foreground/88 sm:text-base";
  const footerText = mobileSlide ? "font-body text-sm text-gold/75" : "font-body text-xs text-gold/75 sm:text-sm";
  const panelPad = mobileSlide ? "p-5 gap-5" : "p-4 sm:gap-6 sm:p-5";
  if (model.mode === "FIXED_EVENT") {
    return (
      <div
        className={cn(
          "flex w-full flex-col rounded-xl border border-gold/15 bg-black/20",
          panelPad,
          className,
        )}
      >
        {model.salesWindow ? (
          <InfoBlock title="Ticket sales" mobileSlide={mobileSlide}>
            <p className={bodyText}>
              {formatDateDisplayUs(model.salesWindow.start)} –{" "}
              {formatDateDisplayUs(model.salesWindow.end)}
            </p>
          </InfoBlock>
        ) : null}
        {model.eventDate ? (
          <InfoBlock title="Event date" mobileSlide={mobileSlide}>
            <p className={bodyText}>
              {formatDateDisplayUs(model.eventDate)}
            </p>
          </InfoBlock>
        ) : null}
        {model.timeRangeLabel ? (
          <InfoBlock title="Show time" mobileSlide={mobileSlide}>
            <p className={bodyText}>
              {model.timeRangeLabel}
              {model.durationLabel ? ` (${model.durationLabel})` : ""}
            </p>
          </InfoBlock>
        ) : null}
        <p className={cn("border-t border-gold/10 pt-3", footerText)}>
          Times shown in {model.timezoneLabel}
        </p>
      </div>
    );
  }

  const weekdayLine =
    model.daySummaries.length > 0 ?
      model.daySummaries
        .map((d) => `${d.label} (${d.sectionCount} section${d.sectionCount === 1 ? "" : "s"})`)
        .join(" · ")
    : null;

  return (
    <div
      className={cn(
        "flex w-full flex-col rounded-xl border border-gold/15 bg-black/20",
        panelPad,
        className,
      )}
    >
      {weekdayLine ? (
        <InfoBlock title="Classes by day" mobileSlide={mobileSlide}>
          <p className={cn(bodyText, "leading-relaxed")}>{weekdayLine}</p>
        </InfoBlock>
      ) : null}

      {model.timeArcs.length > 0 ? (
        <InfoBlock title="Sessions & times" mobileSlide={mobileSlide}>
          <ul className={cn("space-y-2", mobileSlide && "space-y-2.5")}>
            {model.timeArcs.map((arc) => (
              <li
                key={`${arc.startMinutes}-${arc.endMinutes}-${arc.label ?? "slot"}`}
                className="flex flex-wrap items-baseline gap-x-2 gap-y-1"
              >
                {arc.label ? (
                  <span
                    className={cn(
                      "font-brand tracking-wide text-gold",
                      mobileSlide ? "text-base" : "text-xs sm:text-sm",
                    )}
                  >
                    {arc.label}
                  </span>
                ) : null}
                <span
                  className={
                    mobileSlide ?
                      "font-body text-base text-foreground/85"
                    : "font-body text-sm text-foreground/85 sm:text-base"
                  }
                >
                  {formatMinutesRange(arc.startMinutes, arc.endMinutes)}
                </span>
              </li>
            ))}
          </ul>
        </InfoBlock>
      ) : null}

      <InfoBlock title="Weekly schedule" mobileSlide={mobileSlide}>
        <ul className={cn(bodyText, "space-y-2")}>
          {model.anchorDate ? (
            <li>
              <span className="text-foreground/55">Starts: </span>
              {formatDateDisplayUs(model.anchorDate)}
            </li>
          ) : null}
          {model.daySummaries.length > 0 ? (
            <li>
              <span className="text-foreground/55">Active days: </span>
              {model.daySummaries.map((d) => d.label).join(", ")}
            </li>
          ) : null}
          {model.timeArcs.length > 1 ? (
            <li>
              <span className="text-foreground/55">Offer: </span>
              {model.timeArcs.length} time sections across the week
            </li>
          ) : null}
        </ul>
      </InfoBlock>

      <p className={cn("border-t border-gold/10 pt-3", footerText)}>
        Times shown in {model.timezoneLabel}
      </p>
    </div>
  );
}

type Props = {
  model: ScheduleViewModel;
  mobileSlide?: boolean;
};

export function OnComingEventScheduleTimeArc({ model, mobileSlide = false }: Props) {
  const arcs =
    model.timeArcs.length > 0
      ? model.timeArcs
      : model.startMinutes != null &&
          model.endMinutes != null &&
          model.endMinutes > model.startMinutes
        ? [
            {
              startMinutes: model.startMinutes,
              endMinutes: model.endMinutes,
              label: null,
            },
          ]
        : [];

  const hasTime = arcs.length > 0;

  return (
    <div
      className={cn(
        "flex h-full w-full flex-col",
        mobileSlide && "min-h-[min(68dvh,26rem)] justify-center py-2",
      )}
      aria-label="Event time and details"
    >
      <p
        className={cn(
          "mb-4 font-brand tracking-[0.14em] text-gold/80",
          mobileSlide ? "text-sm" : "text-xs",
        )}
      >
        TIME
      </p>

      {!hasTime ? (
        <div className="flex flex-col gap-5">
          <div className="flex flex-col items-center justify-center py-4">
            <Clock className="mb-3 h-10 w-10 text-gold/25" strokeWidth={1.2} aria-hidden />
            <p className="font-body text-sm text-foreground/60">Time to be announced</p>
          </div>
          <ScheduleInfoPanel model={model} className="w-full" mobileSlide={mobileSlide} />
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          <div className="flex w-full flex-col items-center">
            <ScheduleTimeGauge
              arcs={arcs}
              durationTotalMinutes={model.durationTotalMinutes}
              durationLabel={model.durationLabel}
              timeRangeLabel={model.timeRangeLabel}
              mobileSlide={mobileSlide}
            />
          </div>

          <ScheduleInfoPanel model={model} className="w-full" mobileSlide={mobileSlide} />
        </div>
      )}
    </div>
  );
}
