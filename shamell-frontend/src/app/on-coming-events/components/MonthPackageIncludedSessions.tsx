"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMediaQuery } from "@/hooks/use-media-query";
import type { ClassSessionPublic } from "../services/fetchUpcomingClassSessions";
import { groupMonthSessionsByWeek } from "../lib/groupMonthSessionsByWeek";

type Props = {
  sessions: ClassSessionPublic[];
  monthIso: string;
  timezone: string;
};

function formatSessionDay(session: ClassSessionPublic) {
  return new Date(session.startsAt).toLocaleDateString("en-US", {
    weekday: "short",
    timeZone: session.timezone || "America/New_York",
  });
}

function formatSessionDate(session: ClassSessionPublic) {
  return new Date(session.startsAt).toLocaleDateString("en-US", {
    day: "2-digit",
    timeZone: session.timezone || "America/New_York",
  });
}

function formatSessionMonth(session: ClassSessionPublic) {
  return new Date(session.startsAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: session.timezone || "America/New_York",
  });
}

function formatSessionTime(session: ClassSessionPublic) {
  const start = new Date(session.startsAt).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: session.timezone || "America/New_York",
  });
  const end = new Date(session.endsAt).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: session.timezone || "America/New_York",
  });
  return `${start} - ${end}`;
}

export function MonthPackageIncludedSessions({
  sessions,
  monthIso,
  timezone,
}: Props) {
  const reduceMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const groups = useMemo(
    () => groupMonthSessionsByWeek(sessions, monthIso, timezone),
    [sessions, monthIso, timezone],
  );
  const [expandedWeeks, setExpandedWeeks] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (groups.length === 0) {
      setExpandedWeeks(new Set());
      return;
    }
    setExpandedWeeks(new Set([groups[0]!.weekIndex]));
  }, [groups]);

  const allExpanded =
    groups.length > 0 && groups.every((group) => expandedWeeks.has(group.weekIndex));

  const toggleWeek = (weekIndex: number) => {
    setExpandedWeeks((prev) => {
      const next = new Set(prev);
      if (next.has(weekIndex)) next.delete(weekIndex);
      else next.add(weekIndex);
      return next;
    });
  };

  const setAllExpanded = (value: boolean) => {
    if (!value) {
      setExpandedWeeks(new Set());
      return;
    }
    setExpandedWeeks(new Set(groups.map((group) => group.weekIndex)));
  };

  return (
    <div className="mt-2 space-y-2.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="rounded-full border border-gold/20 bg-black/35 px-2.5 py-0.5 text-[10px] tracking-[0.12em] text-foreground/75 uppercase">
            {sessions.length} class{sessions.length === 1 ? "" : "es"}
          </span>
          <span className="rounded-full border border-gold/20 bg-black/35 px-2.5 py-0.5 text-[10px] tracking-[0.12em] text-foreground/75 uppercase">
            {groups.length} week{groups.length === 1 ? "" : "s"}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setAllExpanded(!allExpanded)}
          className="rounded-full border border-gold/25 px-2.5 py-1 text-[10px] tracking-[0.12em] text-foreground/75 uppercase transition hover:border-gold/40 hover:text-gold"
        >
          {allExpanded ? "Collapse all" : "Expand all"}
        </button>
      </div>

      <div className="shamell-scrollbar max-h-[min(50vh,320px)] space-y-2 overflow-y-auto pr-1">
        {groups.map((group) => {
          const expanded = expandedWeeks.has(group.weekIndex);
          const panelId = `month-week-panel-${group.weekIndex}`;
          return (
            <section
              key={group.weekIndex}
              className="rounded-xl border border-gold/15 bg-black/25"
            >
              <button
                type="button"
                className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left"
                onClick={() => toggleWeek(group.weekIndex)}
                aria-expanded={expanded}
                aria-controls={panelId}
              >
                <div className="min-w-0">
                  <p className="font-brand text-xs tracking-[0.12em] text-gold uppercase">
                    {group.label}
                  </p>
                  <p className="text-xs text-foreground/65">
                    {group.dateRangeLabel} · {group.sessions.length} class
                    {group.sessions.length === 1 ? "" : "es"}
                  </p>
                </div>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 shrink-0 text-foreground/70 transition-transform",
                    expanded && "rotate-180 text-gold",
                    reduceMotion && "transition-none",
                  )}
                  aria-hidden
                />
              </button>

              <div
                id={panelId}
                className={cn(
                  "overflow-hidden px-2 pb-2 transition-all duration-300",
                  expanded ? "max-h-96 opacity-100" : "max-h-0 opacity-0",
                  reduceMotion && "transition-none",
                )}
              >
                <ul className="space-y-1.5">
                  {group.sessions.map((session) => (
                    <li
                      key={session.id}
                      className="grid grid-cols-[2.5rem,1fr] gap-2 rounded-lg border border-gold/15 bg-black/30 px-2.5 py-2"
                    >
                      <div className="rounded-md border border-gold/20 bg-black/40 px-1 py-1 text-center">
                        <p className="font-brand text-xs text-gold">
                          {formatSessionDate(session)}
                        </p>
                        <p className="text-[10px] text-foreground/65">
                          {formatSessionDay(session)}
                        </p>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm text-foreground/85">
                          {formatSessionMonth(session)}
                        </p>
                        <p className="text-sm text-foreground/80">
                          {formatSessionTime(session)}
                        </p>
                        {session.sectionLabel ? (
                          <p className="truncate text-xs text-foreground/60">
                            {session.sectionLabel}
                          </p>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
