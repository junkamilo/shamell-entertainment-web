"use client";

import AdminModal from "@/components/admin/AdminModal";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  promoTitle: string;
  setPromoTitle: (v: string) => void;
  promoDescription: string;
  setPromoDescription: (v: string) => void;
  isSubmitting: boolean;
};

export function VenueLayoutPromoEditModal({
  isOpen,
  onClose,
  onSubmit,
  promoTitle,
  setPromoTitle,
  promoDescription,
  setPromoDescription,
  isSubmitting,
}: Props) {
  return (
    <AdminModal title="Edit home On Coming Events section" isOpen={isOpen} onClose={onClose}>
      <form onSubmit={onSubmit} className="space-y-5">
        <label className="block">
          <span className="font-brand text-[11px] tracking-[0.2em] text-gold/95">TITLE</span>
          <input
            value={promoTitle}
            onChange={(e) => setPromoTitle(e.target.value)}
            className="mt-2 h-11 w-full rounded-xl border border-gold/30 px-4 text-sm text-foreground outline-none focus:border-gold"
            placeholder="ON COMING EVENTS"
          />
        </label>

        <label className="block">
          <span className="font-brand text-[11px] tracking-[0.2em] text-gold/95">DESCRIPTION</span>
          <textarea
            value={promoDescription}
            onChange={(e) => setPromoDescription(e.target.value)}
            rows={8}
            className="mt-2 w-full rounded-xl border border-gold/30 px-4 py-3 text-sm text-foreground outline-none focus:border-gold"
            placeholder="Discover on coming experiences curated by Shamell. View details, schedules, and book your place."
          />
        </label>

        <p className="font-body text-[11px] leading-relaxed text-foreground/45">
          This title and description appear above the event cards on the home page. Event cards come
          from the Upcoming events catalog.
        </p>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-xl border border-gold/30 px-5 py-3 text-sm tracking-[0.08em] text-foreground/80 transition hover:bg-white/5 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-xl border border-gold/35 bg-gold/15 px-5 py-3 font-brand text-sm tracking-[0.08em] text-gold transition hover:bg-gold/25 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Saving…" : "Save"}
          </button>
        </div>
      </form>
    </AdminModal>
  );
}
