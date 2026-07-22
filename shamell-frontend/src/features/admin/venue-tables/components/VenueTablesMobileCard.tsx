import { TableTruncatedText } from "@/components/admin/data-display";
import { LayoutGrid, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPriceEn } from "../lib/parseVenueTablePrice";
import {
  formatVenueTableAdminSubtitle,
  formatVenueTableDisplayLabel,
  TABLE_SIZE_CONFIG,
} from "../lib/tableSizeConfig";
import type { VenueTableConfig } from "../types/venueTables.types";

type Props = {
  item: VenueTableConfig;
  onEdit: () => void;
  onDeactivate: () => void;
};

export default function VenueTablesMobileCard({ item, onEdit, onDeactivate }: Props) {
  const sizeLabel = TABLE_SIZE_CONFIG[item.size].label;

  return (
    <article className="shamell-glass-surface flex min-w-0 flex-col gap-3 overflow-hidden rounded-xl border border-gold/14 p-4">
      <div className="flex min-w-0 gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-gold/22 bg-gold/10">
          <LayoutGrid className="h-4 w-4 text-gold/85" strokeWidth={1.4} />
        </div>
        <div className="min-w-0 flex-1 overflow-hidden">
          <TableTruncatedText
            primary={formatVenueTableDisplayLabel(item)}
            secondary={formatVenueTableAdminSubtitle(item)}
          />
          <span
            className={cn(
              "mt-2 inline-block max-w-full truncate rounded-full border border-gold/40 px-2.5 py-1 font-body text-[11px] uppercase tracking-wide text-gold",
            )}
            title={sizeLabel}
          >
            {sizeLabel}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 border-t border-gold/10 pt-3">
        <div className="font-body text-xs text-foreground/70">
          <span className="block font-brand text-[10px] tracking-[0.12em] text-gold/65">CHAIRS</span>
          <span className="mt-0.5 block text-sm text-foreground/85">{item.includedChairs}</span>
        </div>
        <div className="font-body text-xs text-foreground/70">
          <span className="block font-brand text-[10px] tracking-[0.12em] text-gold/65">COMBO</span>
          <span className="mt-0.5 block text-sm text-foreground/85">
            {formatPriceEn(item.bundlePrice)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 border-t border-gold/10 pt-3">
        <button
          type="button"
          onClick={onEdit}
          className="flex min-h-11 items-center justify-center gap-1 rounded-lg border border-gold/18 font-body text-xs text-foreground/55 transition hover:border-gold/35 hover:bg-gold/10 hover:text-gold"
        >
          <Pencil className="h-4 w-4" strokeWidth={1.5} />
          Edit
        </button>
        <button
          type="button"
          onClick={onDeactivate}
          className="flex min-h-11 items-center justify-center gap-1 rounded-lg border border-red-400/25 font-body text-xs text-foreground/55 transition hover:border-red-400/45 hover:bg-red-500/10 hover:text-red-300"
        >
          <Trash2 className="h-4 w-4" strokeWidth={1.5} />
          Deactivate
        </button>
      </div>
    </article>
  );
}
