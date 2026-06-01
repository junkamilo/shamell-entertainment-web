"use client";

import { CalendarDays, Sparkles } from "lucide-react";
import type { useAdminVenueLayoutPromoPage } from "../hooks/useAdminVenueLayoutPromoPage";
import type { VenueLayoutClientSettings } from "../types/venueLayoutPromo.types";
import { VenueLayoutPromoEditModal } from "./VenueLayoutPromoEditModal";
import { VenueLayoutPromoModuleSection } from "./VenueLayoutPromoModuleSection";
import { VenueLayoutPromoPreview } from "./VenueLayoutPromoPreview";
import { VenueLayoutPublishCard } from "./VenueLayoutPublishCard";

const emptySettings: VenueLayoutClientSettings = {
  clientEnabled: false,
  promoTitle: null,
  promoDescription: null,
  promoImageUrl: null,
  reservationEventDate: null,
  reservationOpensAt: null,
  reservationClosesAt: null,
  reservationEventLabel: null,
  reservationTimezone: "America/New_York",
  updatedAt: null,
};

type PageState = ReturnType<typeof useAdminVenueLayoutPromoPage>;

type Props = {
  page: PageState;
};

export function VenueLayoutReservationTabPanel({ page }: Props) {
  return (
    <>
      <VenueLayoutPromoModuleSection
        icon={CalendarDays}
        title="Public site"
        description="Publish the On Coming Events block and floor plan on the client site. Sales also end early when every seat is sold."
      >
        <VenueLayoutPublishCard
          embedded
          clientEnabled={page.settings?.clientEnabled ?? false}
          isToggling={page.isTogglingPublish}
          onToggle={page.toggleClientEnabled}
        />
      </VenueLayoutPromoModuleSection>

      <VenueLayoutPromoModuleSection
        icon={Sparkles}
        title="Home section copy"
        description="Title and description shown above the event cards on the home page (same block as About Shamell)."
        className="mt-8"
        headerAction={
          <button
            type="button"
            onClick={page.openModal}
            className="rounded-lg border border-gold/35 bg-gold/10 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-gold transition hover:bg-gold/20"
          >
            Edit home section
          </button>
        }
      >
        {page.isLoading ? (
          <p className="text-xs text-foreground/55">Loading…</p>
        ) : (
          <VenueLayoutPromoPreview
            embedded
            settings={page.settings ?? emptySettings}
            onEdit={page.openModal}
          />
        )}
      </VenueLayoutPromoModuleSection>

      <VenueLayoutPromoEditModal
        isOpen={page.isModalOpen}
        onClose={page.closeModal}
        onSubmit={page.onSubmit}
        promoTitle={page.promoTitle}
        setPromoTitle={page.setPromoTitle}
        promoDescription={page.promoDescription}
        setPromoDescription={page.setPromoDescription}
        isSubmitting={page.isSubmitting}
      />
    </>
  );
}
