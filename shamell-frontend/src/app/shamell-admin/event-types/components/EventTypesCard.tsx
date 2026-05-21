import { Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { buildEventTypeUsageLine, formatRelativeEn } from "../lib/eventTypesDisplay";
import EventTypeIcon from "./EventTypeIcon";
import { formatLinkedOccasionLine } from "../lib/eventTypesOccasionUtils";
import type { EventTypeItem } from "../types/eventTypes.types";

type Props = {
  item: EventTypeItem;
  deletable: boolean;
  blockDeactivate: boolean;
  isToggling: boolean;
  onEdit: (item: EventTypeItem) => void;
  onDelete: (item: EventTypeItem) => void;
  onToggleActive: (item: EventTypeItem) => void;
};

export default function EventTypesCard({
  item,
  deletable,
  blockDeactivate,
  isToggling,
  onEdit,
  onDelete,
  onToggleActive,
}: Props) {
  const usageLine = buildEventTypeUsageLine(item);
  const occasionSummary = formatLinkedOccasionLine(item.occasionAssignments);

  return (
    <article className="shamell-glass-surface relative flex flex-col rounded-2xl border border-gold/16 p-4">
      <div className="flex items-start gap-2">
        <p
          className={cn(
            "flex items-center gap-2 font-brand text-[10px] tracking-[0.16em]",
            item.isActive ? "text-emerald-400/90" : "text-foreground/45",
          )}
        >
          <span className="text-gold/90">•</span>
          {item.isActive ? "ACTIVE" : "INACTIVE"}
        </p>
      </div>

      <div className="mt-4 flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-gold/35 bg-gold/10">
          <EventTypeIcon name={item.name} />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="font-brand text-lg tracking-[0.06em] text-gold md:text-xl">{item.name}</h2>
          <p className="mt-1 font-body text-xs leading-relaxed text-foreground/50">
            {occasionSummary ??
              "No linked occasions: the contact form will not show lists for this type until you edit and assign occasions."}
          </p>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-gold/12 pt-4 font-body text-[11px] text-foreground/45">
        <span className="min-w-0 flex-1 basis-full sm:basis-auto">{usageLine}</span>
        <span className="hidden text-gold/25 sm:inline">·</span>
        <span>{formatRelativeEn(item.updatedAt ?? item.createdAt)}</span>
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => onEdit(item)}
            className="rounded-lg border border-gold/22 p-2 text-foreground/65 transition hover:bg-gold/10 hover:text-gold"
            aria-label={`Edit ${item.name}`}
          >
            <Pencil className="h-3.5 w-3.5" strokeWidth={1.6} />
          </button>
          <button
            type="button"
            onClick={() => onDelete(item)}
            disabled={!deletable}
            className={cn(
              "rounded-lg border p-2 transition",
              deletable
                ? "border-red-400/30 text-red-300/90 hover:border-red-400/50 hover:bg-red-500/10"
                : "cursor-not-allowed border-gold/10 text-foreground/30",
            )}
            aria-label={`Delete ${item.name}`}
            title={
              !deletable
                ? "Has catalog events, bookings, or gallery photos linked"
                : "Delete from catalog (occasion links are removed)"
            }
          >
            <Trash2 className="h-3.5 w-3.5" strokeWidth={1.6} />
          </button>
          <button
            type="button"
            onClick={() => onToggleActive(item)}
            disabled={isToggling || blockDeactivate}
            title={
              blockDeactivate
                ? "Catalog, bookings, or photos are linked; cannot turn off."
                : undefined
            }
            className={cn(
              "relative h-7 w-12 shrink-0 rounded-full border transition",
              item.isActive
                ? "border-emerald-400/45 bg-emerald-500/22"
                : "border-gold/40 bg-gold/10 ring-1 ring-gold/20",
              isToggling && "cursor-not-allowed opacity-60",
              blockDeactivate && "cursor-not-allowed opacity-45",
            )}
            aria-label={`${item.isActive ? "Hide" : "Show"} ${item.name}`}
          >
            <span
              className={cn(
                "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition",
                item.isActive ? "left-6" : "left-1",
              )}
            />
          </button>
        </div>
      </div>
    </article>
  );
}
