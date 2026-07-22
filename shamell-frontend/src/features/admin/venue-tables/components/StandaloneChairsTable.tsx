"use client";

import { Table, TableTruncatedText, TableRowActions, adminTableIconBtnClass, adminTableIconBtnDangerClass, type TableColumn as AdminTableColumn } from "@/components/admin/data-display";
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

type RowHandlers = {
  onEdit: (item: StandaloneChairInventoryItem) => void;
  onDelete: (item: StandaloneChairInventoryItem) => void;
};

type Props = {
  chairs: StandaloneChairInventoryItem[];
} & RowHandlers;

export default function StandaloneChairsTable({ chairs, onEdit, onDelete }: Props) {
  const columns: AdminTableColumn<StandaloneChairInventoryItem>[] = [
    {
      id: "icon",
      header: "",
      headerClassName: "w-14 px-2",
      cellClassName: "px-2",
      cell: (item) => (
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-lg border",
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
      ),
    },
    {
      id: "chair",
      header: "CHAIR",
      cellClassName: "max-w-[10rem] md:max-w-[14rem]",
      cell: (item) => (
        <TableTruncatedText
          primary={item.displayLabel}
          secondary={item.chairName !== item.displayLabel ? item.chairName : undefined}
        />
      ),
    },
    {
      id: "status",
      header: "STATUS",
      headerClassName: "w-28",
      cell: (item) => (
        <span className={standaloneChairStatusBadgeClass(item.isReserved)}>
          {standaloneChairStatusLabel(item.isReserved)}
        </span>
      ),
    },
    {
      id: "price",
      header: "PRICE",
      headerClassName: "w-28",
      cellClassName: "font-body text-sm text-foreground/75 whitespace-nowrap",
      cell: (item) => `${formatPriceEn(item.unitPrice)} each`,
    },
    {
      id: "id",
      header: "INTERNAL ID",
      headerClassName: "w-28",
      cellClassName: "font-body text-xs text-foreground/55 whitespace-nowrap",
      cell: (item) => formatStandaloneChairShortId(item.id),
    },
    {
      id: "actions",
      header: <span className="block text-right">ACTIONS</span>,
      headerClassName: "w-28 text-right",
      cell: (item) => (
        <TableRowActions>
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
            title="Delete chair"
          >
            <Trash2 className="h-4 w-4" strokeWidth={1.5} />
          </button>
        </TableRowActions>
      ),
    },
  ];

  return (
    <div className="hidden min-w-0 w-full lg:block">
      <Table
        columns={columns}
        rows={chairs}
        getRowKey={(item) => item.id}
        tableClassName="w-full min-w-[680px] border-collapse text-left"
        scrollableBody
        variant="embedded"
        rowClassName={(item) =>
          cn(!item.isActive && "opacity-55", standaloneChairRowClassName(item.isReserved))
        }
      />
    </div>
  );
}
