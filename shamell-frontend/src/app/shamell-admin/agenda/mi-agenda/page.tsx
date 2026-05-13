"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Clock3, MapPin, Package, UserRound } from "lucide-react";
import AdminBackButton from "@/components/admin/AdminBackButton";
import AdminModal from "@/components/admin/AdminModal";
import AdminModuleHero from "@/components/admin/AdminModuleHero";
import ShamellTime12hColumns from "@/components/ShamellTime12hColumns";
import { hhmmToMinutes, hhmmToParts, partsToHHMM } from "@/components/contact/contactLogisticsUtils";
import { useAdminBookings, type AdminBookingRow } from "@/hooks/use-admin-bookings";
import { toast } from "@/hooks/use-toast";
import { utcInstantForWallClock } from "@/lib/bookingAvailability";
import { bookingServiceChip, bookingServiceDisplayLine } from "@/lib/adminBookingDisplay";

type ViewMode = "day" | "week" | "month";
type EnrichedBooking = AdminBookingRow & { dateIso: string; start: string; end: string; startM: number; durationM: number };

const WEEKDAY_SHORT = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
const RANGE_LABEL = new Intl.DateTimeFormat("en-US", { dateStyle: "medium" });
const MONTH_LABEL = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" });
const DAY_NUMBER_LABEL = new Intl.DateTimeFormat("en-US", { day: "numeric" });

function bookingTimeZone() {
  return process.env.NEXT_PUBLIC_BOOKING_TZ ?? "America/New_York";
}

function isoFromTzDate(date: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const year = parts.find((p) => p.type === "year")?.value ?? "1970";
  const month = parts.find((p) => p.type === "month")?.value ?? "01";
  const day = parts.find((p) => p.type === "day")?.value ?? "01";
  return `${year}-${month}-${day}`;
}

function addDaysIso(iso: string, days: number): string {
  const base = new Date(`${iso}T00:00:00Z`);
  base.setUTCDate(base.getUTCDate() + days);
  return base.toISOString().slice(0, 10);
}

function mondayStartIso(iso: string): string {
  const d = new Date(`${iso}T12:00:00Z`);
  const dow = d.getUTCDay();
  const offset = dow === 0 ? -6 : 1 - dow;
  return addDaysIso(iso, offset);
}

