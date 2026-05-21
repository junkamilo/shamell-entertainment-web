import { Eye, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { displayServiceHeading, formatPriceEn, pillClassForTypeName } from "../lib/servicesDisplay";
import type { AdminService } from "../types/services.types";
import ServiceListMediaThumb from "./ServiceListMediaThumb";

type Props = {
  service: AdminService;
  togglingId: string | null;
  deletable: boolean;
  blockDeactivate: boolean;
  deleteBlockedTitle: string;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: () => void;
};

export default function ServicesTableRow({
  service,
  togglingId,
  deletable,
  blockDeactivate,
  deleteBlockedTitle,
  onView,
  onEdit,
  onDelete,
  onToggle,
}: Props) {
  const { title } = displayServiceHeading(service.description);
  const bk = service.bookingCount ?? 0;
  const gal = service.galleryPhotoCount ?? 0;

  return (
    <tr className="border-b border-gold/8 transition hover:bg-gold/5">
      <td className="px-2 py-3 align-middle">
        <ServiceListMediaThumb imageUrl={service.imageUrl} size="sm" />
      </td>
      <td className="max-w-[14rem] px-3 py-3 align-middle md:max-w-[18rem]">
        <p className="font-brand text-sm tracking-[0.04em] text-gold">{title}</p>
        {bk > 0 || gal > 0 ? (
          <p className="mt-1 font-body text-[10px] text-foreground/45">
            {bk > 0 ? `${bk} booking(s)` : null}
            {bk > 0 && gal > 0 ? " · " : null}
            {gal > 0 ? `${gal} in gallery` : null}
          </p>
        ) : null}
      </td>
      <td className="px-3 py-3 align-middle">
        <span
          className={cn(
            "inline-flex rounded-full border px-2.5 py-1 font-body text-[11px]",
            pillClassForTypeName(service.serviceTypeName),
          )}
        >
          {service.serviceTypeName}
        </span>
      </td>
      <td className="px-3 py-3 align-middle font-body text-sm text-foreground/75">
        {service.items.length}
      </td>
      <td className="px-3 py-3 align-middle font-body text-sm text-foreground/75">
        {formatPriceEn(service.price)}
      </td>
      <td className="px-3 py-3 align-middle">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onToggle}
            disabled={togglingId === service.id || blockDeactivate}
            title={blockDeactivate ? "This service has bookings and cannot be turned off." : undefined}
            className={cn(
              "relative h-7 w-12 shrink-0 rounded-full border transition",
              service.isActive
                ? "border-emerald-400/45 bg-emerald-500/22"
                : "border-gold/40 bg-gold/10 ring-1 ring-gold/20",
              togglingId === service.id && "cursor-not-allowed opacity-60",
              blockDeactivate && "cursor-not-allowed opacity-45",
            )}
            aria-label={`${service.isActive ? "Hide" : "Show"} service`}
          >
            <span
              className={cn(
                "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition",
                service.isActive ? "left-6" : "left-1",
              )}
            />
          </button>
          <span className="font-body text-xs text-foreground/55">
            {service.isActive ? "Activo" : "Inactivo"}
          </span>
        </div>
      </td>
      <td className="px-3 py-3 align-middle">
        <div className="flex justify-end gap-1">
          <button
            type="button"
            onClick={onView}
            className="rounded-lg border border-gold/18 p-2 text-foreground/55 transition hover:border-gold/35 hover:bg-gold/10 hover:text-gold"
            aria-label="View service"
          >
            <Eye className="h-4 w-4" strokeWidth={1.5} />
          </button>
          <button
            type="button"
            onClick={onEdit}
            className="rounded-lg border border-gold/18 p-2 text-foreground/55 transition hover:border-gold/35 hover:bg-gold/10 hover:text-gold"
            aria-label="Edit service"
          >
            <Pencil className="h-4 w-4" strokeWidth={1.5} />
          </button>
          <button
            type="button"
            onClick={onDelete}
            disabled={!deletable}
            className={cn(
              "rounded-lg border p-2 transition",
              deletable
                ? "border-red-400/25 text-foreground/55 hover:border-red-400/45 hover:bg-red-500/10 hover:text-red-300"
                : "cursor-not-allowed border-gold/10 text-foreground/30",
            )}
            aria-label="Delete service permanently"
            title={!deletable ? deleteBlockedTitle : "Delete from catalog (irreversible)"}
          >
            <Trash2 className="h-4 w-4" strokeWidth={1.5} />
          </button>
        </div>
      </td>
    </tr>
  );
}
