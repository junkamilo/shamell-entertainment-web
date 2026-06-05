"use client";

import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import {
  fieldLabelClass,
  logisticsPickerTriggerClass,
} from "@/app/shamell-admin/agenda/agendar/lib/agendarStyles";
import { formatDateDisplayUs, formatTimeDisplayUs } from "@/lib/contactLogisticsUtils";
import {
  defaultReservationWeekdays,
  todayIsoDateInTimezone,
} from "../lib/reservationEventTemplateDefaults";
import type {
  ReservationEventScheduleMode,
  ReservationEventTemplate,
  ReservationEventWeekday,
} from "../types/reservationEventTemplate.types";
import ContactTimePickerModal from "@/app/contacto/components/ContactTimePickerModal";
import { ADMIN_NESTED_PICKER_OVERLAY_Z_CLASS } from "@/components/admin/adminModalLayers";
import { ReservationEventWeekdaySelector } from "./ReservationEventWeekdaySelector";
import {
  ReservationEventSchedulePickers,
  type ScheduleDateTarget,
  type ScheduleTimeTarget,
} from "./ReservationEventSchedulePickers";
import { ScheduleModeToggleSection } from "./ScheduleModeToggleSection";

import type { ClassSectionFormRow } from "../types/reservationEventTemplate.types";
import { RecurringClassSectionsEditor } from "./RecurringClassSectionsEditor";
import {
  BULK_SECTION_WEEKDAY,
  RecurringClassBulkSectionsEditor,
} from "./RecurringClassBulkSectionsEditor";
import {
  defaultBlueprint,
  inferBlueprintFromActiveDays,
  type ClassSectionBlueprint,
} from "../lib/recurringClassSectionsBulk.util";

export type ScheduleFormState = {
  scheduleMode: ReservationEventScheduleMode;
  salesStartDate: string;
  salesEndDate: string;
  eventDate: string;
  eventStartTime: string;
  eventEndTime: string;
  weekdays: ReservationEventWeekday[];
  recurringStartTime: string;
  recurringEndTime: string;
  classSections: ClassSectionFormRow[];
};

export function emptyScheduleForm(): ScheduleFormState {
  return {
    scheduleMode: "FIXED_EVENT",
    salesStartDate: "",
    salesEndDate: "",
    eventDate: "",
    eventStartTime: "18:00",
    eventEndTime: "23:00",
    weekdays: defaultReservationWeekdays(),
    recurringStartTime: "10:00",
    recurringEndTime: "12:00",
    classSections: [],
  };
}

function classSectionsFromTemplate(
  template: import("../types/reservationEventTemplate.types").ReservationEventTemplate,
): ClassSectionFormRow[] {
  if (template.classSections?.length) {
    return template.classSections.map((s) => ({
      weekday: s.weekday,
      label: s.label ?? "",
      startTime: s.startTime,
      endTime: s.endTime,
      sortOrder: s.sortOrder,
      defaultCapacity: s.defaultCapacity,
      defaultPrice: s.defaultPrice != null ? String(s.defaultPrice) : "",
    }));
  }
  const start = template.recurringStartTime ?? "10:00";
  const end = template.recurringEndTime ?? "12:00";
  return (template.weekdays ?? [])
    .filter((w) => w.isActive)
    .map((w) => ({
      weekday: w.weekday,
      label: "Section 1",
      startTime: start,
      endTime: end,
      sortOrder: 0,
      defaultCapacity: 20,
      defaultPrice: "",
    }));
}

export function scheduleFormFromTemplate(
  template: ReservationEventTemplate,
): ScheduleFormState {
  const weekdays =
    Array.isArray(template.weekdays) && template.weekdays.length === 7 ?
      template.weekdays
    : defaultReservationWeekdays();
  return {
    scheduleMode: template.scheduleMode,
    salesStartDate: template.salesStartDate ?? "",
    salesEndDate: template.salesEndDate ?? "",
    eventDate: template.eventDate ?? "",
    eventStartTime: template.eventStartTime ?? "18:00",
    eventEndTime: template.eventEndTime ?? "23:00",
    weekdays,
    recurringStartTime: template.recurringStartTime ?? "10:00",
    recurringEndTime: template.recurringEndTime ?? "12:00",
    classSections: classSectionsFromTemplate(template),
  };
}

