"use client";

import { ActiveToggleButton } from "@/components/admin/inputs";
import { Table, TableTruncatedText, TableRowActions, adminTableIconBtnClass, adminTableIconBtnDangerClass, type TableColumn as AdminTableColumn } from "@/components/admin/data-display";
import { Calendar, Eye, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { displayEventHeading, pillClassForTypeName } from "../lib/eventsDisplay";
import { formatPriceEn } from "../lib/eventsPrice";
import type { AdminEvent } from "../types/events.types";

type RowHandlers = {
  togglingId: string | null;
  cannotDeactivate: (item: AdminEvent) => boolean;
  onView: (item: AdminEvent) => void;
  onEdit: (item: AdminEvent) => void;
  onDelete: (item: AdminEvent) => void;
  onToggleActive: (item: AdminEvent) => void;
  onBlockedDeactivate: (item: AdminEvent) => void;
};

type Props = {
  events: AdminEvent[];
} & RowHandlers;

export default function EventsTable({ events, ...handlers }: Props) {
  const columns: AdminTableColumn<AdminEvent>[] = [
    {
      id: "icon",
      header: "",
      headerClassName: "w-14 px-2",
      cellClassName: "px-2",
      cell: () => (
        <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-gold/22 bg-gold/10">
          <Calendar className="h-4 w-4 text-gold/85" strokeWidth={1.4} />
        </div>
      ),
    },
    {
      id: "event",
      header: "EVENT",
      cellClassName: "max-w-[12rem] md:max-w-[16rem]",
      cell: (item) => {
        const { title, subtitle } = displayEventHeading(item.description);
        const bk = item.bookingCount ?? 0;
        return (
          <>
            <TableTruncatedText primary={title} secondary={subtitle || undefined} />
            {bk > 0 ? (
              <p className="mt-1 truncate font-body text-[10px] text-foreground/45">
                {bk === 1 ? "1 booking" : `${bk} bookings`}
              </p>
            ) : null}
          </>
        );
      },
    },
    {
      id: "type",
      header: "TYPE",
      cellClassName: "max-w-[10rem] md:max-w-[12rem]",
      cell: (item) => (
        <span
          className={cn(
            "inline-flex max-w-full truncate rounded-full border px-2.5 py-1 font-body text-[11px]",
            pillClassForTypeName(item.eventTypeName),
          )}
          title={item.eventTypeName}
        >
          {item.eventTypeName}
        </span>
      ),
    },
    {
      id: "items",
      header: "ITEMS",
      headerClassName: "w-20",
      cellClassName: "font-body text-sm text-foreground/75",
      cell: (item) => item.items.length,
    },
    {
      id: "price",
      header: "PRICE",
      headerClassName: "w-24",
      cellClassName: "font-body text-sm text-foreground/75 whitespace-nowrap",
      cell: (item) => formatPriceEn(item.price),
    },
    {
      id: "status",
      header: "STATUS",
      cellClassName: "min-w-[9rem]",
      cell: (item) => {
        const deactivateBlocked = handlers.cannotDeactivate(item);
        const isToggling = handlers.togglingId === item.id;
        return (
          <div className="flex items-center gap-3">
            <ActiveToggleButton
              isActive={item.isActive}
              isToggling={isToggling}
              deactivateBlocked={deactivateBlocked}
              onToggle={() => handlers.onToggleActive(item)}
              onBlockedDeactivate={() => handlers.onBlockedDeactivate(item)}
              ariaLabel={`${item.isActive ? "Deactivate" : "Activate"} event`}
            />
            <span className="font-body text-xs text-foreground/55">
              {item.isActive ? "Active" : "Hidden"}
            </span>
          </div>
        );
      },
    },
    {
      id: "actions",
      header: <span className="block text-right">ACTIONS</span>,
      headerClassName: "w-36 text-right",
      cell: (item) => (
        <TableRowActions>
          <button
            type="button"
            onClick={() => handlers.onView(item)}
            className={adminTableIconBtnClass}
            aria-label="View event"
          >
            <Eye className="h-4 w-4" strokeWidth={1.5} />
          </button>
          <button
            type="button"
            onClick={() => handlers.onEdit(item)}
            className={adminTableIconBtnClass}
            aria-label="Edit event"
          >
            <Pencil className="h-4 w-4" strokeWidth={1.5} />
          </button>
          <button
            type="button"
            onClick={() => handlers.onDelete(item)}
            className={adminTableIconBtnDangerClass}
            aria-label="Delete event permanently"
            title="Delete from catalog (cannot undo)"
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
        rows={events}
        getRowKey={(item) => item.id}
        tableClassName="w-full min-w-[960px] border-collapse text-left"
        scrollableBody
        variant="embedded"
        rowClassName={(item) => (!item.isActive ? "opacity-55" : "")}
      />
    </div>
  );
}
