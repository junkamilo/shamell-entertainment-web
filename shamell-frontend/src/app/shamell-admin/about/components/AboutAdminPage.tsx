"use client";

import { Sparkles } from "lucide-react";
import AdminModuleHero from "@/components/admin/AdminModuleHero";
import { useAdminAboutPage } from "../hooks/useAdminAboutPage";
import { AboutDeleteHeroModal } from "./AboutDeleteHeroModal";
import { AboutEditModal } from "./AboutEditModal";
import { AboutEditorialPreview } from "./AboutEditorialPreview";
import { AboutEmptyState } from "./AboutEmptyState";
import { AboutHeroLightbox } from "./AboutHeroLightbox";
import { AboutStatsGrid } from "./AboutStatsGrid";

export function AboutAdminPage() {
  const page = useAdminAboutPage();

  return (
    <div className="mx-auto w-full max-w-6xl">
      <AdminModuleHero
        title="About Shamell"
        actionLabel={page.record ? "Edit content" : "Create content"}
        onAction={page.openAboutModal}
        bordered={false}
      />

      <AboutStatsGrid stats={page.stats} />

      <section className="shamell-glass-surface overflow-hidden rounded-2xl border border-gold/14">
        <div className="border-b border-gold/12 bg-linear-to-r from-gold/10 via-transparent to-transparent px-5 py-4 md:px-8 md:py-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-gold/80" strokeWidth={1.4} />
              <h2 className="font-brand text-sm tracking-[0.16em] text-gold">Editorial preview</h2>
            </div>
            {page.isLoading ? <p className="text-xs text-foreground/55">Loading…</p> : null}
          </div>
        </div>

        {!page.record && !page.isLoading ? <AboutEmptyState onCreate={page.openAboutModal} /> : null}

        {page.record ? (
          <AboutEditorialPreview
            record={page.record}
            coreValuesList={page.coreValuesList}
            onEdit={page.openAboutModal}
            onOpenLightbox={page.openHeroLightbox}
          />
        ) : null}
      </section>

      <AboutEditModal
        record={page.record}
        isOpen={page.isModalOpen}
        onClose={page.closeAboutModal}
        onSubmit={page.handleSubmit}
        title={page.title}
        setTitle={page.setTitle}
        paragraph1={page.paragraph1}
        setParagraph1={page.setParagraph1}
        coreValuesText={page.coreValuesText}
        setCoreValuesText={page.setCoreValuesText}
        existingImageUrl={page.existingImageUrl}
        existingHeroMediaType={page.existingHeroMediaType}
        imageFile={page.imageFile}
        setImageFile={page.setImageFile}
        imagePreviewUrl={page.imagePreviewUrl}
        imageFileInputRef={page.imageFileInputRef}
        isSubmitting={page.isSubmitting}
        isDeletingHero={page.isDeletingHero}
        onOpenDeleteHeroConfirm={page.openDeleteHeroConfirm}
        onDiscardSelectedFile={page.discardSelectedFile}
        onOpenLightbox={page.openHeroLightbox}
      />

      <AboutDeleteHeroModal
        isOpen={page.isDeleteHeroConfirmOpen}
        isDeletingHero={page.isDeletingHero}
        onClose={page.closeDeleteHeroModal}
        onConfirm={page.confirmDeleteHero}
      />

      <AboutHeroLightbox
        portalReady={page.lightboxPortalReady}
        isOpen={page.isPreviewLightboxOpen}
        display={page.lightboxDisplay}
        onClose={() => page.closeHeroLightbox()}
        onExitComplete={page.onLightboxExitComplete}
      />
    </div>
  );
}