function PickerButton({
  label,
  display,
  placeholder,
  badge,
  onClick,
  disabled,
}: {
  label: string;
  display: string;
  placeholder: string;
  badge: "CALENDAR" | "TIME";
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <span className={`${fieldLabelClass} block`}>{label}</span>
      <button
        type="button"
        disabled={disabled}
        onClick={onClick}
        className={logisticsPickerTriggerClass}
      >
        <span
          className={`font-body text-sm ${display ? "text-foreground" : "text-foreground/50"}`}
        >
          {display || placeholder}
        </span>
        <span className="shrink-0 font-brand text-xs tracking-[0.14em] text-gold">{badge}</span>
      </button>
    </div>
  );
}

/** When `experienceMode`/`onExperienceModeChange` are provided, a third "Normal"
 * card is shown and the active state is driven by the parent's 3-state value
 * (used inside the upcoming event form). Without them it behaves as a plain
 * 2-mode (FIXED/RECURRING) selector. */
export type ScheduleExperienceMode = "NORMAL" | ReservationEventScheduleMode;

type Props = {
  value: ScheduleFormState;
  onChange: Dispatch<SetStateAction<ScheduleFormState>>;
  experienceMode?: ScheduleExperienceMode;
  onExperienceModeChange?: (mode: ScheduleExperienceMode) => void;
  enableVenueSeating?: boolean;
  onEnableVenueSeatingChange?: (enabled: boolean) => void;
  fixedTicketCapacityInput?: string;
  onFixedTicketCapacityInputChange?: (value: string) => void;
  monthPackageEnabled?: boolean;
  onMonthPackageEnabledChange?: (enabled: boolean) => void;
  monthPackagePrice?: string;
  onMonthPackagePriceChange?: (value: string) => void;
  monthPackageLabel?: string;
  onMonthPackageLabelChange?: (value: string) => void;
};

