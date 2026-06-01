import { Pencil, Trash2 } from "lucide-react";
import AdminActiveToggleButton from "@/components/admin/AdminActiveToggleButton";
import { cn } from "@/lib/utils";
import { buildServiceTypeSubtitle } from "../lib/serviceTypesDisplay";
import type { ServiceTypeItem } from "../types/serviceTypes.types";
import ServiceTypeIcon from "./ServiceTypeIcon";

type Props = {
  item: ServiceTypeItem;
  deactivateBlocked: boolean;
  isToggling: boolean;
  onEdit: (item: ServiceTypeItem) => void;
  onDelete: (item: ServiceTypeItem) => void;
  onToggleActive: (item: ServiceTypeItem) => void;
  onBlockedDeactivate: (item: ServiceTypeItem) => void;
};

export default function ServiceTypesMobileCard({
  item,
  deactivateBlocked,
  isToggling,
  onEdit,
  onDelete,
  onToggleActive,
  onBlockedDeactivate,
}: Props) {
  const subtitle = buildServiceTypeSubtitle(item);

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
          <ServiceTypeIcon name={item.name} />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="truncate font-brand text-base tracking-[0.06em] text-gold" title={item.name}>
            {item.name}
          </h2>
          <p className="mt-1 truncate font-body text-xs text-foreground/50" title={subtitle}>
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
