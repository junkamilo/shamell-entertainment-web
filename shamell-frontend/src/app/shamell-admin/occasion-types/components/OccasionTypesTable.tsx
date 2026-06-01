"use client";

import { Pencil, Sparkles, Trash2 } from "lucide-react";
import AdminActiveToggleButton from "@/components/admin/AdminActiveToggleButton";
import AdminTable from "@/components/admin/AdminTable";
import type { AdminTableColumn } from "@/components/admin/adminTable.types";
import AdminTableTruncatedText from "@/components/admin/AdminTableTruncatedText";
import AdminTableRowActions, {
  adminTableIconBtnClass,
  adminTableIconBtnDangerClass,
} from "@/components/admin/AdminTableRowActions";
import { buildOccasionTypeSubtitle } from "../lib/occasionTypesDisplay";
import type { OccasionTypeItem } from "../types/occasionTypes.types";

type RowHandlers = {
  togglingId: string | null;
  cannotDeactivate: (item: OccasionTypeItem) => boolean;
  onEdit: (item: OccasionTypeItem) => void;
  onDelete: (item: OccasionTypeItem) => void;
  onToggleActive: (item: OccasionTypeItem) => void;
  onBlockedDeactivate: (item: OccasionTypeItem) => void;
};

type Props = {
  rows: OccasionTypeItem[];
} & RowHandlers;

export default function OccasionTypesTable({ rows, ...handlers }: Props) {
  const columns: AdminTableColumn<OccasionTypeItem>[] = [
    {
      id: "icon",
      header: "",
      headerClassName: "w-14 px-2",
      cellClassName: "px-2",
      cell: () => (
        <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-gold/30 bg-gold/10">
          <Sparkles className="h-4 w-4 text-gold/90" strokeWidth={1.4} />
        </div>
      ),
    },
    {
      id: "type",
      header: "TYPE",
      cellClassName: "max-w-[14rem] md:max-w-[20rem]",
      cell: (item) => (
        <AdminTableTruncatedText
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
        const linked = buildOccasionTypeSubtitle(item);
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
            <AdminActiveToggleButton
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
        <AdminTableRowActions>
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
        </AdminTableRowActions>
      ),
    },
  ];

  return (
    <AdminTable
      columns={columns}
      rows={rows}
      getRowKey={(item) => item.id}
      tableClassName="w-full min-w-[800px] border-collapse text-left"
      scrollableBody
      variant="embedded"
    />
  );
}
