import { Pencil, Sparkles, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { OccasionTypeItem } from "../types/occasionTypes.types";

type Props = {
  item: OccasionTypeItem;
  deletable: boolean;
  blockDeactivate: boolean;
  togglingId: string | null;
  onEdit: (item: OccasionTypeItem) => void;
  onDelete: (item: OccasionTypeItem) => void;
  onToggleActive: (item: OccasionTypeItem) => void;
};

export default function OccasionTypesRow({
  item,
  deletable,
  blockDeactivate,
  togglingId,
  onEdit,
  onDelete,
  onToggleActive,
}: Props) {
  return (
    <div className="shamell-glass-surface flex items-center gap-3 rounded-xl border border-gold/14 px-4 py-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gold/30 bg-gold/10">
        <Sparkles className="h-4 w-4 text-gold/90" strokeWidth={1.4} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-brand text-sm tracking-wide text-gold">{item.name}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
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
              ? "Bookings are linked"
              : "Delete from catalog (also removes links on event types)"
          }
        >
          <Trash2 className="h-3.5 w-3.5" strokeWidth={1.6} />
        </button>
        <button
          type="button"
          onClick={() => onToggleActive(item)}
          disabled={togglingId === item.id || blockDeactivate}
          title={blockDeactivate ? "Bookings are linked; cannot turn off." : undefined}
          className={cn(
            "relative h-7 w-12 shrink-0 rounded-full border transition",
            item.isActive
              ? "border-emerald-400/45 bg-emerald-500/22"
              : "border-gold/40 bg-gold/10 ring-1 ring-gold/20",
            togglingId === item.id && "cursor-not-allowed opacity-60",
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
  );
}
