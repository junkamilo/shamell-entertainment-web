"use client";

import { BackButton, ModuleHero } from "@/components/admin/layout";
import dynamic from "next/dynamic";
import { useAgendarBookMode } from "../hooks/useAgendarBookMode";
import { useAgendarEditModeFromQuery } from "../hooks/useAgendarEditModeFromQuery";
import { AGENDA_DISPONIBILIDAD_PATH, AGENDA_HUB_PATH } from "../../lib/agendaRoutes";
import { AgendaCatalogSpinner } from "../../shared/components/AgendaCatalogSpinner";
import { AgendarBookModeTabs } from "./AgendarBookModeTabs";
import { AgendarEventBookingPanel } from "./AgendarEventBookingPanel";

const BookClassForm = dynamic(
  () =>
    import("../../book-class/components/BookClassForm").then((m) => ({
      default: m.BookClassForm,
    })),
  {
    ssr: false,
    loading: () => <AgendaCatalogSpinner />,
  },
);

export function AgendarPageContent() {
  const isEditMode = useAgendarEditModeFromQuery();
  const { bookMode, setBookMode, showClassTab } = useAgendarBookMode(isEditMode);

  return (
    <div className="mx-auto w-full max-w-4xl">
      <BackButton href={AGENDA_HUB_PATH} label="Back" className="mb-4" />

      <ModuleHero
        title={isEditMode ? "Edit booking" : "Book"}
        actionLabel="Availability"
        actionHref={AGENDA_DISPONIBILIDAD_PATH}
        bordered={false}
      />

      <AgendarBookModeTabs
        activeMode={bookMode}
        onModeChange={setBookMode}
        showClassTab={showClassTab}
      />

      {bookMode === "class" ? (
        <div data-testid="agendar-class-panel">
          <BookClassForm />
        </div>
      ) : (
        <div data-testid="agendar-event-panel">
          <AgendarEventBookingPanel />
        </div>
      )}
    </div>
  );
}
