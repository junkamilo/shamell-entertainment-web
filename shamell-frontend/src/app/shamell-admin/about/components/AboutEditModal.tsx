"use client";

import { type RefObject } from "react";
import { Image as ImageIcon, Video } from "lucide-react";
import AdminModal from "@/components/admin/AdminModal";
import { AdminMediaPickControl } from "@/components/admin/AdminMediaPickControl";
import { isAboutHeroVideoDisplay } from "@/lib/aboutHeroMedia";
import type { AdminAboutRow } from "../types/aboutAdmin.types";
import { AboutHeroPreviewCard } from "./AboutHeroPreviewCard";

type AboutEditModalProps = {
  record: AdminAboutRow | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  title: string;
  setTitle: (value: string) => void;
  paragraph1: string;
  setParagraph1: (value: string) => void;
  coreValuesText: string;
  setCoreValuesText: (value: string) => void;
  existingImageUrl: string | null;
  existingHeroMediaType: "IMAGE" | "VIDEO";
  imageFile: File | null;
  setImageFile: (file: File | null) => void;
  imagePreviewUrl: string | null;
  imageFileInputRef: RefObject<HTMLInputElement | null>;
  isSubmitting: boolean;
  isDeletingHero: boolean;
  onOpenDeleteHeroConfirm: () => void;
  onDiscardSelectedFile: () => void;
  onOpenLightbox: (src: string, isVideo: boolean) => void;
};

