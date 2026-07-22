"use client";

import { BackButton, ModuleHero } from "@/components/admin/layout";
import { Suspense } from "react";
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
      <BackButton href={AGENDA_HUB_PATH} label="Back" className="mb-4" />

      <ModuleHero
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
