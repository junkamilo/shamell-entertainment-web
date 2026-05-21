import { Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  eventTitleForTablePreview,
  firstLineOfEventDescription,
  pillClassForTypeName,
} from "../lib/eventsDisplay";
import { formatPriceEn } from "../lib/eventsPrice";
import type { AdminEvent } from "../types/events.types";
import { EventsActionButtons, EventsStatusToggle } from "./EventsRowActions";

type Props = {
  item: AdminEvent;
  deletable: boolean;
  blockDeactivate: boolean;
  isToggling: boolean;
  onView: (item: AdminEvent) => void;
  onEdit: (item: AdminEvent) => void;
  onDelete: (item: AdminEvent) => void;
  onToggleActive: (item: AdminEvent) => void;
};

export default function EventsMobileCard({
  item,
  deletable,
  blockDeactivate,
  isToggling,
  onView,
  onEdit,
  onDelete,
  onToggleActive,
}: Props) {
  const titlePreview = eventTitleForTablePreview(item.description);
  const titleFull = firstLineOfEventDescription(item.description) || "No description";

  return (
    <article
      className={cn("rounded-xl border border-gold/18 bg-black/20 p-4", !item.isActive && "opacity-60")}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 gap-2.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-gold/22 bg-gold/10">
            <Calendar className="h-4 w-4 text-gold/85" strokeWidth={1.4} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-brand text-sm leading-snug tracking-[0.04em] text-gold line-clamp-2">
              <span title={titleFull !== titlePreview ? titleFull : undefined}>{titlePreview}</span>
            </p>
            <div className="mt-2">
              <span
                className={cn(
                  "inline-flex max-w-full truncate rounded-full border px-2.5 py-1 font-body text-[11px]",
                  pillClassForTypeName(item.eventTypeName),
                )}
              >
                {item.eventTypeName}
              </span>
            </div>
          </div>
        </div>
        <EventsActionButtons
          item={item}
          deletable={deletable}
          onView={onView}
          onEdit={onEdit}
          onDelete={onDelete}
          layout="mobile"
        />
      </div>
      <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 border-t border-gold/10 pt-3 font-body text-xs text-foreground/70">
        <div>
          <span className="font-brand text-[9px] tracking-[0.14em] text-gold/65">ITEMS</span>
          <p className="mt-0.5 text-sm text-foreground/80">{item.items.length}</p>
        </div>
        <div>
          <span className="font-brand text-[9px] tracking-[0.14em] text-gold/65">PRICE</span>
          <p className="mt-0.5 text-sm text-foreground/80">{formatPriceEn(item.price)}</p>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between gap-3 border-t border-gold/10 pt-3">
        <span className="font-brand text-[9px] tracking-[0.14em] text-gold/65">STATUS</span>
        <EventsStatusToggle
          item={item}
          blockDeactivate={blockDeactivate}
          isToggling={isToggling}
          onToggleActive={onToggleActive}
        />
      </div>
    </article>
  );
}
