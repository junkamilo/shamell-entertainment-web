"use client";

import AdminBackButton from "@/components/admin/AdminBackButton";
import AdminModuleHero from "@/components/admin/AdminModuleHero";
import { AGENDA_HUB_PATH } from "../lib/miAgendaRoutes";
import { useMiAgendaPage } from "../hooks/useMiAgendaPage";
import MiAgendaCalendarToolbar from "./MiAgendaCalendarToolbar";
import MiAgendaCancelModal from "./MiAgendaCancelModal";
import MiAgendaDayView from "./MiAgendaDayView";
import MiAgendaEventDetailsPanel from "./MiAgendaEventDetailsPanel";
import MiAgendaMonthView from "./MiAgendaMonthView";
import MiAgendaWeekView from "./MiAgendaWeekView";

export default function MiAgendaPageContent() {
  const page = useMiAgendaPage();
  const { calendar, bookings, edit } = page;

  return (
    <div className="mx-auto w-full max-w-7xl">
      <AdminBackButton href={AGENDA_HUB_PATH} label="Back" className="mb-4" />
      <AdminModuleHero title="My calendar" bordered={false} />

      <section className="shamell-glass-surface rounded-2xl p-4 md:p-6">
        <MiAgendaCalendarToolbar
          rangeText={calendar.rangeText}
          viewMode={calendar.viewMode}
          onViewModeChange={calendar.setViewMode}
          onPrev={calendar.goPrev}
          onNext={calendar.goNext}
          onToday={calendar.goToday}
        />

        {bookings.error ? <p className="mb-4 text-sm text-red-300">{bookings.error}</p> : null}

        {calendar.viewMode === "day" ? (
          <MiAgendaDayView
            anchorIso={calendar.anchorIso}
            rows={bookings.byDate.get(calendar.anchorIso) ?? []}
            selectedId={page.selectedId}
            onSelect={page.setSelectedId}
          />
        ) : null}

        {calendar.viewMode === "week" ? (
          <MiAgendaWeekView
            weekDays={calendar.weekDays}
            byDate={bookings.byDate}
            selectedId={page.selectedId}
            onSelect={page.setSelectedId}
          />
        ) : null}

        {calendar.viewMode === "month" ? (
          <MiAgendaMonthView
            anchorIso={calendar.anchorIso}
            monthGrid={calendar.monthGrid}
            byDate={bookings.byDate}
            selectedId={page.selectedId}
            onSelect={page.setSelectedId}
          />
        ) : null}

        <MiAgendaEventDetailsPanel
          selected={page.selected}
          isEditing={edit.isEditing}
          savingEdit={edit.savingEdit}
          savingCancel={page.savingCancel}
          editDateIso={edit.editDateIso}
          editStart={edit.editStart}
          editEnd={edit.editEnd}
          editLocation={edit.editLocation}
          editNotes={edit.editNotes}
          onToggleEdit={edit.toggleEditing}
          onOpenCancelModal={() => page.setCancelModalOpen(true)}
          onEditDateChange={edit.setEditDateIso}
          onEditStartChange={edit.setEditStart}
          onEditEndChange={edit.setEditEnd}
          onEditLocationChange={edit.setEditLocation}
          onEditNotesChange={edit.setEditNotes}
          onSave={page.onSaveEdit}
        />

        {bookings.isLoading ? (
          <p className="mt-4 text-sm text-foreground/55">Loading calendar...</p>
        ) : null}
      </section>

      <MiAgendaCancelModal
        isOpen={page.cancelModalOpen}
        onClose={() => page.setCancelModalOpen(false)}
        onConfirm={page.onConfirmCancel}
      />
    </div>
  );
}
