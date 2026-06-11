"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import AdminModuleHero from "@/components/admin/AdminModuleHero";
import EventsPage from "@/app/shamell-admin/events/components/EventsPage";
import {
  ON_COMING_EVENTS_SITE_TAB_RESERVATION,
  ON_COMING_EVENTS_SITE_TAB_UPCOMING,
  parseOnComingEventsSiteTab,
  type OnComingEventsSiteTab,
} from "@/lib/onComingEventsRoutes";
import { useAdminVenueLayoutPromoPage } from "../hooks/useAdminVenueLayoutPromoPage";
import { OnComingEventsSiteSectionTabs } from "./OnComingEventsSiteSectionTabs";
import { VenueLayoutReservationTabPanel } from "./VenueLayoutReservationTabPanel";

function OnComingEventsSiteHubPageInner() {
  const searchParams = useSearchParams();
  const tabQuery = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState<OnComingEventsSiteTab>(() =>
    parseOnComingEventsSiteTab(tabQuery),
  );
  const reservationPage = useAdminVenueLayoutPromoPage();

  useEffect(() => {
    setActiveTab(parseOnComingEventsSiteTab(tabQuery));
  }, [tabQuery]);

  return (
    <div className="mx-auto w-full min-w-0 max-w-6xl overflow-x-hidden">
      <AdminModuleHero
        title="On Coming Events (site)"
        bordered={false}
        actionLabel={
          activeTab === ON_COMING_EVENTS_SITE_TAB_RESERVATION
            ? "Edit home section"
            : undefined
        }
        onAction={
          activeTab === ON_COMING_EVENTS_SITE_TAB_RESERVATION
            ? reservationPage.openModal
            : undefined
        }
      />

      <div className="mb-6">
        <OnComingEventsSiteSectionTabs activeTab={activeTab} />
      </div>

      {activeTab === ON_COMING_EVENTS_SITE_TAB_UPCOMING ? (
        <EventsPage key="upcoming-events" embedded upcomingOnly />
      ) : (
        <VenueLayoutReservationTabPanel
          key="reservation-events"
          page={reservationPage}
        />
      )}
    </div>
  );
}

export function OnComingEventsSiteHubPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-6xl p-8 text-sm text-foreground/55">
          Loading On Coming Events…
        </div>
      }
    >
      <OnComingEventsSiteHubPageInner />
    </Suspense>
  );
}
