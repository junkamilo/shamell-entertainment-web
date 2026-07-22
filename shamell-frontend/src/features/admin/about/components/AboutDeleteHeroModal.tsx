"use client";

import { Modal } from "@/components/admin/overlays";
type AboutDeleteHeroModalProps = {
  isOpen: boolean;
  isDeletingHero: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export function AboutDeleteHeroModal({
  isOpen,
  isDeletingHero,
  onClose,
  onConfirm,
}: AboutDeleteHeroModalProps) {
  return (
    <Modal title="Remove hero media?" isOpen={isOpen} onClose={onClose}>
      <div className="space-y-5">
        <p className="font-body text-sm leading-relaxed text-foreground/75">
          Remove the current hero photo or video? It will be deleted from Cloudinary and from the site. You can
          upload a new file afterward.
        </p>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            disabled={isDeletingHero}
            onClick={onClose}
            className="rounded-md border border-gold/25 px-4 py-2 font-brand text-[10px] tracking-[0.14em] text-foreground/70 transition hover:border-gold/35 hover:text-gold disabled:opacity-50"
          >
            CANCEL
          </button>
          <button
            type="button"
            disabled={isDeletingHero}
            onClick={() => void onConfirm()}
            className="rounded-md border border-red-400/45 px-4 py-2 font-brand text-[10px] tracking-[0.14em] text-red-200 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isDeletingHero ? "REMOVING…" : "REMOVE"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
