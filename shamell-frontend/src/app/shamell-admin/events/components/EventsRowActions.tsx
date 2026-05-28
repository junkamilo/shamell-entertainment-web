import { Eye, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AdminEvent } from "../types/events.types";

type Props = {
  item: AdminEvent;
  deletable: boolean;
  blockDeactivate: boolean;
  isToggling: boolean;
  onView: (item: AdminEvent) => void;
  onEdit: (item: AdminEvent) => void;
  onDelete: (item: AdminEvent) => void;
  onToggleActive: (item: AdminEvent) => void;
  layout?: "mobile" | "table";
};

export function EventsStatusToggle({
  item,
  blockDeactivate,
  isToggling,
  onToggleActive,
}: Pick<Props, "item" | "blockDeactivate" | "isToggling" | "onToggleActive">) {
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => onToggleActive(item)}
        disabled={isToggling || blockDeactivate}
        title={blockDeactivate ? "This event has bookings and cannot be turned off." : undefined}
        className={cn(
          "relative h-7 w-12 shrink-0 rounded-full border transition",
          item.isActive
            ? "border-emerald-400/45 bg-emerald-500/22"
            : "border-gold/40 bg-gold/10 ring-1 ring-gold/20",
          isToggling && "cursor-not-allowed opacity-60",
          blockDeactivate && "cursor-not-allowed opacity-45",
        )}
        aria-label={`${item.isActive ? "Hide" : "Show"} event`}
      >
        <span
          className={cn(
            "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition",
            item.isActive ? "left-6" : "left-1",
          )}
        />
      </button>
      <span className="font-body text-xs text-foreground/55">{item.isActive ? "Active" : "Hidden"}</span>
    </div>
  );
}

export function EventsActionButtons({
  item,
  deletable,
  onView,
  onEdit,
  onDelete,
  layout = "table",
}: Pick<Props, "item" | "deletable" | "onView" | "onEdit" | "onDelete" | "layout">) {
  const bk = item.bookingCount ?? 0;
  const btnClass =
    layout === "mobile"
      ? "rounded-lg border border-gold/18 p-2 text-foreground/55 transition hover:border-gold/35 hover:bg-gold/10 hover:text-gold"
      : "rounded-lg border border-gold/18 p-2 text-foreground/55 transition hover:border-gold/35 hover:bg-gold/10 hover:text-gold";

  return (
    <div className={cn("flex gap-1", layout === "table" && "justify-end")}>
      <button type="button" onClick={() => onView(item)} className={btnClass} aria-label="View event">
        <Eye className="h-4 w-4" strokeWidth={1.5} />
      </button>
      <button type="button" onClick={() => onEdit(item)} className={btnClass} aria-label="Edit event">
        <Pencil className="h-4 w-4" strokeWidth={1.5} />
      </button>
      <button
        type="button"
        onClick={() => onDelete(item)}
        disabled={!deletable}
        className={cn(
          "rounded-lg border p-2 transition",
          deletable
            ? "border-red-400/25 text-foreground/55 hover:border-red-400/45 hover:bg-red-500/10 hover:text-red-300"
            : "cursor-not-allowed border-gold/10 text-foreground/30",
        )}
        aria-label="Delete event permanently"
        title={
          !deletable ?
            bk > 0 ?
              "Has linked bookings"
            : "Cannot delete"
          : "Delete from catalog (cannot undo)"
        }
      >
        <Trash2 className="h-4 w-4" strokeWidth={1.5} />
      </button>
    </div>
  );
}
