import { TableTruncatedText, TableRowActions, adminTableIconBtnClass, adminTableIconBtnDangerClass } from "@/components/admin/data-display";
import { Armchair, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatStandaloneChairShortId } from "../lib/mapStandaloneChairFromApi";
import { formatPriceEn } from "../lib/parseVenueTablePrice";
import {
  standaloneChairRowClassName,
  standaloneChairStatusBadgeClass,
  standaloneChairStatusLabel,
} from "../lib/standaloneChairsStatusStyles";
import type { StandaloneChairInventoryItem } from "../types/standaloneChairs.types";

type Props = {
  item: StandaloneChairInventoryItem;
  onEdit: (item: StandaloneChairInventoryItem) => void;
  onDelete: (item: StandaloneChairInventoryItem) => void;
};

export default function StandaloneChairsMobileCard({ item, onEdit, onDelete }: Props) {
  return (
    <article
      className={cn(
        "shamell-glass-surface flex min-w-0 items-center gap-3 overflow-hidden rounded-xl border border-gold/14 p-4",
        !item.isActive && "opacity-60",
        standaloneChairRowClassName(item.isReserved),
      )}
    >
      <div
        className={cn(
          "flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border",
          item.isReserved
            ? "border-emerald-400/35 bg-emerald-500/10"
            : "border-gold/22 bg-gold/10",
        )}
      >
        <Armchair
          className={cn("h-4 w-4", item.isReserved ? "text-emerald-200/90" : "text-gold/85")}
          strokeWidth={1.4}
        />
      </div>
      <div className="min-w-0 flex-1 overflow-hidden">
        <div className="flex flex-wrap items-center gap-2">
          <TableTruncatedText primary={item.displayLabel} />
          <span className={standaloneChairStatusBadgeClass(item.isReserved)}>
            {standaloneChairStatusLabel(item.isReserved)}
          </span>
        </div>
        <p className="mt-1 font-body text-xs text-foreground/65">
          {formatPriceEn(item.unitPrice)} each · {formatStandaloneChairShortId(item.id)}
        </p>
      </div>
      <TableRowActions className="shrink-0">
        <button
          type="button"
          onClick={() => onEdit(item)}
          className={adminTableIconBtnClass}
          aria-label={`Edit price for ${item.displayLabel}`}
        >
          <Pencil className="h-4 w-4" strokeWidth={1.5} />
        </button>
        <button
          type="button"
          onClick={() => onDelete(item)}
          className={adminTableIconBtnDangerClass}
          aria-label={`Delete ${item.displayLabel}`}
        >
          <Trash2 className="h-4 w-4" strokeWidth={1.5} />
        </button>
      </TableRowActions>
    </article>
  );
}
