"use client";

import { ModuleHero } from "@/components/admin/layout";
import { CalendarDays, Sparkles } from "lucide-react";
import { useCallback, useState } from "react";
import { useAdminVenueLayoutPromoPage } from "../hooks/useAdminVenueLayoutPromoPage";
import type {
  VenueLayoutClientSettings,
  VenueLayoutPromoSectionTab,
} from "../types/venueLayoutPromo.types";
import { VenueLayoutPromoEditModal } from "./VenueLayoutPromoEditModal";
import { VenueLayoutPromoModuleSection } from "./VenueLayoutPromoModuleSection";
import { VenueLayoutPromoPreview } from "./VenueLayoutPromoPreview";
import { VenueLayoutPromoSectionTabs } from "./VenueLayoutPromoSectionTabs";
import { VenueLayoutPublishCard } from "./VenueLayoutPublishCard";
import { VenueLayoutReservationEventCard } from "./VenueLayoutReservationEventCard";

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

export function VenueLayoutPromoAdminPage() {
  const page = useAdminVenueLayoutPromoPage();
  const [activeTab, setActiveTab] = useState<VenueLayoutPromoSectionTab>("reservation");

  const onTabChange = useCallback((tab: VenueLayoutPromoSectionTab) => {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <div className="mx-auto w-full max-w-6xl">
      <ModuleHero
        title="On Coming Events (site)"
        bordered={false}
        actionLabel={activeTab === "home-promo" ? "Edit home section" : undefined}
        onAction={activeTab === "home-promo" ? page.openModal : undefined}
      />

      <div className="mb-6">
        <VenueLayoutPromoSectionTabs activeTab={activeTab} onTabChange={onTabChange} />
      </div>

      {activeTab === "reservation" ? (
        <VenueLayoutPromoModuleSection
          icon={CalendarDays}
          title="Reservation event"
          description="Publish the floor plan on the public site and set when table and chair sales open and close. Sales also end early when every seat is sold."
        >
          <VenueLayoutPublishCard
            embedded
            clientEnabled={page.settings?.clientEnabled ?? false}
            isToggling={page.isTogglingPublish}
            onToggle={page.toggleClientEnabled}
          />

          <div className="my-6 border-t border-gold/12" aria-hidden />

          <VenueLayoutReservationEventCard
            settings={page.settings}
            onSaved={page.setSettings}
          />
        </VenueLayoutPromoModuleSection>
      ) : (
        <VenueLayoutPromoModuleSection
          icon={Sparkles}
          title="Home section copy"
          description="Title and description shown above the event cards on the home page."
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
      )}

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
    </div>
  );
}
