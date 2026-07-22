"use client";

import { ActiveToggleButton } from "@/components/admin/inputs";
import { Table, TableTruncatedText, TableRowActions, adminTableIconBtnClass, adminTableIconBtnDangerClass, type TableColumn as AdminTableColumn } from "@/components/admin/data-display";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { displayServiceHeading, formatPriceEn, pillClassForTypeName } from "../lib/servicesDisplay";
import type { AdminService } from "../types/services.types";
import ServiceCatalogListIcon from "./ServiceCatalogListIcon";

type RowHandlers = {
  togglingId: string | null;
  cannotDeactivate: (service: AdminService) => boolean;
  onView: (service: AdminService) => void;
  onEdit: (service: AdminService) => void;
  onDelete: (service: AdminService) => void;
  onToggle: (service: AdminService) => void;
  onBlockedDeactivate: (service: AdminService) => void;
};

type Props = {
  services: AdminService[];
} & RowHandlers;

export default function ServicesTable({ services, ...handlers }: Props) {
  const columns: AdminTableColumn<AdminService>[] = [
    {
      id: "icon",
      header: "",
      headerClassName: "w-14 px-2",
      cellClassName: "px-2",
      cell: () => <ServiceCatalogListIcon size="sm" />,
    },
    {
      id: "service",
      header: "SERVICE",
      cellClassName: "max-w-[12rem] md:max-w-[16rem]",
      cell: (service) => {
        const { title, subtitle } = displayServiceHeading(service.description);
        const bk = service.bookingCount ?? 0;
        const gal = service.galleryPhotoCount ?? 0;
        return (
          <>
            <TableTruncatedText primary={title} secondary={subtitle || undefined} />
            {bk > 0 || gal > 0 ? (
              <p
                className="mt-1 truncate font-body text-[10px] text-foreground/45"
                title={`${bk > 0 ? `${bk} booking(s)` : ""}${bk > 0 && gal > 0 ? " · " : ""}${gal > 0 ? `${gal} in gallery` : ""}`}
              >
                {bk > 0 ? `${bk} booking(s)` : null}
                {bk > 0 && gal > 0 ? " · " : null}
                {gal > 0 ? `${gal} in gallery` : null}
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
      cell: (service) => (
        <span
          className={cn(
            "inline-flex max-w-full truncate rounded-full border px-2.5 py-1 font-body text-[11px]",
            pillClassForTypeName(service.serviceTypeName),
          )}
          title={service.serviceTypeName}
        >
          {service.serviceTypeName}
        </span>
      ),
    },
    {
      id: "items",
      header: "ITEMS",
      headerClassName: "w-20",
      cellClassName: "font-body text-sm text-foreground/75",
      cell: (service) => service.items.length,
    },
    {
      id: "price",
      header: "PRECIO",
      headerClassName: "w-24",
      cellClassName: "font-body text-sm text-foreground/75",
      cell: (service) => formatPriceEn(service.price),
    },
    {
      id: "status",
      header: "ESTADO",
      cellClassName: "min-w-[9rem]",
      cell: (service) => {
        const deactivateBlocked = handlers.cannotDeactivate(service);
        const isToggling = handlers.togglingId === service.id;
        return (
          <div className="flex items-center gap-3">
            <ActiveToggleButton
              isActive={service.isActive}
              isToggling={isToggling}
              deactivateBlocked={deactivateBlocked}
              onToggle={() => handlers.onToggle(service)}
              onBlockedDeactivate={() => handlers.onBlockedDeactivate(service)}
              ariaLabel={`${service.isActive ? "Deactivate" : "Activate"} service`}
            />
            <span className="font-body text-xs text-foreground/55">
              {service.isActive ? "Activo" : "Inactivo"}
            </span>
          </div>
        );
      },
    },
    {
      id: "actions",
      header: <span className="block text-right">ACCIONES</span>,
      headerClassName: "w-36 text-right",
      cell: (service) => (
          <TableRowActions>
            <button
              type="button"
              onClick={() => handlers.onView(service)}
              className={adminTableIconBtnClass}
              aria-label="View service"
            >
              <Eye className="h-4 w-4" strokeWidth={1.5} />
            </button>
            <button
              type="button"
              onClick={() => handlers.onEdit(service)}
              className={adminTableIconBtnClass}
              aria-label="Edit service"
            >
              <Pencil className="h-4 w-4" strokeWidth={1.5} />
            </button>
            <button
              type="button"
              onClick={() => handlers.onDelete(service)}
              className={adminTableIconBtnDangerClass}
              aria-label="Delete service permanently"
              title="Delete from catalog (irreversible)"
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
        rows={services}
        getRowKey={(service) => service.id}
        tableClassName="w-full min-w-[920px] border-collapse text-left"
        scrollableBody
        variant="embedded"
      />
    </div>
  );
}
