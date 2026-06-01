"use client";

import { Suspense, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AdminModuleHero from "@/components/admin/AdminModuleHero";
import EventsPage from "@/app/shamell-admin/events/components/EventsPage";
import {
  ON_COMING_EVENTS_SITE_TAB_RESERVATION,
  ON_COMING_EVENTS_SITE_TAB_UPCOMING,
  onComingEventsSiteAdminHref,
  parseOnComingEventsSiteTab,
  type OnComingEventsSiteTab,
} from "@/lib/onComingEventsRoutes";
import { useAdminVenueLayoutPromoPage } from "../hooks/useAdminVenueLayoutPromoPage";
import { OnComingEventsSiteSectionTabs } from "./OnComingEventsSiteSectionTabs";
import { VenueLayoutReservationTabPanel } from "./VenueLayoutReservationTabPanel";

function OnComingEventsSiteHubPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = parseOnComingEventsSiteTab(searchParams.get("tab"));
  const reservationPage = useAdminVenueLayoutPromoPage();

  const onTabChange = useCallback(
    (tab: OnComingEventsSiteTab) => {
      router.replace(onComingEventsSiteAdminHref(tab));
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [router],
  );

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
        <OnComingEventsSiteSectionTabs activeTab={activeTab} onTabChange={onTabChange} />
      </div>

      {activeTab === ON_COMING_EVENTS_SITE_TAB_UPCOMING ? (
        <EventsPage embedded upcomingOnly />
      ) : (
        <VenueLayoutReservationTabPanel page={reservationPage} />
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
