"use client";

import { Table, TableTruncatedText, TableRowActions, adminTableIconBtnClass, adminTableIconBtnDangerClass, type TableColumn as AdminTableColumn } from "@/components/admin/data-display";
import { LayoutGrid, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPriceEn } from "../lib/parseVenueTablePrice";
import {
  formatVenueTableAdminSubtitle,
  formatVenueTableDisplayLabel,
  TABLE_SIZE_CONFIG,
} from "../lib/tableSizeConfig";
import type { VenueTableConfig } from "../types/venueTables.types";

type RowHandlers = {
  onEdit: (item: VenueTableConfig) => void;
  onDeactivate: (item: VenueTableConfig) => void;
};

type Props = {
  items: VenueTableConfig[];
} & RowHandlers;

function pillClassForTableSize(size: VenueTableConfig["size"]) {
  switch (size) {
    case "LARGE":
      return "border-gold/45 bg-gold/12 text-gold";
    case "MEDIUM":
      return "border-amber-400/35 bg-amber-500/10 text-amber-200/90";
    default:
      return "border-gold/25 bg-gold/8 text-gold/85";
  }
}

export default function VenueTablesTable({ items, onEdit, onDeactivate }: Props) {
  const columns: AdminTableColumn<VenueTableConfig>[] = [
    {
      id: "icon",
      header: "",
      headerClassName: "w-14 px-2",
      cellClassName: "px-2",
      cell: () => (
        <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-gold/22 bg-gold/10">
          <LayoutGrid className="h-4 w-4 text-gold/85" strokeWidth={1.4} />
        </div>
      ),
    },
    {
      id: "table",
      header: "TABLE",
      cellClassName: "max-w-[12rem] md:max-w-[16rem]",
      cell: (item) => (
        <TableTruncatedText
          primary={formatVenueTableDisplayLabel(item)}
          secondary={formatVenueTableAdminSubtitle(item)}
        />
      ),
    },
    {
      id: "size",
      header: "SIZE",
      headerClassName: "w-24",
      cell: (item) => (
        <span
          className={cn(
            "inline-flex max-w-full truncate rounded-full border px-2.5 py-1 font-body text-[11px] uppercase tracking-wide",
            pillClassForTableSize(item.size),
          )}
          title={TABLE_SIZE_CONFIG[item.size].label}
        >
          {TABLE_SIZE_CONFIG[item.size].label}
        </span>
      ),
    },
    {
      id: "chairs",
      header: "CHAIRS",
      headerClassName: "w-20",
      cellClassName: "font-body text-sm text-foreground/75",
      cell: (item) => item.includedChairs,
    },
    {
      id: "combo",
      header: "COMBO",
      headerClassName: "w-24",
      cellClassName: "font-body text-sm text-foreground/75 whitespace-nowrap",
      cell: (item) => formatPriceEn(item.bundlePrice),
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
            aria-label={`Edit ${formatVenueTableDisplayLabel(item)}`}
          >
            <Pencil className="h-4 w-4" strokeWidth={1.5} />
          </button>
          <button
            type="button"
            onClick={() => onDeactivate(item)}
            className={adminTableIconBtnDangerClass}
            aria-label={`Deactivate ${formatVenueTableDisplayLabel(item)}`}
            title="Deactivate table"
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
        rows={items}
        getRowKey={(item) => item.id}
        tableClassName="w-full min-w-[720px] border-collapse text-left"
        scrollableBody
        variant="embedded"
      />
    </div>
  );
}
