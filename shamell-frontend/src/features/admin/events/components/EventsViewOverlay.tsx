import { X } from "lucide-react";
import { isVideoCatalogItem } from "../lib/eventsMedia";
import { displayEventHeading, formatShortDateUs } from "../lib/eventsDisplay";
import { formatPriceEn } from "../lib/eventsPrice";
import type { AdminEvent } from "../types/events.types";

type Props = {
  viewEvent: AdminEvent | null;
  onClose: () => void;
};

export default function EventsViewOverlay({ viewEvent, onClose }: Props) {
  if (!viewEvent) return null;

  return (
    <div
      className="fixed inset-0 z-90 flex items-center justify-center bg-black/85 px-4 py-8"
      onClick={onClose}
    >
      <div
        className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-gold/25 bg-[#0c0c0c] p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 rounded-full border border-gold/30 p-2 text-gold transition hover:bg-gold/10"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
        <p className="font-brand text-[10px] tracking-[0.2em] text-gold/75">QUICK LOOK</p>
        <h2 className="mt-2 font-brand text-xl text-gold">
          {displayEventHeading(viewEvent.description).title}
        </h2>
        <p className="mt-1 font-body text-xs text-foreground/45">{viewEvent.eventTypeName}</p>
        <p className="mt-3 font-brand text-xs tracking-[0.14em] text-gold/85">
          PRECIO <span className="font-body text-foreground/75">{formatPriceEn(viewEvent.price)}</span>
        </p>
        {viewEvent.catalogImages.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {viewEvent.catalogImages.map((img) => (
              <div key={img.id} className="h-16 w-16 overflow-hidden rounded-lg border border-gold/20">
                {isVideoCatalogItem(img) ? (
                  <video
                    src={img.imageUrl}
                    className="h-full w-full object-cover"
                    muted
                    playsInline
                    aria-hidden
                  />
                ) : (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.imageUrl} alt="" className="h-full w-full object-cover" />
                  </>
                )}
              </div>
            ))}
          </div>
        ) : null}
        <p className="mt-4 font-body text-sm leading-relaxed text-foreground/70">{viewEvent.description}</p>
        <p className="mt-3 font-body text-xs text-foreground/45">
          {viewEvent.items.length} item(s) · {formatShortDateUs(viewEvent.updatedAt ?? viewEvent.createdAt)} ·{" "}
          {viewEvent.isActive ? "Upcoming" : "Completed"}
          {(viewEvent.bookingCount ?? 0) > 0 ? ` · ${viewEvent.bookingCount} booking(s)` : ""}
        </p>
      </div>
    </div>
  );
}
