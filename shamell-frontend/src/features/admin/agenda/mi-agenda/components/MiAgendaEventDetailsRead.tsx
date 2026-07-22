import { CalendarDays, Clock3, MapPin, Package, UserRound } from "lucide-react";
import { bookingServiceDisplayLine } from "@/lib/adminBookingDisplay";
import { RANGE_LABEL } from "../lib/miAgendaConstants";
import {
  displayName,
  durationLabel,
  eventChipLabel,
  eventTypeLabel,
} from "../lib/miAgendaBookingUtils";
import type { EnrichedBooking } from "../types/miAgenda.types";

type Props = {
  selected: EnrichedBooking;
};

export default function MiAgendaEventDetailsRead({ selected }: Props) {
  return (
    <>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="rounded-full border border-gold/25 bg-gold/10 px-2 py-0.5 font-brand text-[10px] tracking-widest text-gold">
          {eventChipLabel(selected)}
        </span>
        <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2 py-0.5 font-brand text-[10px] tracking-widest text-emerald-200">
          {selected.status}
        </span>
      </div>

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
  );
}
