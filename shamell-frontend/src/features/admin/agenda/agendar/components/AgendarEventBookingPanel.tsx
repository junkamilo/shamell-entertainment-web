"use client";

import { cn } from "@/lib/utils";
import { useAgendarPage } from "../hooks/useAgendarPage";
import { AGENDAR_FORM_ID } from "../../shared/lib/agendaFormStyles";
import { AgendaCatalogSpinner } from "../../shared/components/AgendaCatalogSpinner";
import { AgendarClientFields, AgendarLocationField } from "./AgendarClientFields";
import { AgendarEventFields } from "./AgendarEventFields";
import { AgendarLogisticsFields } from "./AgendarLogisticsFields";
import { AgendarMobileSectionList } from "./AgendarMobileSectionList";
import { AgendarMobileSectionModals } from "./AgendarMobileSectionModals";
import { AgendarPickers } from "./AgendarPickers";
import { AgendarSubmitBar } from "./AgendarSubmitBar";

export function AgendarEventBookingPanel() {
  const {
    form,
    catalog,
    catalogLoading,
    editLoading,
    availability,
    occupiedRanges,
    isMobileLayout,
    submitting,
    isEditMode,
    onSubmit,
  } = useAgendarPage();

  if (catalogLoading || editLoading) {
    return <AgendaCatalogSpinner />;
  }

  return (
    <>
      <form
        id={AGENDAR_FORM_ID}
        noValidate
        onSubmit={onSubmit}
        className={cn(
          isMobileLayout
            ? "w-full pb-[calc(5.5rem+env(safe-area-inset-bottom))]"
            : "shamell-glass-surface space-y-4 md:space-y-6 rounded-2xl p-4 sm:p-5 md:p-8",
        )}
      >
        {isMobileLayout ? (
          <AgendarMobileSectionList form={form} />
        ) : (
          <>
            <AgendarEventFields catalog={catalog} form={form} />
            <AgendarLogisticsFields form={form} variant="desktop" />
            <AgendarLocationField form={form} />
            <AgendarClientFields form={form} />
            <AgendarSubmitBar isEditMode={isEditMode} submitting={submitting} variant="desktop" />
          </>
        )}
      </form>

      {isMobileLayout ? (
        <>
          <AgendarMobileSectionModals form={form} catalog={catalog} />
          <AgendarSubmitBar isEditMode={isEditMode} submitting={submitting} variant="mobile-fixed" />
        </>
      ) : null}

      <AgendarPickers
        form={form}
        availability={availability}
        occupiedRanges={occupiedRanges}
        isMobileLayout={isMobileLayout}
      />
    </>
  );
}
