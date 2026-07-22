"use client";

import { Suspense } from "react";
import AdminBackButton from "@/components/admin/AdminBackButton";
import AdminModuleHero from "@/components/admin/AdminModuleHero";
import { ON_COMING_EVENTS_ADMIN_PATH } from "@/lib/onComingEventsRoutes";
import { AGENDA_HUB_PATH } from "../../lib/agendaRoutes";
import { useBoxOfficeMode } from "../hooks/useBoxOfficeMode";
import { BoxOfficeClassesPanel } from "./BoxOfficeClassesPanel";
import { BoxOfficeFixedEventPanel } from "./BoxOfficeFixedEventPanel";
import { BoxOfficeModeTabs } from "./BoxOfficeModeTabs";

function BoxOfficePageBody() {
  const { mode, setMode } = useBoxOfficeMode();

  return (
    <>
      <AdminBackButton href={AGENDA_HUB_PATH} label="Back" className="mb-4" />

      <AdminModuleHero
        title="Box office"
        actionLabel="On Coming"
        actionHref={ON_COMING_EVENTS_ADMIN_PATH}
        bordered={false}
      />

      <BoxOfficeModeTabs activeMode={mode} onModeChange={setMode} />

      {mode === "fixed" ? (
        <BoxOfficeFixedEventPanel />
      ) : (
        <BoxOfficeClassesPanel />
      )}
    </>
  );
}

export default function BoxOfficePageContent() {
  return (
    <div className="mx-auto w-full max-w-4xl">
      <Suspense fallback={null}>
        <BoxOfficePageBody />
      </Suspense>
    </div>
  );
}
