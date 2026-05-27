"use client";

import type { RefObject } from "react";
import Image from "next/image";
import AdminModal from "@/components/admin/AdminModal";
import { AdminMediaPickControl } from "@/components/admin/AdminMediaPickControl";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  promoTitle: string;
  setPromoTitle: (v: string) => void;
  promoDescription: string;
  setPromoDescription: (v: string) => void;
  existingImageUrl: string | null;
  imagePreviewUrl: string | null;
  imageFileInputRef: RefObject<HTMLInputElement | null>;
  onImageFileChange: (file: File | null) => void;
  isSubmitting: boolean;
  isDeletingImage: boolean;
  onDeleteImage: () => void;
};

export function VenueLayoutPromoEditModal({
  isOpen,
  onClose,
  onSubmit,
  promoTitle,
  setPromoTitle,
  promoDescription,
  setPromoDescription,
  existingImageUrl,
  imagePreviewUrl,
  imageFileInputRef,
  onImageFileChange,
  isSubmitting,
  isDeletingImage,
  onDeleteImage,
}: Props) {
  const previewSrc = imagePreviewUrl ?? existingImageUrl;

  return (
    <AdminModal title="Venue layout promo" isOpen={isOpen} onClose={onClose}>
      <form onSubmit={onSubmit} className="space-y-5">
        <label className="block">
          <span className="font-brand text-[11px] tracking-[0.2em] text-gold/95">TITLE</span>
          <input
            value={promoTitle}
            onChange={(e) => setPromoTitle(e.target.value)}
            className="mt-2 h-11 w-full rounded-xl border border-gold/30 px-4 text-sm text-foreground outline-none focus:border-gold"
            placeholder="Explore our venue"
          />
        </label>

        <label className="block">
          <span className="font-brand text-[11px] tracking-[0.2em] text-gold/95">DESCRIPTION</span>
          <textarea
            value={promoDescription}
            onChange={(e) => setPromoDescription(e.target.value)}
            rows={6}
            className="mt-2 w-full rounded-xl border border-gold/30 px-4 py-3 text-sm text-foreground outline-none focus:border-gold"
            placeholder="Describe the lounge and interactive floor plan…"
          />
        </label>

        <div>
          <span className="font-brand text-[11px] tracking-[0.2em] text-gold/95">PROMO IMAGE</span>
          {previewSrc ? (
            <div className="relative mt-2 aspect-video overflow-hidden rounded-xl border border-gold/20">
              <Image src={previewSrc} alt="" fill className="object-cover" sizes="480px" />
            </div>
          ) : null}
          <div className="mt-3">
            <AdminMediaPickControl
              accept="image/*"
              ref={imageFileInputRef}
              onFileChange={onImageFileChange}
              selectedFileName={imagePreviewUrl ? "New image selected" : null}
              aria-label="Select promo image"
            />
          </div>
          {existingImageUrl ? (
            <button
              type="button"
              disabled={isDeletingImage}
              onClick={() => void onDeleteImage()}
              className="mt-2 text-xs text-shamell-danger hover:underline disabled:opacity-50"
            >
              {isDeletingImage ? "Removing…" : "Remove saved image"}
            </button>
          ) : null}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gold/25 px-4 py-2 text-xs uppercase tracking-wider text-foreground/80"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-lg bg-gold px-4 py-2 text-xs font-semibold uppercase tracking-wider text-black disabled:opacity-50"
          >
            {isSubmitting ? "Saving…" : "Save"}
          </button>
        </div>
      </form>
    </AdminModal>
  );
}
