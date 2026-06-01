"use client";

import { Trash2 } from "lucide-react";
import { useMemo } from "react";
import { formatPriceEn } from "../lib/parseVenueTablePrice";
import { TABLE_SIZE_CONFIG } from "../lib/tableSizeConfig";
import type { TableSize, VenueTableConfig } from "../types/venueTables.types";
import VenueTablesMobileCard from "./VenueTablesMobileCard";
import VenueTablesTable from "./VenueTablesTable";

type Props = {
  sizeFilter: "ALL" | TableSize;
  /** Full active set (for ALL summary metrics). */
  activeItems: VenueTableConfig[];
  /** Items in the current filter view (for summary + table list). */
  viewItems: VenueTableConfig[];
  visibleItems: VenueTableConfig[];
  onEdit: (item: VenueTableConfig) => void;
  onDeactivate: (item: VenueTableConfig) => void;
  onDeleteAll: () => void;
  onDeleteSize: (size: TableSize) => void;
  deletingScope: "ALL" | TableSize | null;
};

function buildSummary(items: VenueTableConfig[]) {
  const count = items.length;
  const chairsTotal = items.reduce((acc, item) => acc + item.includedChairs, 0);
  const prices = items.map((item) => item.bundlePrice);
  const priceMin = prices.length ? Math.min(...prices) : 0;
  const priceMax = prices.length ? Math.max(...prices) : 0;
  const avgBundlePrice = prices.length
    ? prices.reduce((acc, price) => acc + price, 0) / prices.length
    : 0;
  return { count, chairsTotal, priceMin, priceMax, avgBundlePrice };
}

export default function VenueTablesList({
  sizeFilter,
  activeItems,
  viewItems,
  visibleItems,
  onEdit,
  onDeactivate,
  onDeleteAll,
  onDeleteSize,
  deletingScope,
}: Props) {
  const summarySource = sizeFilter === "ALL" ? activeItems : viewItems;
  const summary = useMemo(() => buildSummary(summarySource), [summarySource]);

  const title =
    sizeFilter === "ALL"
      ? "All tables"
      : `${TABLE_SIZE_CONFIG[sizeFilter].label} tables`;

  const badgeLabel = sizeFilter === "ALL" ? "ALL" : TABLE_SIZE_CONFIG[sizeFilter].label;

  const deleteHandler = sizeFilter === "ALL" ? onDeleteAll : () => onDeleteSize(sizeFilter);
  const deleteDisabled =
    summary.count === 0 ||
    (sizeFilter === "ALL" ? deletingScope === "ALL" : deletingScope === sizeFilter);

  const deleteLabel =
    deletingScope === (sizeFilter === "ALL" ? "ALL" : sizeFilter)
      ? "Deleting..."
      : sizeFilter === "ALL"
        ? "Delete all"
        : `Delete ${TABLE_SIZE_CONFIG[sizeFilter].label}`;

  return (
    <div className="space-y-4">
      <article className="min-w-0 overflow-hidden rounded-xl border border-shamell-line-soft bg-shamell-twilight/25 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="font-semibold text-shamell-text-primary">{title}</h3>
            <span className="mt-1 inline-block rounded-full border border-gold/40 px-2 py-0.5 text-[10px] uppercase tracking-wide text-gold">
              {badgeLabel}
            </span>
          </div>
          <button
            type="button"
            onClick={deleteHandler}
            disabled={deleteDisabled}
            className="inline-flex items-center gap-1 rounded-lg border border-shamell-danger/40 px-3 py-1.5 text-xs text-shamell-danger disabled:opacity-50"
          >
            <Trash2 className="h-3.5 w-3.5" />
            {deleteLabel}
          </button>
        </div>

        <dl className="mt-3 grid gap-2 text-xs text-shamell-text-primary/85 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-shamell-line-soft/70 bg-black/10 p-2">
            <dt className="text-shamell-text-primary/65">Tables</dt>
            <dd className="mt-0.5 font-semibold">{summary.count}</dd>
          </div>
          <div className="rounded-lg border border-shamell-line-soft/70 bg-black/10 p-2">
            <dt className="text-shamell-text-primary/65">Included chairs (total)</dt>
            <dd className="mt-0.5 font-semibold">{summary.chairsTotal}</dd>
          </div>
          <div className="rounded-lg border border-shamell-line-soft/70 bg-black/10 p-2">
            <dt className="text-shamell-text-primary/65">Combo avg</dt>
            <dd className="mt-0.5 font-semibold text-gold">
              {formatPriceEn(summary.avgBundlePrice)}
            </dd>
          </div>
          <div className="rounded-lg border border-shamell-line-soft/70 bg-black/10 p-2">
            <dt className="text-shamell-text-primary/65">Price range</dt>
            <dd className="mt-0.5 font-semibold text-gold">
              {formatPriceEn(summary.priceMin)} - {formatPriceEn(summary.priceMax)}
            </dd>
          </div>
        </dl>

        {visibleItems.length === 0 ? (
          <p className="mt-4 text-xs text-shamell-text-primary/65">
            No tables on this page for the current filter.
          </p>
        ) : (
          <div className="mt-4 min-w-0">
            <div className="grid min-w-0 gap-3 lg:hidden">
              {visibleItems.map((item) => (
                <VenueTablesMobileCard
                  key={item.id}
                  item={item}
                  onEdit={() => onEdit(item)}
                  onDeactivate={() => onDeactivate(item)}
                />
              ))}
            </div>
            <VenueTablesTable
              items={visibleItems}
              onEdit={onEdit}
              onDeactivate={onDeactivate}
            />
          </div>
        )}
      </article>
    </div>
  );
}