function monthStartIso(iso: string): string {
  const d = new Date(`${iso}T12:00:00Z`);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-01`;
}

function monthEndIso(iso: string): string {
  const start = new Date(`${monthStartIso(iso)}T12:00:00Z`);
  const end = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 0, 12, 0, 0, 0));
  return end.toISOString().slice(0, 10);
}

function shiftAnchor(iso: string, mode: ViewMode, delta: number): string {
  if (mode === "week") return addDaysIso(iso, 7 * delta);
  if (mode === "day") return addDaysIso(iso, delta);
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() + delta);
  return d.toISOString().slice(0, 10);
}

function hhmmFromEventDate(eventDate: string, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date(eventDate));
  const hour = parts.find((p) => p.type === "hour")?.value ?? "00";
  const minute = parts.find((p) => p.type === "minute")?.value ?? "00";
  return `${hour}:${minute}`;
}

function displayName(row: AdminBookingRow): string {
  return row.user?.fullName?.trim() || row.guestFullName?.trim() || "Unnamed guest";
}

function readBookingTime(row: AdminBookingRow, timeZone: string): { start: string; end: string } {
  const details = row.bookingDetails && typeof row.bookingDetails === "object" ? row.bookingDetails : null;
  const startFromDetails =
    details && typeof details.eventTimeStart === "string" && /^\d{2}:\d{2}$/.test(details.eventTimeStart.trim())
      ? details.eventTimeStart.trim()
      : "";
  const endFromDetails =
    details && typeof details.eventTimeEnd === "string" && /^\d{2}:\d{2}$/.test(details.eventTimeEnd.trim())
      ? details.eventTimeEnd.trim()
      : "";
  const start = startFromDetails || hhmmFromEventDate(row.eventDate, timeZone);
  const end = endFromDetails || start;
  return { start, end };
}

function eventTypeLabel(row: AdminBookingRow): string {
  return row.event?.name || row.eventType?.name || row.occasionType?.name || "—";
}

function eventChipLabel(row: AdminBookingRow): string {
  return bookingServiceChip(row);
}

function durationLabel(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h <= 0) return `${m}m`;
  if (m <= 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export default function MiAgendaPage() {
  const tz = useMemo(() => bookingTimeZone(), []);
  const todayIso = useMemo(() => isoFromTzDate(new Date(), tz), [tz]);
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [anchorIso, setAnchorIso] = useState(todayIso);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [savingCancel, setSavingCancel] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [editDateIso, setEditDateIso] = useState("");
  const [editStart, setEditStart] = useState("");
  const [editEnd, setEditEnd] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editNotes, setEditNotes] = useState("");

  const range = useMemo(() => {
    if (viewMode === "day") return { fromIso: anchorIso, toIso: anchorIso };
    if (viewMode === "week") {
      const fromIso = mondayStartIso(anchorIso);
      return { fromIso, toIso: addDaysIso(fromIso, 6) };
    }
    const fromIso = monthStartIso(anchorIso);
    return { fromIso, toIso: monthEndIso(anchorIso) };
  }, [anchorIso, viewMode]);

  const { bookings, isLoading, error, patchBooking } = useAdminBookings(true, {
    status: "CONFIRMED",
    from: `${range.fromIso}T00:00:00.000Z`,
    to: `${range.toIso}T23:59:59.999Z`,
  });

  const items = useMemo<EnrichedBooking[]>(
    () =>
      bookings
        .map((row) => {
          const dateIso = isoFromTzDate(new Date(row.eventDate), tz);
          const { start, end } = readBookingTime(row, tz);
          const startM = hhmmToMinutes(start) ?? 0;
          const endM = hhmmToMinutes(end) ?? startM;
          const durationM = Math.max(endM - startM, 0);
          return { ...row, dateIso, start, end, startM, durationM };
        })
        .sort((a, b) => (a.dateIso === b.dateIso ? a.startM - b.startM : a.dateIso.localeCompare(b.dateIso))),
    [bookings, tz],
  );

  const byDate = useMemo(() => {
    const map = new Map<string, EnrichedBooking[]>();
    for (const item of items) {
      if (!map.has(item.dateIso)) map.set(item.dateIso, []);
      map.get(item.dateIso)?.push(item);
    }
    return map;
  }, [items]);

  const weekDays = useMemo(() => {
    const monday = mondayStartIso(anchorIso);
    return Array.from({ length: 7 }, (_, i) => addDaysIso(monday, i));
  }, [anchorIso]);

  const monthGrid = useMemo(() => {
    const start = monthStartIso(anchorIso);
    const gridStart = mondayStartIso(start);
    return Array.from({ length: 42 }, (_, i) => addDaysIso(gridStart, i));
  }, [anchorIso]);

  const selected = useMemo(() => items.find((x) => x.id === selectedId) ?? null, [items, selectedId]);

  useEffect(() => {
    if (!selected) {
      setIsEditing(false);
      return;
    }
    const details =
      selected.bookingDetails && typeof selected.bookingDetails === "object"
        ? (selected.bookingDetails as Record<string, unknown>)
        : {};
    setEditDateIso(selected.dateIso);
    setEditStart(typeof details.eventTimeStart === "string" ? details.eventTimeStart : selected.start);
    setEditEnd(typeof details.eventTimeEnd === "string" ? details.eventTimeEnd : selected.end);
    setEditLocation(selected.location ?? "");
    setEditNotes(selected.notes ?? "");
  }, [selected]);

  const rangeText = useMemo(() => {
    if (viewMode === "day") return RANGE_LABEL.format(new Date(`${anchorIso}T12:00:00Z`));
    if (viewMode === "week") {
      return `${RANGE_LABEL.format(new Date(`${range.fromIso}T12:00:00Z`))} - ${RANGE_LABEL.format(new Date(`${range.toIso}T12:00:00Z`))}`;
    }
    return MONTH_LABEL.format(new Date(`${monthStartIso(anchorIso)}T12:00:00Z`));
  }, [anchorIso, range.fromIso, range.toIso, viewMode]);

  const onSaveEdit = async () => {
    if (!selected) return;
    const startM = hhmmToMinutes(editStart);
    const endM = hhmmToMinutes(editEnd);
    if (startM === null || endM === null || endM <= startM) {
      toast({
        title: "Invalid time range",
        description: "End time must be after start time.",
        variant: "destructive",
      });
      return;
    }
    setSavingEdit(true);
    try {
      const eventDate = utcInstantForWallClock(editDateIso, startM, tz).toISOString();
      const details =
        selected.bookingDetails && typeof selected.bookingDetails === "object"
          ? { ...(selected.bookingDetails as Record<string, unknown>) }
          : {};
      details.eventTimeStart = editStart;
      details.eventTimeEnd = editEnd;
      await patchBooking(selected.id, {
        eventDate,
        location: editLocation.trim(),
        notes: editNotes.trim(),
        bookingDetails: details,
      });
      setIsEditing(false);
      toast({ title: "Booking updated" });
    } catch (err) {
      toast({
        title: "Could not update",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSavingEdit(false);
    }
  };

  const onCancelBooking = async () => {
    if (!selected) return;
    setSavingCancel(true);
    try {
      await patchBooking(selected.id, { status: "CANCELLED" });
      setSelectedId(null);
      setIsEditing(false);
      toast({ title: "Booking canceled" });
    } catch (err) {
      toast({
        title: "Could not cancel",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSavingCancel(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-7xl">
      <AdminBackButton href="/shamell-admin/agenda" label="Back" className="mb-4" />
      <AdminModuleHero
        title="My calendar"
        bordered={false}
      />

      <section className="shamell-glass-surface rounded-2xl p-4 md:p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-gold/12 pb-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setAnchorIso((cur) => shiftAnchor(cur, viewMode, -1))}
              className="rounded-full border border-gold/25 p-2 text-gold transition hover:bg-gold/10"
              aria-label="Previous"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setAnchorIso(todayIso)}
              className="rounded-full border border-gold/25 px-3 py-1.5 font-brand text-[10px] tracking-[0.14em] text-gold transition hover:bg-gold/10"
            >
              TODAY
            </button>
            <button
              type="button"
              onClick={() => setAnchorIso((cur) => shiftAnchor(cur, viewMode, 1))}
              className="rounded-full border border-gold/25 p-2 text-gold transition hover:bg-gold/10"
              aria-label="Next"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <p className="font-brand text-[11px] tracking-[0.18em] text-gold/85">{rangeText}</p>

          <div className="inline-flex rounded-full border border-gold/20 bg-black/25 p-1">
            {(["day", "week", "month"] as ViewMode[]).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setViewMode(mode)}
                className={`rounded-full px-3 py-1 font-brand text-[10px] tracking-[0.16em] transition ${
                  viewMode === mode ? "border border-gold/40 bg-gold/12 text-gold" : "text-foreground/55 hover:text-gold"
                }`}
              >
                {mode === "day" ? "DAY" : mode === "week" ? "WEEK" : "MONTH"}
              </button>
            ))}
          </div>
        </div>

        {error ? <p className="mb-4 text-sm text-red-300">{error}</p> : null}

        {viewMode === "day" ? (
          <div className="shamell-glass-surface rounded-xl border border-gold/12 p-4">
            <p className="mb-3 font-brand text-[11px] tracking-[0.16em] text-gold/80">
              {RANGE_LABEL.format(new Date(`${anchorIso}T12:00:00Z`))}
            </p>
            <div className="space-y-2">
              {(byDate.get(anchorIso) ?? []).length === 0 ? (
                <p className="rounded-lg border border-dashed border-gold/20 px-3 py-6 text-center text-sm text-foreground/45">
                  No events
                </p>
              ) : null}
              {(byDate.get(anchorIso) ?? []).map((row) => (
                <button
                  key={row.id}
                  type="button"
                  onClick={() => setSelectedId(row.id)}
                  className={`w-full rounded-lg border px-3 py-2 text-left transition ${
                    selectedId === row.id ? "border-gold/45 bg-gold/12" : "border-gold/20 hover:border-gold/35 hover:bg-gold/8"
                  }`}
                >
                  <p className="font-brand text-[10px] tracking-widest text-gold">
                    {row.start} - {row.end} <span className="text-foreground/45">· {durationLabel(row.durationM)}</span>
                  </p>
                  <p className="mt-1 text-sm text-foreground/85">{displayName(row)}</p>
                  <p className="text-xs text-foreground/60">{eventTypeLabel(row)}</p>
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {viewMode === "week" ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-7">
            {weekDays.map((iso, index) => {
              const rows = byDate.get(iso) ?? [];
              return (
                <article key={iso} className="shamell-glass-surface rounded-xl border border-gold/12 p-3">
                  <p className="font-brand text-[10px] tracking-widest text-gold/75">
                    {WEEKDAY_SHORT[index]} {DAY_NUMBER_LABEL.format(new Date(`${iso}T12:00:00Z`))}
                  </p>
                  <div className="mt-3 space-y-2">
                    {rows.length === 0 ? (
                      <p className="rounded-lg border border-dashed border-gold/20 px-2 py-3 text-center text-xs text-foreground/40">
                        No events
                      </p>
                    ) : null}
                    {rows.map((row) => (
                      <button
                        key={row.id}
                        type="button"
                        onClick={() => setSelectedId(row.id)}
                        className={`w-full rounded-lg border px-2.5 py-2 text-left transition ${
                          selectedId === row.id
                            ? "border-gold/45 bg-gold/12"
                            : "border-gold/20 hover:border-gold/35 hover:bg-gold/8"
                        }`}
                      >
                        <p className="font-brand text-[10px] tracking-widest text-gold">
                          {row.start} - {row.end}
                        </p>
                        <p className="mt-1 truncate text-xs text-foreground/80">{displayName(row)}</p>
                        <p className="truncate text-[11px] text-foreground/55">{eventTypeLabel(row)}</p>
                      </button>
                    ))}
                  </div>
                </article>
              );
            })}
          </div>
        ) : null}

        {viewMode === "month" ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-7">
            {monthGrid.map((iso) => {
              const rows = byDate.get(iso) ?? [];
              const currentMonth = iso.slice(0, 7) === monthStartIso(anchorIso).slice(0, 7);
              const visibleRows = rows.slice(0, 3);
              const hiddenCount = rows.length - visibleRows.length;
              return (
                <article
                  key={iso}
                  className={`shamell-glass-surface min-h-[170px] rounded-xl border p-2.5 ${
                    currentMonth ? "border-gold/14" : "border-gold/8 opacity-70"
                  }`}
                >
                  <p className="font-brand text-[10px] tracking-widest text-gold/75">
                    {WEEKDAY_SHORT[new Date(`${iso}T12:00:00Z`).getUTCDay() === 0 ? 6 : new Date(`${iso}T12:00:00Z`).getUTCDay() - 1]}{" "}
                    {DAY_NUMBER_LABEL.format(new Date(`${iso}T12:00:00Z`))}
                  </p>
                  <div className="mt-2 space-y-1.5">
                    {rows.length === 0 ? (
                      <p className="rounded border border-dashed border-gold/15 px-2 py-1.5 text-center text-[11px] text-foreground/40">
                        No events
                      </p>
                    ) : null}
                    {visibleRows.map((row) => (
                      <button
                        key={row.id}
                        type="button"
                        onClick={() => setSelectedId(row.id)}
                        className={`w-full rounded-md border px-2 py-1.5 text-left ${
                          selectedId === row.id
                            ? "border-gold/45 bg-gold/12"
                            : "border-gold/20 hover:border-gold/35 hover:bg-gold/8"
                        }`}
                      >
                        <p className="truncate font-brand text-[10px] tracking-wide text-gold">
                          {row.start} - {row.end}
                        </p>
                        <p className="truncate text-[11px] text-foreground/70">{displayName(row)}</p>
                      </button>
                    ))}
                    {hiddenCount > 0 ? (
                      <p className="px-1 text-[11px] text-foreground/55">+{hiddenCount} more…</p>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        ) : null}

        <div className="mt-5 border-t border-gold/12 pt-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="font-brand text-[11px] tracking-[0.18em] text-gold">EVENT DETAILS</h2>
            {selected ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditing((v) => !v)}
                  disabled={savingEdit || savingCancel}
                  className="rounded-md border border-gold/35 px-3 py-1.5 font-brand text-[10px] tracking-[0.14em] text-gold hover:bg-gold/10 disabled:opacity-50"
                >
                  {isEditing ? "CLOSE" : "EDIT"}
                </button>
                <button
                  type="button"
                  onClick={() => setCancelModalOpen(true)}
                  disabled={savingEdit || savingCancel}
                  className="rounded-md border border-red-300/45 px-3 py-1.5 font-brand text-[10px] tracking-[0.14em] text-red-200 hover:bg-red-500/10 disabled:opacity-50"
                >
                  {savingCancel ? "CANCELING..." : "CANCEL"}
                </button>
              </div>
            ) : null}
          </div>

          {!selected ? (
            <p className="shamell-glass-surface rounded-xl p-4 text-sm text-foreground/55">
              Select an event on the calendar to see its details.
            </p>
          ) : (
            <div className="shamell-glass-surface rounded-xl border border-gold/12 p-4">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-gold/25 bg-gold/10 px-2 py-0.5 font-brand text-[10px] tracking-widest text-gold">
                  {eventChipLabel(selected)}
                </span>
                <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2 py-0.5 font-brand text-[10px] tracking-widest text-emerald-200">
                  {selected.status}
                </span>
              </div>

              {!isEditing ? (
                <>
                  <p className="mb-4 font-brand text-2xl text-gold/95">{displayName(selected)}</p>
                  <div className="grid gap-3 md:grid-cols-2">
                    <p className="flex items-center gap-2 text-sm text-foreground/75">
                      <CalendarDays className="h-4 w-4 text-gold/80" />
                      {RANGE_LABEL.format(new Date(`${selected.dateIso}T12:00:00Z`))}
                    </p>
                    <p className="flex items-center gap-2 text-sm text-foreground/75">
                      <MapPin className="h-4 w-4 text-gold/80" />
                      {selected.location || "Location TBD"}
                    </p>
                    <p className="flex items-center gap-2 text-sm text-foreground/75">
                      <Package className="h-4 w-4 text-gold/80" />
                      {bookingServiceDisplayLine(selected) || selected.service?.serviceType?.name || "—"}
                    </p>
                    <p className="flex items-center gap-2 text-sm text-foreground/75">
                      <Clock3 className="h-4 w-4 text-gold/80" />
                      {selected.start} - {selected.end} · {durationLabel(selected.durationM)}
                    </p>
                    <p className="flex items-center gap-2 text-sm text-foreground/75">
                      <UserRound className="h-4 w-4 text-gold/80" />
                      {eventTypeLabel(selected)}
                    </p>
                  </div>
                  {selected.notes ? (
                    <div className="mt-4 border-t border-gold/10 pt-3">
                      <p className="mb-1 font-brand text-[10px] tracking-widest text-gold/70">NOTES</p>
                      <p className="whitespace-pre-wrap text-sm text-foreground/70">{selected.notes}</p>
                    </div>
                  ) : null}
                </>
              ) : (
                <div className="grid gap-3 md:grid-cols-2">
                  <label className="block">
                    <span className="font-brand text-[10px] tracking-widest text-gold/70">DATE</span>
                    <input
                      type="date"
                      value={editDateIso}
                      onChange={(e) => setEditDateIso(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-gold/20 bg-black/25 px-3 py-2 text-sm text-foreground outline-none focus:border-gold/40"
                    />
                  </label>
                  <label className="block">
                    <span className="font-brand text-[10px] tracking-widest text-gold/70">LOCATION</span>
                    <input
                      type="text"
                      value={editLocation}
                      onChange={(e) => setEditLocation(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-gold/20 bg-black/25 px-3 py-2 text-sm text-foreground outline-none focus:border-gold/40"
                    />
                  </label>
                  <div className="block md:col-span-2">
                    <span className="font-brand text-[10px] tracking-widest text-gold/70">START TIME</span>
                    <ShamellTime12hColumns
                      className="mt-1 max-w-sm"
                      value={hhmmToParts(/^\d{2}:\d{2}$/.test(editStart.trim()) ? editStart.trim() : "12:00")}
                      onChange={(p) => setEditStart(partsToHHMM(p.h12, p.min, p.ap))}
                      labels={{ hour: "HOUR", minute: "MIN", period: "AM/PM" }}
                    />
                  </div>
                  <div className="block md:col-span-2">
                    <span className="font-brand text-[10px] tracking-widest text-gold/70">END TIME</span>
                    <ShamellTime12hColumns
                      className="mt-1 max-w-sm"
                      value={hhmmToParts(
                        /^\d{2}:\d{2}$/.test(editEnd.trim())
                          ? editEnd.trim()
                          : /^\d{2}:\d{2}$/.test(editStart.trim())
                            ? editStart.trim()
                            : "12:00",
                      )}
                      onChange={(p) => setEditEnd(partsToHHMM(p.h12, p.min, p.ap))}
                      labels={{ hour: "HOUR", minute: "MIN", period: "AM/PM" }}
                    />
                  </div>
                  <label className="block md:col-span-2">
                    <span className="font-brand text-[10px] tracking-widest text-gold/70">NOTES</span>
                    <textarea
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                      rows={3}
                      className="mt-1 w-full rounded-lg border border-gold/20 bg-black/25 px-3 py-2 text-sm text-foreground outline-none focus:border-gold/40"
                    />
                  </label>
                  <div className="md:col-span-2">
                    <button
                      type="button"
                      onClick={onSaveEdit}
                      disabled={savingEdit || savingCancel}
                      className="rounded-md border border-gold/35 px-4 py-2 font-brand text-[10px] tracking-[0.14em] text-gold hover:bg-gold/10 disabled:opacity-50"
                    >
                      {savingEdit ? "SAVING..." : "SAVE CHANGES"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {isLoading ? <p className="mt-4 text-sm text-foreground/55">Loading calendar...</p> : null}
      </section>

      <AdminModal title="Cancel booking" isOpen={cancelModalOpen} onClose={() => setCancelModalOpen(false)}>
        <div className="space-y-4">
          <p className="text-sm text-foreground/75">
            This will set the booking status to <span className="text-red-200">CANCELLED</span>.
          </p>
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setCancelModalOpen(false)}
              className="rounded-md border border-gold/25 px-4 py-2 font-brand text-[10px] tracking-[0.14em] text-foreground/70 hover:border-gold/35 hover:text-gold"
            >
              CLOSE
            </button>
            <button
              type="button"
              onClick={async () => {
                setCancelModalOpen(false);
                await onCancelBooking();
              }}
              className="rounded-md border border-red-400/45 px-4 py-2 font-brand text-[10px] tracking-[0.14em] text-red-200 hover:bg-red-500/10"
            >
              CONFIRM CANCELLATION
            </button>
          </div>
        </div>
      </AdminModal>
    </div>
  );
}
