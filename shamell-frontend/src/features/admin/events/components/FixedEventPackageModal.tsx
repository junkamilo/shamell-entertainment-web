"use client";

import { useEffect, useMemo, useState } from "react";
import { MultiSelect } from "@/components/admin/inputs";
import { MODAL_LAYERS, Modal } from "@/components/admin/overlays";
import {
  fieldLabelClass,
  logisticsPickerTriggerClass,
} from "@/features/admin/agenda/shared/lib/agendaFormStyles";
import ContactTimePickerModal from "@/features/contacto/components/ContactTimePickerModal";
import { parseOptionalPrice } from "@/features/admin/events/lib/eventsPrice";
import { formatTimeDisplayUs } from "@/lib/contacto/contactLogisticsUtils";
import type {
  AdminFixedEventPackage,
  EventActivityForm,
} from "@/features/admin/on-coming-events/fixed-packages/types/fixedEventPackage.types";

type Props = {
  open: boolean;
  onClose: () => void;
  activities: EventActivityForm[];
  /** When true, draft activities (clientKey, no server id) can be selected. */
  allowDraftActivityRefs?: boolean;
  initial?: AdminFixedEventPackage | null;
  onSave: (body: Record<string, unknown>) => Promise<{ ok: boolean; message?: string }>;
};

type TimeTarget = "start" | "end" | null;

const pairedTimeLabelClass = `${fieldLabelClass} block min-h-11 leading-snug`;

function PackageTimePickerButton({
  label,
  display,
  placeholder,
  onClick,
  disabled,
}: {
  label: string;
  display: string;
  placeholder: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <span className={pairedTimeLabelClass}>{label}</span>
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
        <span className="shrink-0 font-brand text-xs tracking-[0.14em] text-gold">TIME</span>
      </button>
    </div>
  );
}

