import { X } from "lucide-react";
import { serviceCatalogMediaTypeFromUrl } from "@/lib/serviceCatalogMedia";
import { displayServiceHeading, formatPriceEn } from "../lib/servicesDisplay";
import type { AdminService } from "../types/services.types";

type Props = {
  service: AdminService | null;
  onClose: () => void;
};

export default function ServicesViewOverlay({ service, onClose }: Props) {
  if (!service) return null;

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/85 px-4 py-8"
      onClick={onClose}
    >
      <div
        className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-gold/25 bg-[#0c0c0c] p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="shamell-glass-surface absolute right-3 top-3 rounded-full border border-gold/30 p-2 text-gold transition hover:bg-gold/10"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
        <p className="font-brand text-[10px] tracking-[0.2em] text-gold/75">QUICK LOOK</p>
        <h2 className="mt-2 font-brand text-xl text-gold">
          {displayServiceHeading(service.description).title}
        </h2>
        <p className="mt-1 font-body text-xs text-foreground/45">{service.serviceTypeName}</p>
        <p className="mt-2 font-brand text-[10px] tracking-[0.14em] text-gold/80">
          PRECIO <span className="font-body text-foreground/70">{formatPriceEn(service.price)}</span>
        </p>
        {service.imageUrl ? (
          <div className="mt-4 overflow-hidden rounded-xl border border-gold/15">
            {serviceCatalogMediaTypeFromUrl(service.imageUrl) === "VIDEO" ? (
              <video
                src={service.imageUrl}
                className="max-h-56 w-full object-cover"
                controls
                playsInline
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={service.imageUrl} alt="" className="max-h-56 w-full object-cover" />
            )}
          </div>
        ) : null}
        <p className="mt-4 font-body text-sm leading-relaxed text-foreground/70">{service.description}</p>
        <p className="mt-3 font-body text-xs text-foreground/45">
          {service.items.length} item(s) · {service.isActive ? "Active" : "Inactive"}
        </p>
      </div>
    </div>
  );
}
