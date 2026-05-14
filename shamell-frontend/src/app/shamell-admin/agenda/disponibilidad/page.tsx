"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import AdminAccordionSingleSelect, {
  type AdminAccordionSingleOption,
} from "@/components/admin/AdminAccordionSingleSelect";
import AdminBackButton from "@/components/admin/AdminBackButton";
import AdminModal from "@/components/admin/AdminModal";
import AdminModuleHero from "@/components/admin/AdminModuleHero";
import ContactDatePickerModal from "@/components/contact/ContactDatePickerModal";
import ContactTimePickerModal from "@/components/contact/ContactTimePickerModal";
import { formatTimeDisplayUs } from "@/components/contact/contactLogisticsUtils";
import { toast } from "@/hooks/use-toast";
import { useAdminAvailability } from "@/hooks/use-admin-availability";
import type { PublicWeeklySlot } from "@/lib/bookingAvailability";

const WEEKDAY_LABEL = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const CLOSURE_WEEKDAY_OPTIONS: AdminAccordionSingleOption[] = WEEKDAY_LABEL.map((label, i) => ({
  id: String(i),
  label,
}));
const CLOSURE_KIND_OPTIONS: AdminAccordionSingleOption[] = [
  { id: "SPECIFIC_DATE", label: "Single date" },
  { id: "DATE_RANGE", label: "Date range (from / through)" },
  { id: "RECURRING_WEEKDAY", label: "Weekly (e.g. every Sunday)" },
];

function defaultWeekly(): PublicWeeklySlot[] {
  return [0, 1, 2, 3, 4, 5, 6].map((weekday) =>
    weekday === 0
      ? { weekday, isClosed: true, startTime: null, endTime: null }
      : { weekday, isClosed: false, startTime: "09:00", endTime: "21:00" },
  );
}

