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

export default function ServicesMobileCard({
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
    <article className="shamell-glass-surface flex min-w-0 flex-col gap-3 overflow-hidden rounded-xl border border-gold/14 p-4">
      <div className="flex min-w-0 gap-3">
        <ServiceListMediaThumb imageUrl={service.imageUrl} size="md" />
        <div className="min-w-0 flex-1 overflow-hidden">
          <p className="line-clamp-2 break-words font-brand text-sm leading-snug tracking-[0.04em] text-gold">
            {title}
          </p>
          {bk > 0 || gal > 0 ? (
            <p className="mt-1 font-body text-[10px] leading-snug text-foreground/45">
              {bk > 0 ? `${bk} booking(s)` : null}
              {bk > 0 && gal > 0 ? " · " : null}
              {gal > 0 ? `${gal} in gallery` : null}
            </p>
          ) : null}
          <span
            className={cn(
              "mt-2 inline-block max-w-full truncate rounded-full border px-2.5 py-1 font-body text-[11px]",
              pillClassForTypeName(service.serviceTypeName),
            )}
            title={service.serviceTypeName}
          >
            {service.serviceTypeName}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 border-t border-gold/10 pt-3">
        <div className="font-body text-xs text-foreground/70">
          <span className="block font-brand text-[10px] tracking-[0.12em] text-gold/65">ITEMS</span>
          <span className="mt-0.5 block text-sm text-foreground/85">{service.items.length}</span>
        </div>
        <div className="font-body text-xs text-foreground/70">
          <span className="block font-brand text-[10px] tracking-[0.12em] text-gold/65">PRECIO</span>
          <span className="mt-0.5 block text-sm text-foreground/85">{formatPriceEn(service.price)}</span>
        </div>
        <div className="col-span-2 flex min-w-0 items-center justify-between gap-3 rounded-lg border border-gold/10 bg-black/15 px-3 py-2">
          <span className="shrink-0 font-body text-xs text-foreground/55">
            {service.isActive ? "Activo" : "Inactivo"}
          </span>
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
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 border-t border-gold/10 pt-3">
        <button
          type="button"
          onClick={onView}
          className="flex min-h-11 items-center justify-center rounded-lg border border-gold/18 text-foreground/55 transition hover:border-gold/35 hover:bg-gold/10 hover:text-gold"
          aria-label="View service"
        >
          <Eye className="h-4 w-4" strokeWidth={1.5} />
        </button>
        <button
          type="button"
          onClick={onEdit}
          className="flex min-h-11 items-center justify-center rounded-lg border border-gold/18 text-foreground/55 transition hover:border-gold/35 hover:bg-gold/10 hover:text-gold"
          aria-label="Edit service"
        >
          <Pencil className="h-4 w-4" strokeWidth={1.5} />
        </button>
        <button
          type="button"
          onClick={onDelete}
          disabled={!deletable}
          className={cn(
            "flex min-h-11 items-center justify-center rounded-lg border transition",
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
    </article>
  );
}
