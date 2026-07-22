"use client";

import { ActiveToggleButton } from "@/components/admin/inputs";
import { Table, TableTruncatedText, TableRowActions, adminTableIconBtnClass, adminTableIconBtnDangerClass, type TableColumn as AdminTableColumn } from "@/components/admin/data-display";
import { Pencil, Trash2 } from "lucide-react";
import { buildEventTypeSubtitle } from "../lib/eventTypesDisplay";
import { formatLinkedOccasionLine } from "../lib/eventTypesOccasionUtils";
import type { EventTypeItem } from "../types/eventTypes.types";
import EventTypeIcon from "./EventTypeIcon";

type RowHandlers = {
  togglingId: string | null;
  cannotDeactivate: (item: EventTypeItem) => boolean;
  onEdit: (item: EventTypeItem) => void;
  onDelete: (item: EventTypeItem) => void;
  onToggleActive: (item: EventTypeItem) => void;
  onBlockedDeactivate: (item: EventTypeItem) => void;
};

type Props = {
  types: EventTypeItem[];
} & RowHandlers;

export default function EventTypesTable({ types, ...handlers }: Props) {
  const columns: AdminTableColumn<EventTypeItem>[] = [
    {
      id: "icon",
      header: "",
      headerClassName: "w-14 px-2",
      cellClassName: "px-2",
      cell: (item) => (
        <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-gold/30 bg-gold/10">
          <EventTypeIcon name={item.name} className="h-4 w-4 text-gold/90" strokeWidth={1.4} />
        </div>
      ),
    },
    {
      id: "type",
      header: "TYPE",
      cellClassName: "max-w-[14rem] md:max-w-[20rem]",
      cell: (item) => {
        const occasions = formatLinkedOccasionLine(item.occasionAssignments);
        return (
          <TableTruncatedText
            primary={item.name}
            secondary={
              occasions ??
              "No linked occasions — assign them in edit so clients see options in contact."
            }
            className="max-w-[12rem] md:max-w-[16rem]"
          />
        );
      },
    },
    {
      id: "linked",
      header: "LINKED",
      cellClassName: "max-w-[14rem] md:max-w-[18rem]",
      cell: (item) => {
        const linked = buildEventTypeSubtitle(item);
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
