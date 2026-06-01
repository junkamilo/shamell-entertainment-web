import { Pencil, Trash2 } from "lucide-react";
import AdminActiveToggleButton from "@/components/admin/AdminActiveToggleButton";
import { cn } from "@/lib/utils";
import { buildEventTypeSubtitle } from "../lib/eventTypesDisplay";
import { formatLinkedOccasionLine } from "../lib/eventTypesOccasionUtils";
import type { EventTypeItem } from "../types/eventTypes.types";
import EventTypeIcon from "./EventTypeIcon";

type Props = {
  item: EventTypeItem;
  deactivateBlocked: boolean;
  isToggling: boolean;
  onEdit: (item: EventTypeItem) => void;
  onDelete: (item: EventTypeItem) => void;
  onToggleActive: (item: EventTypeItem) => void;
  onBlockedDeactivate: (item: EventTypeItem) => void;
};

export default function EventTypesMobileCard({
  item,
  deactivateBlocked,
  isToggling,
  onEdit,
  onDelete,
  onToggleActive,
  onBlockedDeactivate,
}: Props) {
  const subtitle = buildEventTypeSubtitle(item);
  const occasions = formatLinkedOccasionLine(item.occasionAssignments);

  return (
    <article className="shamell-glass-surface flex min-w-0 flex-col rounded-xl border border-gold/14 p-4">
      <p
        className={cn(
          "flex items-center gap-2 font-brand text-[10px] tracking-[0.16em]",
          item.isActive ? "text-emerald-400/90" : "text-foreground/45",
        )}
      >
        <span className="text-gold/90">•</span>
        {item.isActive ? "ACTIVE" : "INACTIVE"}
      </p>

      <div className="mt-3 flex min-w-0 items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-gold/35 bg-gold/10">
          <EventTypeIcon name={item.name} className="h-4 w-4 text-gold/90" strokeWidth={1.4} />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="truncate font-brand text-base tracking-[0.06em] text-gold" title={item.name}>
            {item.name}
          </h2>
          <p
            className="mt-1 truncate font-body text-xs text-foreground/50"
            title={occasions ?? subtitle}
          >
            {occasions ??
              "No linked occasions — assign them in edit so clients see options in contact."}
          </p>
          <p className="mt-1 truncate font-body text-[10px] text-foreground/40" title={subtitle}>
            {subtitle}
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-end gap-2 border-t border-gold/12 pt-3">
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
          className="rounded-lg border border-red-400/30 p-2 text-red-300/90 transition hover:border-red-400/50 hover:bg-red-500/10"
          aria-label={`Delete ${item.name}`}
          title="Delete permanently"
        >
          <Trash2 className="h-3.5 w-3.5" strokeWidth={1.6} />
        </button>
        <AdminActiveToggleButton
          isActive={item.isActive}
          isToggling={isToggling}
          deactivateBlocked={deactivateBlocked}
          onToggle={() => onToggleActive(item)}
          onBlockedDeactivate={() => onBlockedDeactivate(item)}
          ariaLabel={`${item.isActive ? "Deactivate" : "Activate"} ${item.name}`}
        />
      </div>
    </article>
  );
}
