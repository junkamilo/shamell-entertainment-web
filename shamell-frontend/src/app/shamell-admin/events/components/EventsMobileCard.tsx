import { Calendar, Eye, Pencil, Trash2 } from "lucide-react";
import AdminActiveToggleButton from "@/components/admin/AdminActiveToggleButton";
import AdminTableTruncatedText from "@/components/admin/AdminTableTruncatedText";
import { cn } from "@/lib/utils";
import { displayEventHeading, pillClassForTypeName } from "../lib/eventsDisplay";
import { formatPriceEn } from "../lib/eventsPrice";
import type { AdminEvent } from "../types/events.types";

type Props = {
  item: AdminEvent;
  togglingId: string | null;
  deactivateBlocked: boolean;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onToggleActive: () => void;
  onBlockedDeactivate: () => void;
};

export default function EventsMobileCard({
  item,
  togglingId,
  deactivateBlocked,
  onView,
  onEdit,
  onDelete,
  onToggleActive,
  onBlockedDeactivate,
}: Props) {
  const { title, subtitle } = displayEventHeading(item.description);
  const bk = item.bookingCount ?? 0;

  return (
    <article
      className={cn(
        "shamell-glass-surface flex min-w-0 flex-col gap-3 overflow-hidden rounded-xl border border-gold/14 p-4",
        !item.isActive && "opacity-60",
      )}
    >
      <div className="flex min-w-0 gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-gold/22 bg-gold/10">
          <Calendar className="h-4 w-4 text-gold/85" strokeWidth={1.4} />
        </div>
        <div className="min-w-0 flex-1 overflow-hidden">
          <AdminTableTruncatedText primary={title} secondary={subtitle || undefined} />
          {bk > 0 ? (
            <p className="mt-1 font-body text-[10px] leading-snug text-foreground/45">
              {bk === 1 ? "1 booking" : `${bk} bookings`}
            </p>
          ) : null}
          <span
            className={cn(
              "mt-2 inline-block max-w-full truncate rounded-full border px-2.5 py-1 font-body text-[11px]",
              pillClassForTypeName(item.eventTypeName),
            )}
            title={item.eventTypeName}
          >
            {item.eventTypeName}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 border-t border-gold/10 pt-3">
        <div className="font-body text-xs text-foreground/70">
          <span className="block font-brand text-[10px] tracking-[0.12em] text-gold/65">ITEMS</span>
          <span className="mt-0.5 block text-sm text-foreground/85">{item.items.length}</span>
        </div>
        <div className="font-body text-xs text-foreground/70">
          <span className="block font-brand text-[10px] tracking-[0.12em] text-gold/65">PRICE</span>
          <span className="mt-0.5 block text-sm text-foreground/85">{formatPriceEn(item.price)}</span>
        </div>
        <div className="col-span-2 flex min-w-0 items-center justify-between gap-3 rounded-lg border border-gold/10 bg-black/15 px-3 py-2">
          <span className="shrink-0 font-body text-xs text-foreground/55">
            {item.isActive ? "Active" : "Hidden"}
          </span>
          <AdminActiveToggleButton
            isActive={item.isActive}
            isToggling={togglingId === item.id}
            deactivateBlocked={deactivateBlocked}
            onToggle={onToggleActive}
            onBlockedDeactivate={onBlockedDeactivate}
            ariaLabel={`${item.isActive ? "Deactivate" : "Activate"} event`}
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 border-t border-gold/10 pt-3">
        <button
          type="button"
          onClick={onView}
          className="flex min-h-11 items-center justify-center rounded-lg border border-gold/18 text-foreground/55 transition hover:border-gold/35 hover:bg-gold/10 hover:text-gold"
          aria-label="View event"
        >
          <Eye className="h-4 w-4" strokeWidth={1.5} />
        </button>
        <button
          type="button"
          onClick={onEdit}
          className="flex min-h-11 items-center justify-center rounded-lg border border-gold/18 text-foreground/55 transition hover:border-gold/35 hover:bg-gold/10 hover:text-gold"
          aria-label="Edit event"
        >
          <Pencil className="h-4 w-4" strokeWidth={1.5} />
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="flex min-h-11 items-center justify-center rounded-lg border border-red-400/25 text-foreground/55 transition hover:border-red-400/45 hover:bg-red-500/10 hover:text-red-300"
          aria-label="Delete event permanently"
          title="Delete from catalog (cannot undo)"
        >
          <Trash2 className="h-4 w-4" strokeWidth={1.5} />
        </button>
      </div>
    </article>
  );
}
