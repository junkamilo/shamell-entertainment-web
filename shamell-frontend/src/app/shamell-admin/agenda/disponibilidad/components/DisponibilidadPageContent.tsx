"use client";

import { AnimatePresence } from "motion/react";
import AdminBackButton from "@/components/admin/AdminBackButton";
import AdminModuleHero from "@/components/admin/AdminModuleHero";
import { AGENDA_HUB_PATH } from "../lib/disponibilidadRoutes";
import { useDisponibilidadPage } from "../hooks/useDisponibilidadPage";
import DisponibilidadClosuresPanel from "./DisponibilidadClosuresPanel";
import DisponibilidadDeleteClosureModal from "./DisponibilidadDeleteClosureModal";
import DisponibilidadPanelTabs from "./DisponibilidadPanelTabs";
import DisponibilidadPickers from "./DisponibilidadPickers";
import DisponibilidadWeeklyPanel from "./DisponibilidadWeeklyPanel";

export default function DisponibilidadPageContent() {
  const page = useDisponibilidadPage();

  return (
    <div className="mx-auto w-full min-w-0 max-w-4xl">
      <AdminBackButton href={AGENDA_HUB_PATH} label="Back" className="mb-4" />
      <AdminModuleHero title="Availability" bordered={false} />

      <DisponibilidadPanelTabs
        activePanel={page.activePanel}
        onPanelChange={page.setActivePanel}
      />

      <AnimatePresence mode="wait">
        {page.activePanel === "weekly" ? (
          <DisponibilidadWeeklyPanel
            snapshot={page.snapshot}
            isLoading={page.isLoading}
            error={page.error}
            rows={page.weekly.sortedRows}
            savingWeekly={page.weekly.savingWeekly}
            onSaveWeekly={page.onSaveWeekly}
            onReload={page.reload}
            onRowClosedChange={page.weekly.updateRowClosed}
            onOpenTimePicker={page.setTimePickerTarget}
          />
        ) : (
          <DisponibilidadClosuresPanel
            snapshot={page.snapshot}
            closureKind={page.closure.closureKind}
            closureDate={page.closure.closureDate}
            closureStartDate={page.closure.closureStartDate}
            closureEndDate={page.closure.closureEndDate}
            closureWeekday={page.closure.closureWeekday}
            closureNote={page.closure.closureNote}
            addingClosure={page.closure.addingClosure}
            onClosureKindChange={page.closure.onClosureKindChange}
            onClosureWeekdayChange={(id) => page.closure.setClosureWeekday(Number(id))}
            onClosureNoteChange={page.closure.setClosureNote}
            onOpenDatePicker={page.closure.setClosureDatePickerTarget}
            onAddClosure={page.onAddClosure}
            onRequestDelete={page.closure.setConfirmClosureId}
          />
        )}
      </AnimatePresence>

      <DisponibilidadPickers
        timePickerTarget={page.timePickerTarget}
        pickerValue={page.pickerValue}
        onCloseTimePicker={() => page.setTimePickerTarget(null)}
        onTimePickerConfirm={page.onTimePickerConfirm}
        closureDatePickerTarget={page.closure.closureDatePickerTarget}
        closureDate={page.closure.closureDate}
        closureStartDate={page.closure.closureStartDate}
        closureEndDate={page.closure.closureEndDate}
        onCloseDatePicker={() => page.closure.setClosureDatePickerTarget(null)}
        onClosureDateConfirm={page.closure.onClosureDateConfirm}
      />

      <DisponibilidadDeleteClosureModal
        confirmClosureId={page.closure.confirmClosureId}
        onClose={() => page.closure.setConfirmClosureId(null)}
        onConfirmDelete={page.onConfirmDeleteClosure}
      />
    </div>
  );
}
