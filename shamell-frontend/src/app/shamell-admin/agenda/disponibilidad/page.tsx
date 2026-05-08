"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
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

const WEEKDAY_LABEL = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const CLOSURE_KIND_OPTIONS: AdminAccordionSingleOption[] = [
  { id: "SPECIFIC_DATE", label: "Fecha puntual" },
  { id: "DATE_RANGE", label: "Rango de fechas (desde / hasta)" },
  { id: "RECURRING_WEEKDAY", label: "Cada semana (ej. todos los domingos)" },
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
        toast({ title: "Horario guardado" });
      } catch (err) {
        toast({
          title: "No se pudo guardar",
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
          if (!closureDate) throw new Error("Selecciona una fecha para el cierre puntual.");
          await createClosure({ kind: "SPECIFIC_DATE", date: closureDate, note: closureNote || undefined });
        } else if (closureKind === "DATE_RANGE") {
          if (!closureStartDate || !closureEndDate) throw new Error("Selecciona fecha inicial y final.");
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
        toast({ title: "Cierre añadido" });
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
    <div className="mx-auto w-full max-w-4xl">
      <AdminBackButton href="/shamell-admin/agenda" label="Volver" className="mb-4" />
      <AdminModuleHero title="Disponibilidad" bordered={false} />

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => setActivePanel("weekly")}
          className={
            activePanel === "weekly"
              ? "rounded-full border border-gold/40 bg-gold/12 px-4 py-1.5 font-brand text-[10px] tracking-[0.14em] text-gold"
              : "rounded-full border border-gold/18 px-4 py-1.5 font-brand text-[10px] tracking-[0.14em] text-foreground/60 hover:border-gold/35 hover:text-gold"
          }
        >
          HORARIO SEMANAL
        </button>
        <button
          type="button"
          onClick={() => setActivePanel("closures")}
          className={
            activePanel === "closures"
              ? "rounded-full border border-gold/40 bg-gold/12 px-4 py-1.5 font-brand text-[10px] tracking-[0.14em] text-gold"
              : "rounded-full border border-gold/18 px-4 py-1.5 font-brand text-[10px] tracking-[0.14em] text-foreground/60 hover:border-gold/35 hover:text-gold"
          }
        >
          CIERRES
        </button>
      </div>

      {activePanel === "weekly" ? (
        <section className="shamell-glass-surface mb-10 rounded-2xl p-5 md:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gold/10 pb-4">
          <h2 className="font-brand text-[11px] tracking-[0.18em] text-gold">HORARIO SEMANAL</h2>
          {error ? <span className="text-xs text-red-300">{error}</span> : null}
        </div>

        {isLoading && !snapshot ? (
          <div className="flex justify-center py-12 text-gold">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <form onSubmit={onSaveWeekly} className="mt-6 space-y-4">
            {rows.map((row) => (
              <div
                key={row.weekday}
                className="shamell-glass-surface flex flex-col gap-3 rounded-xl px-4 py-3 md:flex-row md:items-center"
              >
                <div className="min-w-32 font-brand text-[11px] tracking-wide text-gold/90">
                  {WEEKDAY_LABEL[row.weekday] ?? row.weekday}
                </div>
                <label className="flex items-center gap-2 font-body text-xs text-foreground/70">
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
                  Cerrado
                </label>
                {!row.isClosed ? (
                  <div className="flex flex-wrap items-center gap-2 md:flex-1">
                    <button
                      type="button"
                      onClick={() => setTimePickerTarget({ weekday: row.weekday, field: "start" })}
                      className="shamell-glass-trigger min-w-[110px] rounded-lg border border-gold/25 px-3 py-1.5 text-left font-body text-xs text-foreground"
                    >
                      {row.startTime ? formatTimeDisplayUs(row.startTime) : "Elegir hora"}
                    </button>
                    <span className="text-foreground/40">—</span>
                    <button
                      type="button"
                      onClick={() => setTimePickerTarget({ weekday: row.weekday, field: "end" })}
                      className="shamell-glass-trigger min-w-[110px] rounded-lg border border-gold/25 px-3 py-1.5 text-left font-body text-xs text-foreground"
                    >
                      {row.endTime ? formatTimeDisplayUs(row.endTime) : "Elegir hora"}
                    </button>
                  </div>
                ) : null}
              </div>
            ))}
            <div className="flex flex-wrap gap-3 pt-2">
              <button
                type="submit"
                disabled={savingWeekly}
                className="rounded-full border border-gold/35 px-5 py-2 font-brand text-[10px] tracking-[0.14em] text-gold transition hover:bg-gold/10 disabled:opacity-50"
              >
                {savingWeekly ? <Loader2 className="inline h-4 w-4 animate-spin" /> : null}
                GUARDAR HORARIO
              </button>
              <button
                type="button"
                onClick={() => reload()}
                className="rounded-full border border-gold/15 px-4 py-2 font-brand text-[10px] tracking-[0.14em] text-foreground/60 hover:border-gold/30 hover:text-gold"
              >
                RECARGAR
              </button>
            </div>
          </form>
        )}
        </section>
      ) : null}

      {activePanel === "closures" ? (
        <section className="shamell-glass-surface rounded-2xl p-5 md:p-7">
        <h2 className="border-b border-gold/10 pb-4 font-brand text-[11px] tracking-[0.18em] text-gold">
          CIERRES (vacaciones / día puntual / cada semana)
        </h2>

        <form onSubmit={onAddClosure} className="mt-6 grid gap-4 md:grid-cols-2">
          <label className="block md:col-span-2">
            <span className="font-brand text-[10px] tracking-widest text-gold/65">TIPO</span>
            <AdminAccordionSingleSelect
              options={CLOSURE_KIND_OPTIONS}
              value={closureKind}
              onChange={(id) => {
                setClosureKind(id as typeof closureKind);
                setClosureDatePickerTarget(null);
              }}
              className="mt-2"
              showNoneOption={false}
              ariaLabel="Seleccionar tipo de cierre"
            />
          </label>
          {closureKind === "SPECIFIC_DATE" ? (
            <label className="block">
              <span className="font-brand text-[10px] tracking-widest text-gold/65">FECHA</span>
              <input type="hidden" required value={closureDate} readOnly />
              <button
                type="button"
                onClick={() => setClosureDatePickerTarget("single")}
                className="shamell-glass-trigger mt-2 w-full rounded-lg border border-gold/25 px-3 py-2.5 text-left font-body text-sm text-foreground"
              >
                {closureDate || "Elegir fecha"}
              </button>
            </label>
          ) : closureKind === "DATE_RANGE" ? (
            <>
              <label className="block">
                <span className="font-brand text-[10px] tracking-widest text-gold/65">DESDE</span>
                <input type="hidden" required value={closureStartDate} readOnly />
                <button
                  type="button"
                  onClick={() => setClosureDatePickerTarget("start")}
                  className="shamell-glass-trigger mt-2 w-full rounded-lg border border-gold/25 px-3 py-2.5 text-left font-body text-sm text-foreground"
                >
                  {closureStartDate || "Elegir fecha inicial"}
                </button>
              </label>
              <label className="block">
                <span className="font-brand text-[10px] tracking-widest text-gold/65">HASTA</span>
                <input type="hidden" required value={closureEndDate} readOnly />
                <button
                  type="button"
                  onClick={() => setClosureDatePickerTarget("end")}
                  className="shamell-glass-trigger mt-2 w-full rounded-lg border border-gold/25 px-3 py-2.5 text-left font-body text-sm text-foreground"
                >
                  {closureEndDate || "Elegir fecha final"}
                </button>
              </label>
            </>
          ) : (
            <label className="block">
              <span className="font-brand text-[10px] tracking-widest text-gold/65">DÍA DE LA SEMANA</span>
              <select
                value={closureWeekday}
                onChange={(e) => setClosureWeekday(Number(e.target.value))}
                className="mt-2 w-full rounded-lg border border-gold/25 px-3 py-2.5 font-body text-sm text-foreground outline-none focus:border-gold"
              >
                {WEEKDAY_LABEL.map((label, i) => (
                  <option key={label} value={i}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label className="block md:col-span-2">
            <span className="font-brand text-[10px] tracking-widest text-gold/65">NOTA (OPCIONAL)</span>
            <input
              type="text"
              value={closureNote}
              onChange={(e) => setClosureNote(e.target.value)}
              className="mt-2 w-full rounded-lg border border-gold/25 px-3 py-2.5 font-body text-sm text-foreground outline-none focus:border-gold"
              placeholder="Ej. Viaje, feriado"
            />
          </label>
          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={addingClosure}
              className="rounded-full border border-gold/35 px-5 py-2 font-brand text-[10px] tracking-[0.14em] text-gold transition hover:bg-gold/10 disabled:opacity-50"
            >
              {addingClosure ? <Loader2 className="inline h-4 w-4 animate-spin" /> : null}
              AÑADIR CIERRE
            </button>
          </div>
        </form>

        <ul className="mt-8 space-y-2">
          {(snapshot?.closures ?? []).length === 0 ? (
            <li className="shamell-glass-surface rounded-lg py-8 text-center font-body text-sm text-foreground/45">
              No hay cierres extra configurados.
            </li>
          ) : null}
          {(snapshot?.closures ?? []).map((c) => (
            <li
              key={c.id}
              className="shamell-glass-surface flex flex-wrap items-center justify-between gap-3 rounded-xl px-4 py-3"
            >
              <div>
                <p className="font-brand text-xs tracking-wide text-gold">
                  {c.kind === "SPECIFIC_DATE"
                    ? `Fecha: ${c.date ?? "—"}`
                    : c.kind === "DATE_RANGE"
                      ? `Rango: ${c.startDate ?? "—"} a ${c.endDate ?? "—"}`
                      : `Cada ${WEEKDAY_LABEL[c.weekday ?? 0] ?? "—"}`}
                </p>
                {c.note ? <p className="mt-1 font-body text-xs text-foreground/55">{c.note}</p> : null}
              </div>
              <button
                type="button"
                onClick={() => {
                  setConfirmClosureId(c.id);
                }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-red-400/35 px-3 py-2 font-brand text-[10px] tracking-widest text-red-200/90 hover:bg-red-500/10"
              >
                <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
                QUITAR
              </button>
            </li>
          ))}
        </ul>

        </section>
      ) : null}

      <ContactTimePickerModal
        isOpen={Boolean(timePickerTarget)}
        title={timePickerTarget?.field === "end" ? "Hora final" : "Hora inicial"}
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
            ? "Fecha inicial"
            : closureDatePickerTarget === "end"
              ? "Fecha final"
              : "Fecha de cierre"
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
      <AdminModal title="Eliminar cierre" isOpen={Boolean(confirmClosureId)} onClose={() => setConfirmClosureId(null)}>
        <div className="space-y-4">
          <p className="text-sm text-foreground/75">Este cierre se eliminará de forma permanente.</p>
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setConfirmClosureId(null)}
              className="rounded-md border border-gold/25 px-4 py-2 font-brand text-[10px] tracking-[0.14em] text-foreground/70 hover:border-gold/35 hover:text-gold"
            >
              CERRAR
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
              ELIMINAR
            </button>
          </div>
        </div>
      </AdminModal>
    </div>
  );
}
