"use client";

import { ActiveToggleButton } from "@/components/admin/inputs";
import { Table, TableTruncatedText, TableRowActions, adminTableIconBtnClass, adminTableIconBtnDangerClass, type TableColumn as AdminTableColumn } from "@/components/admin/data-display";
import { Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { buildServiceTypeSubtitle } from "../lib/serviceTypesDisplay";
import type { ServiceTypeItem } from "../types/serviceTypes.types";
import ServiceTypeIcon from "./ServiceTypeIcon";

type RowHandlers = {
  togglingId: string | null;
  cannotDeactivate: (item: ServiceTypeItem) => boolean;
  onEdit: (item: ServiceTypeItem) => void;
  onDelete: (item: ServiceTypeItem) => void;
  onToggleActive: (item: ServiceTypeItem) => void;
  onBlockedDeactivate: (item: ServiceTypeItem) => void;
};

type Props = {
  types: ServiceTypeItem[];
} & RowHandlers;

export default function ServiceTypesTable({ types, ...handlers }: Props) {
  const columns: AdminTableColumn<ServiceTypeItem>[] = [
      {
        id: "icon",
        header: "",
        headerClassName: "w-14 px-2",
        cellClassName: "px-2",
        cell: (item) => (
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-gold/30 bg-gold/10">
            <ServiceTypeIcon name={item.name} />
          </div>
        ),
      },
      {
        id: "type",
        header: "TYPE",
        cellClassName: "max-w-[14rem] md:max-w-[20rem]",
        cell: (item) => (
          <TableTruncatedText
            primary={item.name}
            className="max-w-[12rem] md:max-w-[16rem]"
          />
        ),
      },
      {
        id: "linked",
        header: "LINKED",
        cellClassName: "max-w-[14rem] md:max-w-[18rem]",
        cell: (item) => {
          const linked = buildServiceTypeSubtitle(item);
          return (
            <p className="truncate font-body text-xs text-foreground/50" title={linked}>
              {linked}
            </p>
          );
        },
      },
      {
        id: "status",
        header: "STATUS",
        cellClassName: "min-w-[9rem]",
        cell: (item) => {
          const isToggling = handlers.togglingId === item.id;
          const deactivateBlocked = handlers.cannotDeactivate(item);
          return (
            <div className="flex items-center gap-3">
              <ActiveToggleButton
                isActive={item.isActive}
                isToggling={isToggling}
                deactivateBlocked={deactivateBlocked}
                onToggle={() => handlers.onToggleActive(item)}
                onBlockedDeactivate={() => handlers.onBlockedDeactivate(item)}
                ariaLabel={`${item.isActive ? "Deactivate" : "Activate"} ${item.name}`}
              />
              <span className="font-body text-xs text-foreground/55">
                {item.isActive ? "Active" : "Inactive"}
              </span>
            </div>
          );
        },
      },
      {
        id: "actions",
        header: <span className="block text-right">ACTIONS</span>,
        headerClassName: "w-28 text-right",
        cell: (item) => (
            <TableRowActions>
              <button
                type="button"
                onClick={() => handlers.onEdit(item)}
                className={adminTableIconBtnClass}
                aria-label={`Edit ${item.name}`}
              >
                <Pencil className="h-4 w-4" strokeWidth={1.5} />
              </button>
              <button
                type="button"
                onClick={() => handlers.onDelete(item)}
                className={adminTableIconBtnDangerClass}
                aria-label={`Delete ${item.name}`}
                title="Delete permanently"
              >
                <Trash2 className="h-4 w-4" strokeWidth={1.5} />
              </button>
            </TableRowActions>
          ),
      },
    ];

  return (
    <Table
      columns={columns}
      rows={types}
      getRowKey={(item) => item.id}
      tableClassName="w-full min-w-[800px] border-collapse text-left"
      scrollableBody
      variant="embedded"
    />
  );
}
