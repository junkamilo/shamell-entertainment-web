import { Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { buildServiceTypeSubtitle } from "../lib/serviceTypesDisplay";
import type { ServiceTypeItem } from "../types/serviceTypes.types";
import ServiceTypeIcon from "./ServiceTypeIcon";

type Props = {
  item: ServiceTypeItem;
  deletable: boolean;
  blockDeactivate: boolean;
  isToggling: boolean;
  deleteBlockedTitle: string;
  onEdit: (item: ServiceTypeItem) => void;
  onDelete: (item: ServiceTypeItem) => void;
  onToggleActive: (item: ServiceTypeItem) => void;
};

export default function ServiceTypesCard({
  item,
  deletable,
  blockDeactivate,
  isToggling,
  deleteBlockedTitle,
  onEdit,
  onDelete,
  onToggleActive,
}: Props) {
  const subtitle = buildServiceTypeSubtitle(item);

  return (
    <article className="shamell-glass-surface relative flex flex-col rounded-2xl border border-gold/16 p-4">
      <p
        className={cn(
          "flex items-center gap-2 font-brand text-[10px] tracking-[0.16em]",
          item.isActive ? "text-emerald-400/90" : "text-foreground/45",
        )}
      >
        <span className="text-gold/90">•</span>
        {item.isActive ? "ACTIVE" : "INACTIVE"}
      </p>

      <div className="mt-4 flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-gold/35 bg-gold/10">
          <ServiceTypeIcon name={item.name} />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="font-brand text-lg tracking-[0.06em] text-gold md:text-xl">{item.name}</h2>
          <p className="mt-1 font-body text-xs leading-relaxed text-foreground/50">{subtitle}</p>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-end gap-2 border-t border-gold/12 pt-4">
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
          title={!deletable ? deleteBlockedTitle : "Delete permanently"}
        >
          <Trash2 className="h-3.5 w-3.5" strokeWidth={1.6} />
        </button>
        <button
          type="button"
          onClick={() => onToggleActive(item)}
          disabled={isToggling || blockDeactivate}
          title={blockDeactivate ? "Linked services exist; cannot turn off." : undefined}
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
    </article>
  );
}
