"use client";

import { useCallback, useEffect, useState } from "react";
import { getAdminBearerToken } from "@/app/admin/shared/lib/adminAuth";
import {
  fieldLabelClass,
  logisticsPickerTriggerClass,
} from "@/app/shamell-admin/agenda/agendar/lib/agendarStyles";
import {
  formatDateDisplayUs,
  formatTimeDisplayUs,
} from "@/lib/contactLogisticsUtils";
import { toast } from "@/hooks/use-toast";
import {
  combineDateAndTime,
  splitIsoToDateAndTime,
} from "../lib/reservationDateTimeFields";
import { patchAdminVenueLayoutSettings } from "../services/patchAdminVenueLayoutSettings";
import type { VenueLayoutClientSettings } from "../types/venueLayoutPromo.types";
import {
  VenueLayoutReservationPickers,
  type VenueLayoutDatePickerTarget,
  type VenueLayoutTimePickerTarget,
} from "./VenueLayoutReservationPickers";

type Props = {
  settings: VenueLayoutClientSettings | null;
  onSaved: (settings: VenueLayoutClientSettings) => void;
};

const textInputClass =
  "mt-1 w-full rounded-lg border border-gold/20 bg-black/30 px-3 py-2 text-sm text-foreground";

function PickerButton({
  label,
  display,
  placeholder,
  badge,
  onClick,
}: {
  label: string;
  display: string;
  placeholder: string;
  badge: "CALENDAR" | "TIME";
  onClick: () => void;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <span className={`${fieldLabelClass} block`}>{label}</span>
      <button type="button" onClick={onClick} className={logisticsPickerTriggerClass}>
        <span
          className={`font-body text-sm ${display ? "text-foreground" : "text-foreground/50"}`}
        >
          {display || placeholder}
        </span>
        <span className="shrink-0 font-brand text-xs tracking-[0.14em] text-gold">
          {badge}
        </span>
      </button>
    </div>
  );
}

export function VenueLayoutReservationEventCard({ settings, onSaved }: Props) {
  const [eventLabel, setEventLabel] = useState("");
  const [openDate, setOpenDate] = useState("");
  const [openTime, setOpenTime] = useState("");
  const [closeDate, setCloseDate] = useState("");
  const [closeTime, setCloseTime] = useState("");
  const [datePickerTarget, setDatePickerTarget] = useState<VenueLayoutDatePickerTarget>(null);
  const [timePickerTarget, setTimePickerTarget] = useState<VenueLayoutTimePickerTarget>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setEventLabel(settings?.reservationEventLabel ?? "");
    const open = splitIsoToDateAndTime(
      settings?.reservationEventDate ?? settings?.reservationOpensAt,
    );
    const close = splitIsoToDateAndTime(settings?.reservationClosesAt);
    setOpenDate(open.date);
    setOpenTime(open.time);
    setCloseDate(close.date);
    setCloseTime(close.time);
  }, [
    settings?.reservationEventDate,
    settings?.reservationEventLabel,
    settings?.reservationOpensAt,
    settings?.reservationClosesAt,
  ]);

  const onSave = useCallback(async () => {
    const token = getAdminBearerToken();
    if (!token) return;

    const opensAt = combineDateAndTime(openDate, openTime);
    const closesAt = combineDateAndTime(closeDate, closeTime);

    if (openDate && !opensAt) {
      toast({
        variant: "destructive",
        title: "Invalid start date",
        description: "Check the sales open date and time.",
      });
      return;
    }
    if (closeDate && !closesAt) {
      toast({
        variant: "destructive",
        title: "Invalid end date",
        description: "Check the sales close date and time.",
      });
      return;
    }
    if (opensAt && closesAt && new Date(closesAt).getTime() <= new Date(opensAt).getTime()) {
      toast({
        variant: "destructive",
        title: "Invalid sales window",
        description: "Sales close must be after sales open.",
      });
      return;
    }

    setIsSaving(true);
    const result = await patchAdminVenueLayoutSettings(token, {
      reservationEventLabel: eventLabel.trim() || undefined,
      reservationOpensAt: opensAt,
      reservationClosesAt: closesAt,
    });
    setIsSaving(false);

    if (!result.ok || !result.settings) {
      toast({
        variant: "destructive",
        title: "Could not save event",
        description: result.message ?? "Try again.",
      });
      return;
    }

    onSaved(result.settings);
    toast({ title: "Reservation event saved" });
  }, [closeDate, closeTime, eventLabel, onSaved, openDate, openTime]);

  const openDateDisplay = openDate ? formatDateDisplayUs(openDate) : "";
  const closeDateDisplay = closeDate ? formatDateDisplayUs(closeDate) : "";
  const openTimeDisplay = openTime ? formatTimeDisplayUs(openTime) : "";
  const closeTimeDisplay = closeTime ? formatTimeDisplayUs(closeTime) : "";

  return (
    <>
      <div className="space-y-4">
        <label className="block text-xs text-foreground/70">
          Event label (shown on site)
          <input
            type="text"
            value={eventLabel}
            onChange={(e) => setEventLabel(e.target.value)}
            placeholder="Gala — March 15, 2026"
            className={textInputClass}
            maxLength={200}
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <fieldset className="space-y-3 rounded-xl border border-gold/12 p-4">
            <legend className="px-1 text-xs font-medium uppercase tracking-wider text-gold/90">
              Sales open
            </legend>
            <PickerButton
              label="Start date"
              display={openDateDisplay}
              placeholder="Choose date"
              badge="CALENDAR"
              onClick={() => setDatePickerTarget("open")}
            />
            <PickerButton
              label="Start time"
              display={openTimeDisplay}
              placeholder="Choose time"
              badge="TIME"
              onClick={() => setTimePickerTarget("open")}
            />
          </fieldset>

          <fieldset className="space-y-3 rounded-xl border border-gold/12 p-4">
            <legend className="px-1 text-xs font-medium uppercase tracking-wider text-gold/90">
              Sales close
            </legend>
            <PickerButton
              label="End date"
              display={closeDateDisplay}
              placeholder="Choose date"
              badge="CALENDAR"
              onClick={() => setDatePickerTarget("close")}
            />
            <PickerButton
              label="End time"
              display={closeTimeDisplay}
              placeholder="Choose time"
              badge="TIME"
              onClick={() => setTimePickerTarget("close")}
            />
          </fieldset>
        </div>

        <button
          type="button"
          disabled={isSaving}
          onClick={() => void onSave()}
          className="rounded-lg bg-gold px-4 py-2 text-xs font-semibold uppercase tracking-wider text-black hover:bg-gold-light disabled:opacity-60"
        >
          {isSaving ? "Saving…" : "Save event"}
        </button>
      </div>

      <VenueLayoutReservationPickers
        datePickerTarget={datePickerTarget}
        timePickerTarget={timePickerTarget}
        openDate={openDate}
        closeDate={closeDate}
        openTime={openTime}
        closeTime={closeTime}
        onCloseDatePicker={() => setDatePickerTarget(null)}
        onCloseTimePicker={() => setTimePickerTarget(null)}
        onConfirmOpenDate={(iso) => {
          setOpenDate(iso);
          setDatePickerTarget(null);
        }}
        onConfirmCloseDate={(iso) => {
          setCloseDate(iso);
          setDatePickerTarget(null);
        }}
        onConfirmOpenTime={(hhmm) => {
          setOpenTime(hhmm);
          setTimePickerTarget(null);
        }}
        onConfirmCloseTime={(hhmm) => {
          setCloseTime(hhmm);
          setTimePickerTarget(null);
        }}
      />
    </>
  );
}