export function AboutEditModal({
  record,
  isOpen,
  onClose,
  onSubmit,
  title,
  setTitle,
  paragraph1,
  setParagraph1,
  coreValuesText,
  setCoreValuesText,
  existingImageUrl,
  existingHeroMediaType,
  imageFile,
  setImageFile,
  imagePreviewUrl,
  imageFileInputRef,
  isSubmitting,
  isDeletingHero,
  onOpenDeleteHeroConfirm,
  onDiscardSelectedFile,
  onOpenLightbox,
}: AboutEditModalProps) {
  return (
    <AdminModal
      title={record ? "Edit About Shamell" : "Create About Shamell"}
      isOpen={isOpen}
      onClose={onClose}
    >
      <form id="about-shamell-form" onSubmit={onSubmit} className="space-y-5">
        <label className="block">
          <span className="font-brand text-[11px] tracking-[0.2em] text-gold/95">TITLE</span>
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="mt-2 h-11 w-full rounded-xl border border-gold/30 px-4 text-sm text-foreground outline-none focus:border-gold"
          />
        </label>

        <label className="block">
          <span className="font-brand text-[11px] tracking-[0.2em] text-gold/95">TEXTO PRINCIPAL</span>
          <textarea
            value={paragraph1}
            onChange={(event) => setParagraph1(event.target.value)}
            rows={8}
            className="mt-2 w-full rounded-xl border border-gold/30 px-4 py-3 text-sm text-foreground outline-none focus:border-gold"
          />
        </label>

        <label className="block">
          <span className="font-brand text-[11px] tracking-[0.2em] text-gold/95">VALUES (ONE PER LINE)</span>
          <textarea
            value={coreValuesText}
            onChange={(event) => setCoreValuesText(event.target.value)}
            rows={5}
            className="mt-2 w-full rounded-xl border border-gold/30 px-4 py-3 text-sm text-foreground outline-none focus:border-gold"
            placeholder={"Profesionalismo\nExcelencia\nAutenticidad"}
          />
        </label>

        <label className="block">
          <span className="flex flex-wrap items-center gap-2 font-brand text-[11px] tracking-[0.2em] text-gold/95">
            <span className="inline-flex items-center gap-1.5">
              <ImageIcon className="h-3.5 w-3.5 text-gold/70" strokeWidth={1.5} aria-hidden />
              <Video className="h-3.5 w-3.5 text-gold/70" strokeWidth={1.5} aria-hidden />
            </span>
            ABOUT IMAGE OR VIDEO
          </span>
          <AdminMediaPickControl
            ref={imageFileInputRef}
            accept="image/*,video/*"
            onFileChange={(file) => setImageFile(file)}
            disabled={isSubmitting || isDeletingHero}
            selectedFileName={imageFile?.name ?? null}
          />
          {!record ? (
            <p className="mt-2 font-body text-[11px] text-foreground/45">
              First publish requires a hero file: any common image format, or video (e.g. MP4, WebM,
              MOV). Long videos are supported. The public About section will show it automatically as
              photo or video.
            </p>
          ) : (
            <p className="mt-2 font-body text-[11px] text-foreground/45">
              Optional: upload a new image or video to replace the current hero (same field as when you first
              published).
            </p>
          )}
        </label>

        {imagePreviewUrl || existingImageUrl ? (
          <div className="shamell-glass-surface rounded-xl border border-gold/15 p-4">
            <p className="mb-3 text-center font-brand text-[10px] tracking-[0.18em] text-gold/70 sm:text-left">
              HERO MEDIA
            </p>
            <div className="flex flex-wrap justify-center gap-4 sm:justify-start">
              {existingImageUrl && imagePreviewUrl ? (
                <>
                  <AboutHeroPreviewCard
                    src={existingImageUrl}
                    isVideo={isAboutHeroVideoDisplay({
                      heroMediaType: existingHeroMediaType,
                      imageUrl: existingImageUrl,
                    })}
                    badge="Live on site"
                    onRemove={onOpenDeleteHeroConfirm}
                    removeDisabled={isDeletingHero || isSubmitting}
                    removeBusy={isDeletingHero}
                    removeAriaLabel="Remove published hero from Cloudinary and database"
                    onExpand={() =>
                      onOpenLightbox(
                        existingImageUrl,
                        isAboutHeroVideoDisplay({
                          heroMediaType: existingHeroMediaType,
                          imageUrl: existingImageUrl,
                        }),
                      )
                    }
                  />
                  <AboutHeroPreviewCard
                    src={imagePreviewUrl}
                    isVideo={isAboutHeroVideoDisplay({ file: imageFile })}
                    badge="New file (not saved)"
                    onRemove={onDiscardSelectedFile}
                    removeDisabled={isSubmitting || isDeletingHero}
                    removeAriaLabel="Discard selected file"
                    onExpand={() =>
                      onOpenLightbox(imagePreviewUrl, isAboutHeroVideoDisplay({ file: imageFile }))
                    }
                  />
                </>
              ) : existingImageUrl ? (
                <AboutHeroPreviewCard
                  src={existingImageUrl}
                  isVideo={isAboutHeroVideoDisplay({
                    heroMediaType: existingHeroMediaType,
                    imageUrl: existingImageUrl,
                  })}
                  badge="Live on site"
                  onRemove={onOpenDeleteHeroConfirm}
                  removeDisabled={isDeletingHero || isSubmitting}
                  removeBusy={isDeletingHero}
                  removeAriaLabel="Remove published hero from Cloudinary and database"
                  onExpand={() =>
                    onOpenLightbox(
                      existingImageUrl,
                      isAboutHeroVideoDisplay({
                        heroMediaType: existingHeroMediaType,
                        imageUrl: existingImageUrl,
                      }),
                    )
                  }
                />
              ) : imagePreviewUrl ? (
                <AboutHeroPreviewCard
                  src={imagePreviewUrl}
                  isVideo={isAboutHeroVideoDisplay({ file: imageFile })}
                  badge="New file"
                  onRemove={onDiscardSelectedFile}
                  removeDisabled={isSubmitting || isDeletingHero}
                  removeAriaLabel="Discard selected file"
                  onExpand={() =>
                    onOpenLightbox(imagePreviewUrl, isAboutHeroVideoDisplay({ file: imageFile }))
                  }
                />
              ) : null}
            </div>
          </div>
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-gold/30 px-5 py-3 text-sm tracking-[0.08em] text-foreground/80 transition hover:bg-white/5"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || isDeletingHero}
            className="rounded-xl border border-gold/35 bg-gold/15 px-5 py-3 font-brand text-sm tracking-[0.08em] text-gold transition hover:bg-gold/25 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Saving..." : "Save"}
          </button>
        </div>
      </form>
    </AdminModal>
  );
}