export function FixedEventPackageModal({
  open,
  onClose,
  activities,
  allowDraftActivityRefs = false,
  initial,
  onSave,
}: Props) {
  const [title, setTitle] = useState("");
  const [priceInput, setPriceInput] = useState("");
  const [capacityInput, setCapacityInput] = useState("");
  const [arrivalStartTime, setArrivalStartTime] = useState("18:00");
  const [arrivalEndTime, setArrivalEndTime] = useState("20:00");
  const [activityIds, setActivityIds] = useState<string[]>([]);
  const [timeTarget, setTimeTarget] = useState<TimeTarget>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const selectableActivities = useMemo(
    () =>
      activities.filter((a) => {
        if (!a.title.trim()) return false;
        if (allowDraftActivityRefs) {
          return Boolean(a.clientKey?.trim() || a.id?.trim());
        }
        return Boolean(a.id);
      }),
    [activities, allowDraftActivityRefs],
  );

  const activityOptions = useMemo(
    () =>
      selectableActivities.map((a) => ({
        id: (a.id?.trim() || a.clientKey?.trim())!,
        label: a.title.trim(),
      })),
    [selectableActivities],
  );

  useEffect(() => {
    if (!open) return;
    setTitle(initial?.title ?? "");
    setPriceInput(initial ? (initial.priceCents / 100).toFixed(2) : "");
    setCapacityInput(initial ? String(initial.capacity) : "");
    setArrivalStartTime(initial?.arrivalStartTime ?? "18:00");
    setArrivalEndTime(initial?.arrivalEndTime ?? "20:00");
    setActivityIds(initial?.activityIds ?? []);
    setTimeTarget(null);
    setError(null);
    setSaving(false);
  }, [open, initial]);

  const inclusionPreview = useMemo(() => {
    return activityIds
      .map((id) => activityOptions.find((o) => o.id === id)?.label ?? "")
      .filter(Boolean)
      .join(" + ");
  }, [activityIds, activityOptions]);

  const arrivalPreview = useMemo(() => {
    const start = arrivalStartTime ? formatTimeDisplayUs(arrivalStartTime) : "";
    const end = arrivalEndTime ? formatTimeDisplayUs(arrivalEndTime) : "";
    if (start && end) return `${start} – ${end}`;
    return start || end || "—";
  }, [arrivalStartTime, arrivalEndTime]);

  const resetAndClose = () => {
    setTimeTarget(null);
    setError(null);
    setSaving(false);
    onClose();
  };

  const handleSave = async () => {
    setError(null);
    const price = parseOptionalPrice(priceInput, "create");
    if (!price.ok || price.value == null || price.value < 0.5) {
      setError("Price must be at least $0.50.");
      return;
    }
    const capacity = Number.parseInt(capacityInput.trim(), 10);
    if (!Number.isFinite(capacity) || capacity < 1) {
      setError("Tickets for sale must be at least 1.");
      return;
    }
    if (!title.trim()) {
      setError("Package title is required.");
      return;
    }
    if (activityIds.length === 0) {
      setError("Select at least one activity.");
      return;
    }
    if (!arrivalStartTime.trim()) {
      setError("Arrival start time is required.");
      return;
    }
    if (!arrivalEndTime.trim()) {
      setError("Arrival end time is required.");
      return;
    }
    if (arrivalStartTime.trim() === arrivalEndTime.trim()) {
      setError("Arrival end time must differ from the start time.");
      return;
    }
    setSaving(true);
    const body: Record<string, unknown> = {
      title: title.trim(),
      description: null,
      badge: null,
      priceCents: Math.round(price.value * 100),
      capacity,
      arrivalStartTime,
      arrivalEndTime,
      activityIds,
    };
    const result = await onSave(body);
    setSaving(false);
    if (!result.ok) {
      setError(result.message ?? "Could not save package.");
      return;
    }
    resetAndClose();
  };

  return (
    <>
      <Modal
        isOpen={open}
        onClose={resetAndClose}
        title={initial ? "Edit package" : "Add package"}
      >
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <label className="block">
                <span className={`${fieldLabelClass} block`}>Title</span>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gold/20 bg-black/30 px-3 py-2 text-sm"
                />
              </label>

              <div className="block">
                <span className={`${fieldLabelClass} block`}>Activities</span>
                <p className="mt-0.5 font-body text-[11px] text-foreground/50">
                  Choose one or more activities included in this package.
                </p>
                <MultiSelect
                  className="mt-2"
                  options={activityOptions}
                  value={activityIds}
                  onChange={setActivityIds}
                  emptyDisplay="Select activities"
                  ariaLabel="Activities included in this package"
                  disabled={saving || activityOptions.length === 0}
                  error={
                    activityOptions.length === 0
                      ? allowDraftActivityRefs
                        ? "Add at least one activity above, then create a package."
                        : "Add and save activities first, then create a package."
                      : undefined
                  }
                />
              </div>

              <label className="block">
                <span className={`${fieldLabelClass} block`}>Price</span>
                <input
                  value={priceInput}
                  onChange={(e) => setPriceInput(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gold/20 bg-black/30 px-3 py-2 text-sm"
                />
              </label>

              <label className="block">
                <span className={`${fieldLabelClass} block`}>Tickets for sale</span>
                <input
                  type="number"
                  min={1}
                  value={capacityInput}
                  onChange={(e) => setCapacityInput(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gold/20 bg-black/30 px-3 py-2 text-sm"
                />
              </label>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <PackageTimePickerButton
                  label="Arrival start"
                  display={arrivalStartTime ? formatTimeDisplayUs(arrivalStartTime) : ""}
                  placeholder="Choose time"
                  disabled={saving}
                  onClick={() => setTimeTarget("start")}
                />
                <PackageTimePickerButton
                  label="Arrival end"
                  display={arrivalEndTime ? formatTimeDisplayUs(arrivalEndTime) : ""}
                  placeholder="Choose time"
                  disabled={saving}
                  onClick={() => setTimeTarget("end")}
                />
              </div>
            </div>

            <div className="rounded-lg border border-gold/20 bg-black/25 p-4">
              <p className="font-brand text-[10px] tracking-[0.15em] text-gold">Preview</p>
              <p className="mt-2 font-display text-xl text-foreground">{title || "Package"}</p>
              <p className="mt-1 text-gold">${priceInput || "0.00"}</p>
              <p className="mt-2 text-xs text-foreground/70">
                {inclusionPreview || "No activities selected"}
              </p>
              <p className="mt-2 text-xs text-foreground/60">Arrival: {arrivalPreview}</p>
            </div>
          </div>

          {error ? <p className="text-sm text-red-400">{error}</p> : null}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={resetAndClose}
              className="rounded-lg border border-gold/20 px-4 py-2 text-sm"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={saving || activityOptions.length === 0}
              onClick={() => void handleSave()}
              className="rounded-lg bg-gold px-4 py-2 text-sm font-medium text-black disabled:opacity-50"
            >
              Save package
            </button>
          </div>
        </div>
      </Modal>

      <ContactTimePickerModal
        isOpen={timeTarget === "start"}
        title="Arrival start time"
        value={arrivalStartTime}
        onClose={() => setTimeTarget(null)}
        onConfirm={(hhmm) => {
          setArrivalStartTime(hhmm);
          setTimeTarget(null);
        }}
        overlayZClass={MODAL_LAYERS.nestedPicker}
      />
      <ContactTimePickerModal
        isOpen={timeTarget === "end"}
        title="Arrival end time"
        value={arrivalEndTime}
        onClose={() => setTimeTarget(null)}
        onConfirm={(hhmm) => {
          setArrivalEndTime(hhmm);
          setTimeTarget(null);
        }}
        overlayZClass={MODAL_LAYERS.nestedPicker}
      />
    </>
  );
}