export default function AgendaDisponibilidadPage() {
  const { snapshot, isLoading, error, reload, putWeekly, createClosure, removeClosure } = useAdminAvailability();
  const [weeklyDraft, setWeeklyDraft] = useState<PublicWeeklySlot[]>(defaultWeekly);
  const [savingWeekly, setSavingWeekly] = useState(false);
  const [activePanel, setActivePanel] = useState<"weekly" | "closures">("weekly");

  const [closureKind, setClosureKind] = useState<"SPECIFIC_DATE" | "RECURRING_WEEKDAY" | "DATE_RANGE">("SPECIFIC_DATE");
  const [closureDate, setClosureDate] = useState("");
  const [closureStartDate, setClosureStartDate] = useState("");
  const [closureEndDate, setClosureEndDate] = useState("");
  const [closureWeekday, setClosureWeekday] = useState(0);
  const [closureNote, setClosureNote] = useState("");
  const [addingClosure, setAddingClosure] = useState(false);
  const [confirmClosureId, setConfirmClosureId] = useState<string | null>(null);
  const [closureDatePickerTarget, setClosureDatePickerTarget] = useState<null | "single" | "start" | "end">(null);
  const [timePickerTarget, setTimePickerTarget] = useState<null | { weekday: number; field: "start" | "end" }>(null);

  useEffect(() => {
    if (!snapshot?.weekly?.length) return;
    const byDay = [...snapshot.weekly].sort((a, b) => a.weekday - b.weekday);
    if (byDay.length === 7) {
      setWeeklyDraft(
        byDay.map((w) => ({
          weekday: w.weekday,
          isClosed: w.isClosed,
          startTime: w.startTime,
          endTime: w.endTime,
        })),
      );
    }
  }, [snapshot]);

  const onSaveWeekly = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      setSavingWeekly(true);
      try {
        await putWeekly(weeklyDraft);
        toast({ title: "Hours saved" });
      } catch (err) {
        toast({
          title: "Could not save",
          description: err instanceof Error ? err.message : "",
          variant: "destructive",
        });
      } finally {
        setSavingWeekly(false);
      }
    },
    [putWeekly, weeklyDraft],
  );

  const onAddClosure = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      setAddingClosure(true);
      try {
        if (closureKind === "SPECIFIC_DATE") {
          if (!closureDate) throw new Error("Pick a date for this one-day closure.");
          await createClosure({ kind: "SPECIFIC_DATE", date: closureDate, note: closureNote || undefined });
        } else if (closureKind === "DATE_RANGE") {
          if (!closureStartDate || !closureEndDate) throw new Error("Pick start and end dates.");
          await createClosure({
            kind: "DATE_RANGE",
            startDate: closureStartDate,
            endDate: closureEndDate,
            note: closureNote || undefined,
          });
        } else {
          await createClosure({
            kind: "RECURRING_WEEKDAY",
            weekday: closureWeekday,
            note: closureNote || undefined,
          });
        }
        setClosureDate("");
        setClosureStartDate("");
        setClosureEndDate("");
        setClosureNote("");
        toast({ title: "Closure added" });
      } catch (err) {
        toast({
          title: "Error",
          description: err instanceof Error ? err.message : "",
          variant: "destructive",
        });
      } finally {
        setAddingClosure(false);
      }
    },
    [closureKind, closureDate, closureStartDate, closureEndDate, closureWeekday, closureNote, createClosure],
  );

  const rows = useMemo(() => weeklyDraft.slice().sort((a, b) => a.weekday - b.weekday), [weeklyDraft]);
  const pickerValue = useMemo(() => {
    if (!timePickerTarget) return "";
    const row = weeklyDraft.find((w) => w.weekday === timePickerTarget.weekday);
    if (!row) return "";
    return timePickerTarget.field === "start" ? row.startTime ?? "" : row.endTime ?? "";
  }, [timePickerTarget, weeklyDraft]);

  return (
    <div className="mx-auto w-full min-w-0 max-w-4xl">
      <AdminBackButton href="/shamell-admin/agenda" label="Back" className="mb-4" />
      <AdminModuleHero title="Availability" bordered={false} />

      <div className="mb-6 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center sm:gap-3">
        <button
          type="button"
          onClick={() => setActivePanel("weekly")}
          className={
            activePanel === "weekly"
              ? "rounded-full border border-gold/40 bg-gold/12 px-3 py-2 font-brand text-[10px] tracking-[0.14em] text-gold sm:px-4 sm:py-1.5"
              : "rounded-full border border-gold/18 px-3 py-2 font-brand text-[10px] tracking-[0.14em] text-foreground/60 hover:border-gold/35 hover:text-gold sm:px-4 sm:py-1.5"
          }
        >
          WEEKLY HOURS
        </button>
        <button
          type="button"
          onClick={() => setActivePanel("closures")}
          className={
            activePanel === "closures"
              ? "rounded-full border border-gold/40 bg-gold/12 px-3 py-2 font-brand text-[10px] tracking-[0.14em] text-gold sm:px-4 sm:py-1.5"
              : "rounded-full border border-gold/18 px-3 py-2 font-brand text-[10px] tracking-[0.14em] text-foreground/60 hover:border-gold/35 hover:text-gold sm:px-4 sm:py-1.5"
          }
        >
          CLOSURES
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activePanel === "weekly" ? (
          <motion.section
            key="avail-weekly"
            initial={{ opacity: 0, y: 18 }}
            animate={{
              opacity: 1,
              y: 0,
              transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] },
            }}
            exit={{ opacity: 0, y: -12, transition: { duration: 0.2, ease: [0.4, 0, 1, 1] } }}
            className="shamell-glass-surface mb-10 overflow-visible rounded-2xl p-4 sm:p-5 md:p-7"
          >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gold/10 pb-4">
          <h2 className="font-brand text-[11px] tracking-[0.18em] text-gold">WEEKLY HOURS</h2>
          {error ? <span className="text-xs text-red-300">{error}</span> : null}
        </div>

        {isLoading && !snapshot ? (
          <div className="flex justify-center py-12 text-gold">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <form onSubmit={onSaveWeekly} className="mt-6 space-y-4">
            {rows.map((row) => (
              <motion.div
                key={row.weekday}
                layout
                transition={{ layout: { type: "spring", damping: 28, stiffness: 320 } }}
                className="shamell-glass-surface flex flex-col gap-3 rounded-xl px-3 py-3 sm:px-4 md:flex-row md:items-center md:gap-5"
              >
                <div className="flex min-w-0 items-center justify-between gap-3 md:block md:w-36 md:shrink-0">
                  <div className="min-w-0 font-brand text-[11px] tracking-wide text-gold/90">
                    {WEEKDAY_LABEL[row.weekday] ?? row.weekday}
                  </div>
                  <label className="flex shrink-0 items-center gap-2 font-body text-xs text-foreground/70 md:mt-2">
                    <input
                      type="checkbox"
                      className="shamell-admin-checkbox"
                      checked={row.isClosed}
                      onChange={(e) =>
                        setWeeklyDraft((prev) =>
                          prev.map((w) =>
                            w.weekday === row.weekday
                              ? {
                                  ...w,
                                  isClosed: e.target.checked,
                                  startTime: e.target.checked ? null : w.startTime ?? "09:00",
                                  endTime: e.target.checked ? null : w.endTime ?? "21:00",
                                }
                              : w,
                          ),
                        )
                      }
                    />
                    Closed
                  </label>
                </div>
                {!row.isClosed ? (
                  <div className="grid min-w-0 w-full grid-cols-1 gap-2 sm:grid-cols-[1fr_auto_1fr] sm:items-center md:flex-1">
                    <button
                      type="button"
                      onClick={() => setTimePickerTarget({ weekday: row.weekday, field: "start" })}
                      className="shamell-glass-trigger w-full min-w-0 rounded-lg border border-gold/25 px-3 py-2 text-left font-body text-xs text-foreground sm:py-1.5"
                    >
                      {row.startTime ? formatTimeDisplayUs(row.startTime) : "Choose time"}
                    </button>
                    <span className="hidden text-center text-foreground/40 sm:block" aria-hidden>
                      —
                    </span>
                    <button
                      type="button"
                      onClick={() => setTimePickerTarget({ weekday: row.weekday, field: "end" })}
                      className="shamell-glass-trigger w-full min-w-0 rounded-lg border border-gold/25 px-3 py-2 text-left font-body text-xs text-foreground sm:py-1.5"
                    >
                      {row.endTime ? formatTimeDisplayUs(row.endTime) : "Choose time"}
                    </button>
                  </div>
                ) : null}
              </motion.div>
            ))}
            <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
              <button
                type="submit"
                disabled={savingWeekly}
                className="w-full rounded-full border border-gold/35 px-5 py-2.5 font-brand text-[10px] tracking-[0.14em] text-gold transition hover:bg-gold/10 disabled:opacity-50 sm:w-auto sm:py-2"
              >
                {savingWeekly ? <Loader2 className="inline h-4 w-4 animate-spin" /> : null}
                SAVE HOURS
              </button>
              <button
                type="button"
                onClick={() => reload()}
                className="w-full rounded-full border border-gold/15 px-4 py-2.5 font-brand text-[10px] tracking-[0.14em] text-foreground/60 hover:border-gold/30 hover:text-gold sm:w-auto sm:py-2"
              >
                RELOAD
              </button>
            </div>
          </form>
        )}
          </motion.section>
        ) : (
          <motion.section
            key="avail-closures"
            initial={{ opacity: 0, y: 18 }}
            animate={{
              opacity: 1,
              y: 0,
              transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] },
            }}
            exit={{ opacity: 0, y: -12, transition: { duration: 0.2, ease: [0.4, 0, 1, 1] } }}
            className="shamell-glass-surface overflow-visible rounded-2xl p-4 sm:p-5 md:p-7"
          >
        <div className="border-b border-gold/10 pb-4">
          <h2 className="font-brand text-[10px] leading-snug tracking-[0.16em] text-gold sm:text-[11px] sm:tracking-[0.18em]">
            <span className="block sm:hidden">CLOSURES</span>
            <span className="hidden sm:block">CLOSURES (time off / single day / weekly recurring)</span>
          </h2>
          <p className="mt-1 font-body text-[11px] leading-relaxed text-foreground/50 sm:hidden">
            Single date, date range, or the same weekday every week.
          </p>
        </div>

        <form onSubmit={onAddClosure} className="mt-6 grid gap-4 overflow-visible md:grid-cols-2">
          <label className="block overflow-visible md:col-span-2">
            <span className="font-brand text-[10px] tracking-widest text-gold/65">TYPE</span>
            <AdminAccordionSingleSelect
              options={CLOSURE_KIND_OPTIONS}
              value={closureKind}
              onChange={(id) => {
                setClosureKind(id as typeof closureKind);
                setClosureDatePickerTarget(null);
              }}
              className="mt-2"
              showNoneOption={false}
              ariaLabel="Select closure type"
            />
          </label>
          {closureKind === "SPECIFIC_DATE" ? (
            <label className="block">
              <span className="font-brand text-[10px] tracking-widest text-gold/65">DATE</span>
              <input type="hidden" required value={closureDate} readOnly />
              <button
                type="button"
                onClick={() => setClosureDatePickerTarget("single")}
                className="shamell-glass-trigger mt-2 w-full rounded-lg border border-gold/25 px-3 py-2.5 text-left font-body text-sm text-foreground"
              >
                {closureDate || "Choose date"}
              </button>
            </label>
          ) : closureKind === "DATE_RANGE" ? (
            <>
              <label className="block">
                <span className="font-brand text-[10px] tracking-widest text-gold/65">FROM</span>
                <input type="hidden" required value={closureStartDate} readOnly />
                <button
                  type="button"
                  onClick={() => setClosureDatePickerTarget("start")}
                  className="shamell-glass-trigger mt-2 w-full rounded-lg border border-gold/25 px-3 py-2.5 text-left font-body text-sm text-foreground"
                >
                  {closureStartDate || "Choose start date"}
                </button>
              </label>
              <label className="block">
                <span className="font-brand text-[10px] tracking-widest text-gold/65">THROUGH</span>
                <input type="hidden" required value={closureEndDate} readOnly />
                <button
                  type="button"
                  onClick={() => setClosureDatePickerTarget("end")}
                  className="shamell-glass-trigger mt-2 w-full rounded-lg border border-gold/25 px-3 py-2.5 text-left font-body text-sm text-foreground"
                >
                  {closureEndDate || "Choose end date"}
                </button>
              </label>
            </>
          ) : (
            <label className="block md:col-span-2">
              <span className="font-brand text-[10px] tracking-widest text-gold/65">DAY OF WEEK</span>
              <AdminAccordionSingleSelect
                options={CLOSURE_WEEKDAY_OPTIONS}
                value={String(closureWeekday)}
                onChange={(id) => setClosureWeekday(Number(id))}
                className="mt-2"
                showNoneOption={false}
                ariaLabel="Select day of week for recurring closure"
              />
            </label>
          )}
          <label className="block md:col-span-2">
            <span className="font-brand text-[10px] tracking-widest text-gold/65">NOTE (OPTIONAL)</span>
            <input
              type="text"
              value={closureNote}
              onChange={(e) => setClosureNote(e.target.value)}
              className="mt-2 w-full rounded-lg border border-gold/25 px-3 py-2.5 font-body text-sm text-foreground outline-none focus:border-gold"
              placeholder="e.g. Travel, holiday"
            />
          </label>
          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={addingClosure}
              className="w-full rounded-full border border-gold/35 px-5 py-2.5 font-brand text-[10px] tracking-[0.14em] text-gold transition hover:bg-gold/10 disabled:opacity-50 sm:w-auto sm:py-2"
            >
              {addingClosure ? <Loader2 className="inline h-4 w-4 animate-spin" /> : null}
              ADD CLOSURE
            </button>
          </div>
        </form>

        <ul className="mt-8 space-y-2">
          {(snapshot?.closures ?? []).length === 0 ? (
            <li className="shamell-glass-surface rounded-lg py-8 text-center font-body text-sm text-foreground/45">
              No extra closures configured.
            </li>
          ) : null}
          {(snapshot?.closures ?? []).map((c) => (
            <li
              key={c.id}
              className="shamell-glass-surface flex flex-col gap-3 rounded-xl px-3 py-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4 sm:px-4"
            >
              <div className="min-w-0 flex-1">
                <p className="wrap-break-word font-brand text-xs tracking-wide text-gold">
                  {c.kind === "SPECIFIC_DATE"
                    ? `Date: ${c.date ?? "—"}`
                    : c.kind === "DATE_RANGE"
                      ? `Range: ${c.startDate ?? "—"} through ${c.endDate ?? "—"}`
                      : `Every ${WEEKDAY_LABEL[c.weekday ?? 0] ?? "—"}`}
                </p>
                {c.note ? <p className="mt-1 wrap-break-word font-body text-xs text-foreground/55">{c.note}</p> : null}
              </div>
              <button
                type="button"
                onClick={() => {
                  setConfirmClosureId(c.id);
                }}
                className="inline-flex w-full shrink-0 items-center justify-center gap-1.5 rounded-lg border border-red-400/35 px-3 py-2.5 font-brand text-[10px] tracking-widest text-red-200/90 hover:bg-red-500/10 sm:w-auto sm:py-2"
              >
                <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
                REMOVE
              </button>
            </li>
          ))}
        </ul>

          </motion.section>
        )}
      </AnimatePresence>

      <ContactTimePickerModal
        isOpen={Boolean(timePickerTarget)}
        title={timePickerTarget?.field === "end" ? "End time" : "Start time"}
        value={pickerValue}
        onClose={() => setTimePickerTarget(null)}
        onConfirm={(hhmm) => {
          if (!timePickerTarget) return;
          setWeeklyDraft((prev) =>
            prev.map((w) =>
              w.weekday === timePickerTarget.weekday
                ? { ...w, [timePickerTarget.field === "start" ? "startTime" : "endTime"]: hhmm }
                : w,
            ),
          );
        }}
      />
      <ContactDatePickerModal
        isOpen={closureDatePickerTarget !== null}
        title={
          closureDatePickerTarget === "start"
            ? "Start date"
            : closureDatePickerTarget === "end"
              ? "End date"
              : "Closure date"
        }
        value={
          closureDatePickerTarget === "start"
            ? closureStartDate
            : closureDatePickerTarget === "end"
              ? closureEndDate
              : closureDate
        }
        onClose={() => setClosureDatePickerTarget(null)}
        onConfirm={(iso) => {
          if (closureDatePickerTarget === "start") setClosureStartDate(iso);
          else if (closureDatePickerTarget === "end") setClosureEndDate(iso);
          else setClosureDate(iso);
        }}
      />
      <AdminModal title="Delete closure" isOpen={Boolean(confirmClosureId)} onClose={() => setConfirmClosureId(null)}>
        <div className="space-y-4">
          <p className="text-sm text-foreground/75">This closure will be removed permanently.</p>
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setConfirmClosureId(null)}
              className="rounded-md border border-gold/25 px-4 py-2 font-brand text-[10px] tracking-[0.14em] text-foreground/70 hover:border-gold/35 hover:text-gold"
            >
              CLOSE
            </button>
            <button
              type="button"
              onClick={() => {
                if (!confirmClosureId) return;
                const id = confirmClosureId;
                setConfirmClosureId(null);
                removeClosure(id).catch((err: unknown) =>
                  toast({
                    title: "Error",
                    description: err instanceof Error ? err.message : "",
                    variant: "destructive",
                  }),
                );
              }}
              className="rounded-md border border-red-400/45 px-4 py-2 font-brand text-[10px] tracking-[0.14em] text-red-200 hover:bg-red-500/10"
            >
              DELETE
            </button>
          </div>
        </div>
      </AdminModal>
    </div>
  );
}