export function ReservationEventScheduleSections({
  value,
  onChange,
  experienceMode,
  onExperienceModeChange,
  enableVenueSeating = false,
  onEnableVenueSeatingChange,
  fixedTicketCapacityInput = "",
  onFixedTicketCapacityInputChange,
  monthPackageEnabled = false,
  onMonthPackageEnabledChange,
  monthPackagePrice = "",
  onMonthPackagePriceChange,
  monthPackageLabel = "",
  onMonthPackageLabelChange,
}: Props) {
  const minDate = todayIsoDateInTimezone();
  const [dateTarget, setDateTarget] = useState<ScheduleDateTarget>(null);
  const [timeTarget, setTimeTarget] = useState<ScheduleTimeTarget>(null);
  const [sectionTimePick, setSectionTimePick] = useState<{
    weekday: number;
    sortOrder: number;
    field: "start" | "end";
  } | null>(null);
  const [bulkBlueprint, setBulkBlueprint] = useState<ClassSectionBlueprint[]>(defaultBlueprint);
  const prevActiveDayCountRef = useRef(0);

  const activeWeekdayList = value.weekdays.filter((w) => w.isActive).map((w) => w.weekday);

  useEffect(() => {
    const count = activeWeekdayList.length;
    if (count >= 2 && prevActiveDayCountRef.current < 2) {
      setBulkBlueprint(
        inferBlueprintFromActiveDays(value.classSections, activeWeekdayList) ??
          defaultBlueprint(),
      );
    }
    prevActiveDayCountRef.current = count;
  }, [activeWeekdayList.join(","), value.classSections]);

  const threeState = experienceMode !== undefined;

  const setMode = (scheduleMode: ReservationEventScheduleMode) => {
    onChange((prev) => ({ ...prev, scheduleMode }));
    onExperienceModeChange?.(scheduleMode);
  };

  // In the 3-state event form, toggling an already-active card turns it off
  // (back to NORMAL). With both off the event is a normal event.
  const toggleMode = (
    scheduleMode: ReservationEventScheduleMode,
    isActive: boolean,
  ) => {
    if (threeState && isActive) {
      onExperienceModeChange?.("NORMAL");
      return;
    }
    setMode(scheduleMode);
  };

  const patch = (partial: Partial<ScheduleFormState>) => {
    onChange((prev) => ({ ...prev, ...partial }));
  };

  const fixedActive = threeState
    ? experienceMode === "FIXED_EVENT"
    : value.scheduleMode === "FIXED_EVENT";
  const recurringActive = threeState
    ? experienceMode === "RECURRING_WEEKLY"
    : value.scheduleMode === "RECURRING_WEEKLY";

  return (
    <>
      <ScheduleModeToggleSection
        title="FIXED EVENT"
        modeValue="FIXED_EVENT"
        active={fixedActive}
        onSelect={() => toggleMode("FIXED_EVENT", fixedActive)}
      >
        <div className="space-y-4">
          <fieldset className="space-y-3 rounded-lg border border-gold/10 p-3">
            <legend className="px-1 text-[10px] font-medium uppercase tracking-wider text-gold/80">
              Sales window (dates only)
            </legend>
            <div className="grid gap-3 sm:grid-cols-2">
              <PickerButton
                label="Sales start"
                display={value.salesStartDate ? formatDateDisplayUs(value.salesStartDate) : ""}
                placeholder="Choose date"
                badge="CALENDAR"
                onClick={() => setDateTarget("salesStart")}
              />
              <PickerButton
                label="Sales end"
                display={value.salesEndDate ? formatDateDisplayUs(value.salesEndDate) : ""}
                placeholder="Choose date"
                badge="CALENDAR"
                onClick={() => setDateTarget("salesEnd")}
              />
            </div>
          </fieldset>

          <fieldset className="space-y-3 rounded-lg border border-gold/10 p-3">
            <legend className="px-1 text-[10px] font-medium uppercase tracking-wider text-gold/80">
              Event night
            </legend>
            <PickerButton
              label="Event date"
              display={value.eventDate ? formatDateDisplayUs(value.eventDate) : ""}
              placeholder="Choose date"
              badge="CALENDAR"
              onClick={() => setDateTarget("eventDay")}
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <PickerButton
                label="Event start time"
                display={value.eventStartTime ? formatTimeDisplayUs(value.eventStartTime) : ""}
                placeholder="Choose time"
                badge="TIME"
                onClick={() => setTimeTarget("eventStart")}
              />
              <PickerButton
                label="Event end time"
                display={value.eventEndTime ? formatTimeDisplayUs(value.eventEndTime) : ""}
                placeholder="Choose time"
                badge="TIME"
                onClick={() => setTimeTarget("eventEnd")}
              />
            </div>
          </fieldset>

          {threeState && onEnableVenueSeatingChange ? (
            <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-gold/15 bg-black/20 p-3">
              <input
                type="checkbox"
                checked={enableVenueSeating}
                onChange={(e) => onEnableVenueSeatingChange(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 accent-gold"
              />
              <span className="min-w-0">
                <span className="block font-brand text-[10px] tracking-[0.12em] text-gold">
                  ASSOCIATE TABLE &amp; SEAT SALES (MESAS Y SILLAS)
                </span>
                <span className="mt-1 block text-xs text-foreground/60">
                  When enabled, the public card goes to the 3D floor plan to buy tables or
                  seats. When off, guests buy a single ticket from the event detail using the
                  event Price field.
                </span>
              </span>
            </label>
          ) : null}

          {threeState && onFixedTicketCapacityInputChange ? (
            <div
              className={`space-y-1.5 rounded-lg border border-gold/10 p-3 ${
                enableVenueSeating ? "opacity-50" : ""
              }`}
            >
              <label
                htmlFor="fixed-ticket-capacity"
                className={`${fieldLabelClass} block`}
              >
                Tickets for sale
              </label>
              <input
                id="fixed-ticket-capacity"
                type="number"
                min={1}
                max={99999}
                step={1}
                inputMode="numeric"
                disabled={enableVenueSeating}
                value={fixedTicketCapacityInput}
                onChange={(e) => onFixedTicketCapacityInputChange(e.target.value)}
                placeholder="e.g. 50"
                className="w-full rounded-lg border border-gold/20 bg-black/30 px-3 py-2 font-body text-sm text-foreground placeholder:text-foreground/40 focus:border-gold/40 focus:outline-none disabled:cursor-not-allowed"
              />
              <p className="text-xs text-foreground/55">
                {enableVenueSeating
                  ? "Seat/table inventory controls capacity."
                  : "Required when table & seat sales are off. Checkout stops when this count is reached."}
              </p>
            </div>
          ) : null}
        </div>
      </ScheduleModeToggleSection>

      <ScheduleModeToggleSection
        title="RECURRING WEEKDAYS (CLASSES)"
        modeValue="RECURRING_WEEKLY"
        active={recurringActive}
        onSelect={() => toggleMode("RECURRING_WEEKLY", recurringActive)}
      >
        <div className="space-y-4">
          <ReservationEventWeekdaySelector
            weekdays={value.weekdays}
            disabled={!recurringActive}
            onChange={(weekdays) => {
              const active = weekdays.filter((w) => w.isActive).map((w) => w.weekday);
              let nextSections = value.classSections.filter((s) =>
                active.includes(s.weekday),
              );
              for (const wd of active) {
                if (!nextSections.some((s) => s.weekday === wd)) {
                  nextSections = [
                    ...nextSections,
                    {
                      weekday: wd,
                      label: "Section 1",
                      startTime: value.recurringStartTime || "10:00",
                      endTime: value.recurringEndTime || "12:00",
                      sortOrder: 0,
                      defaultCapacity: 20,
                      defaultPrice: "",
                    },
                  ];
                }
              }
              patch({ weekdays, classSections: nextSections });
            }}
          />
          {activeWeekdayList.length >= 2 ? (
            <RecurringClassBulkSectionsEditor
              activeWeekdays={activeWeekdayList}
              sections={value.classSections}
              disabled={!recurringActive}
              blueprint={bulkBlueprint}
              onBlueprintChange={setBulkBlueprint}
              onApply={(classSections) => {
                const first = classSections[0];
                patch({
                  classSections,
                  ...(first
                    ? {
                        recurringStartTime: first.startTime,
                        recurringEndTime: first.endTime,
                      }
                    : {}),
                });
              }}
              onPickTime={(sortOrder, field) =>
                setSectionTimePick({
                  weekday: BULK_SECTION_WEEKDAY,
                  sortOrder,
                  field,
                })
              }
            />
          ) : null}
          <RecurringClassSectionsEditor
            activeWeekdays={activeWeekdayList}
            sections={value.classSections}
            disabled={!recurringActive}
            sharedBlueprint={activeWeekdayList.length >= 2 ? bulkBlueprint : null}
            showSharedHint={activeWeekdayList.length >= 2}
            onChange={(classSections) => {
              const first = classSections[0];
              patch({
                classSections,
                ...(first
                  ? {
                      recurringStartTime: first.startTime,
                      recurringEndTime: first.endTime,
                    }
                  : {}),
              });
            }}
            onPickTime={(weekday, sortOrder, field) =>
              setSectionTimePick({ weekday, sortOrder, field })
            }
          />
        </div>
      </ScheduleModeToggleSection>

      {experienceMode === "RECURRING_WEEKLY" && onMonthPackageEnabledChange ? (
        <section className="mt-6 space-y-4 rounded-xl border border-gold/20 bg-black/20 p-4 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="font-brand text-[11px] tracking-[0.16em] text-gold/90 uppercase">
                Full month package
              </h3>
              <p className="mt-1 max-w-xl font-body text-xs leading-relaxed text-foreground/65 sm:text-sm">
                Let clients buy all classes on every active weekday for a calendar month in one
                payment. Price is fixed here, not the sum of individual sessions.
              </p>
            </div>
            <label className="flex min-h-10 cursor-pointer items-center gap-2.5 text-sm text-foreground/85">
              <input
                type="checkbox"
                checked={monthPackageEnabled}
                onChange={(e) => onMonthPackageEnabledChange(e.target.checked)}
                className="h-4 w-4 accent-gold"
              />
              Enable
            </label>
          </div>
          {monthPackageEnabled ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className={`${fieldLabelClass} block`}>Package price (USD)</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={monthPackagePrice}
                  onChange={(e) => onMonthPackagePriceChange?.(e.target.value)}
                  placeholder="e.g. 299.00"
                  className="mt-2 w-full rounded-xl border border-gold/30 px-4 py-3 text-sm text-foreground outline-none focus:border-gold"
                />
              </label>
              <label className="block">
                <span className={`${fieldLabelClass} block`}>Display label (optional)</span>
                <input
                  type="text"
                  value={monthPackageLabel}
                  onChange={(e) => onMonthPackageLabelChange?.(e.target.value)}
                  placeholder="Full month pass"
                  className="mt-2 w-full rounded-xl border border-gold/30 px-4 py-3 text-sm text-foreground outline-none focus:border-gold"
                />
              </label>
            </div>
          ) : null}
        </section>
      ) : null}

      <ReservationEventSchedulePickers
        dateTarget={dateTarget}
        timeTarget={timeTarget}
        salesStartDate={value.salesStartDate}
        salesEndDate={value.salesEndDate}
        eventDate={value.eventDate}
        eventStartTime={value.eventStartTime}
        eventEndTime={value.eventEndTime}
        recurringStartTime={value.recurringStartTime}
        recurringEndTime={value.recurringEndTime}
        minSelectableIso={minDate}
        onCloseDate={() => setDateTarget(null)}
        onCloseTime={() => setTimeTarget(null)}
        onSalesStartDate={(iso) => {
          patch({ salesStartDate: iso });
          setDateTarget(null);
        }}
        onSalesEndDate={(iso) => {
          patch({ salesEndDate: iso });
          setDateTarget(null);
        }}
        onEventDate={(iso) => {
          patch({ eventDate: iso });
          setDateTarget(null);
        }}
        onEventStartTime={(hhmm) => {
          patch({ eventStartTime: hhmm });
          setTimeTarget(null);
        }}
        onEventEndTime={(hhmm) => {
          patch({ eventEndTime: hhmm });
          setTimeTarget(null);
        }}
        onRecurStartTime={(hhmm) => {
          patch({ recurringStartTime: hhmm });
          setTimeTarget(null);
        }}
        onRecurEndTime={(hhmm) => {
          patch({ recurringEndTime: hhmm });
          setTimeTarget(null);
        }}
      />

      {sectionTimePick ? (
        <ContactTimePickerModal
          isOpen
          title={sectionTimePick.field === "start" ? "Section start" : "Section end"}
          value={
            sectionTimePick.weekday === BULK_SECTION_WEEKDAY
              ? (bulkBlueprint.find((s) => s.sortOrder === sectionTimePick.sortOrder)?.[
                  sectionTimePick.field === "start" ? "startTime" : "endTime"
                ] ?? "10:00")
              : (value.classSections.find(
                  (s) =>
                    s.weekday === sectionTimePick.weekday &&
                    s.sortOrder === sectionTimePick.sortOrder,
                )?.[sectionTimePick.field === "start" ? "startTime" : "endTime"] ?? "10:00")
          }
          onClose={() => setSectionTimePick(null)}
          onConfirm={(hhmm) => {
            const { weekday, sortOrder, field } = sectionTimePick;
            if (weekday === BULK_SECTION_WEEKDAY) {
              setBulkBlueprint((prev) =>
                prev.map((s) =>
                  s.sortOrder === sortOrder
                    ? field === "start"
                      ? { ...s, startTime: hhmm }
                      : { ...s, endTime: hhmm }
                    : s,
                ),
              );
              setSectionTimePick(null);
              return;
            }
            const next = value.classSections.map((s) => {
              if (s.weekday !== weekday || s.sortOrder !== sortOrder) return s;
              return field === "start" ? { ...s, startTime: hhmm } : { ...s, endTime: hhmm };
            });
            const first = next[0];
            patch({
              classSections: next,
              ...(first
                ? { recurringStartTime: first.startTime, recurringEndTime: first.endTime }
                : {}),
            });
            setSectionTimePick(null);
          }}
          overlayZClass={ADMIN_NESTED_PICKER_OVERLAY_Z_CLASS}
        />
      ) : null}
    </>
  );
}
