import { Eye, Pencil, Trash2 } from "lucide-react";
import AdminActiveToggleButton from "@/components/admin/AdminActiveToggleButton";
import { cn } from "@/lib/utils";
import { displayServiceHeading, formatPriceEn, pillClassForTypeName } from "../lib/servicesDisplay";
import type { AdminService } from "../types/services.types";
import AdminTableTruncatedText from "@/components/admin/AdminTableTruncatedText";
import ServiceCatalogListIcon from "./ServiceCatalogListIcon";

type Props = {
  service: AdminService;
  togglingId: string | null;
  deactivateBlocked: boolean;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: () => void;
  onBlockedDeactivate: () => void;
};

export default function ServicesMobileCard({
  service,
  togglingId,
  deactivateBlocked,
  onView,
  onEdit,
  onDelete,
  onToggle,
  onBlockedDeactivate,
}: Props) {
  const { title, subtitle } = displayServiceHeading(service.description);
  const bk = service.bookingCount ?? 0;
  const gal = service.galleryPhotoCount ?? 0;

  return (
    <article className="shamell-glass-surface flex min-w-0 flex-col gap-3 overflow-hidden rounded-xl border border-gold/14 p-4">
      <div className="flex min-w-0 gap-3">
        <ServiceCatalogListIcon size="md" />
        <div className="min-w-0 flex-1 overflow-hidden">
          <AdminTableTruncatedText primary={title} secondary={subtitle || undefined} />
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
          <AdminActiveToggleButton
            isActive={service.isActive}
            isToggling={togglingId === service.id}
            deactivateBlocked={deactivateBlocked}
            onToggle={onToggle}
            onBlockedDeactivate={onBlockedDeactivate}
            ariaLabel={`${service.isActive ? "Deactivate" : "Activate"} service`}
          />
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
          className="flex min-h-11 items-center justify-center rounded-lg border border-red-400/25 text-foreground/55 transition hover:border-red-400/45 hover:bg-red-500/10 hover:text-red-300"
          aria-label="Delete service permanently"
          title="Delete from catalog (irreversible)"
        >
          <Trash2 className="h-4 w-4" strokeWidth={1.5} />
        </button>
      </div>
    </article>
  );
}
