import AdminModuleHero from "@/components/admin/AdminModuleHero";
import type { useEventsPage } from "../hooks/useEventsPage";
import EventsDeleteModal from "./EventsDeleteModal";
import EventsFormModal from "./EventsFormModal";
import EventsListSection from "./EventsListSection";
import EventsNoTypesBanner from "./EventsNoTypesBanner";
import EventsSearchBar from "./EventsSearchBar";
import EventsStatsBar from "./EventsStatsBar";
import EventsViewOverlay from "./EventsViewOverlay";

type PageState = ReturnType<typeof useEventsPage>;

type Props = {
  state: PageState;
};

export default function EventsPageContent({ state }: Props) {
  const { catalog, list, form } = state;
  const hasActiveTypes = catalog.eventTypes.some((item) => item.isActive);

  const wrapperClass = state.embedded ? "w-full" : "mx-auto w-full max-w-6xl";

  return (
    <div className={wrapperClass}>
      {state.embedded ? (
        <div className="mb-6 flex flex-wrap items-center justify-end gap-3">
          <button
            type="button"
            onClick={state.openCreateModal}
            className="rounded-xl border border-gold/35 bg-gold/15 px-5 py-2.5 font-brand text-xs uppercase tracking-[0.12em] text-gold transition hover:bg-gold/25"
          >
            {state.createLabel}
          </button>
        </div>
      ) : (
        <AdminModuleHero
          title={state.pageTitle}
          actionLabel={state.createLabel}
          onAction={state.openCreateModal}
          bordered={false}
        />
      )}

      {!state.upcomingOnly && !hasActiveTypes ? <EventsNoTypesBanner /> : null}

      <EventsStatsBar
        stats={list.stats}
        variant={state.upcomingOnly ? "upcomingSite" : "general"}
      />

      <EventsSearchBar
        searchQuery={list.searchQuery}
        onSearchChange={list.setSearchQuery}
        sectionFilter={list.sectionFilter}
        onSectionFilterChange={list.setSectionFilter}
        hideSectionFilter={state.upcomingOnly}
      />

      <EventsListSection
        isLoading={catalog.isLoading}
        eventsCount={list.searchedEvents.length}
        searchedCount={list.searchedEvents.length}
        paginatedEvents={list.paginatedEvents}
        pageOffset={list.pageOffset}
        safePage={list.safePage}
        totalPages={list.totalPages}
        onPageChange={list.setPage}
        onCreateClick={state.openCreateModal}
        togglingId={state.togglingId}
        canDelete={state.canDeleteEvent}
        cannotDeactivate={state.cannotDeactivateWhileActive}
        onView={state.setViewEvent}
        onEdit={state.startEdit}
        onDelete={state.openDeleteConfirm}
        onToggleActive={state.onToggleActive}
      />

      <EventsFormModal
        isOpen={state.isModalOpen}
        editingId={form.editingId}
        isSubmitting={state.isSubmitting}
        canSubmit={form.canSubmit}
        freeEventNameMode={form.freeEventNameMode}
        eventName={form.eventName}
        onEventNameChange={form.setEventName}
        eventTypeId={state.eventTypeId}
        activeEventTypes={form.activeEventTypes}
        selectedTypeName={form.selectedTypeName}
        isTypeDropdownOpen={form.isTypeDropdownOpen}
        onTypeDropdownToggle={() => form.setIsTypeDropdownOpen((prev) => !prev)}
        onSelectEventType={(id) => {
          state.setEventTypeId(id);
          form.closeTypeDropdown();
        }}
        description={form.description}
        onDescriptionChange={form.setDescription}
        itemsText={form.itemsText}
        onItemsTextChange={form.setItemsText}
        priceInput={form.priceInput}
        onPriceInputChange={form.setPriceInput}
        publicSection={form.publicSection}
        onPublicSectionChange={form.setPublicSection}
        lockPublicSection={state.upcomingOnly}
        editExperienceType={form.editingId ? form.experienceType : null}
        existingImages={form.existingImages}
        pendingFiles={form.pendingFiles}
        pendingPreviewUrls={form.pendingPreviewUrls}
        onClose={state.closeModal}
        onSubmit={state.onSubmit}
        onPickCatalogImages={form.onPickCatalogImages}
        onRemovePendingAt={form.removePendingAt}
        onRemoveExistingImage={(id) => void state.removeExistingCatalogImage(id)}
        reservationEventTemplates={state.reservationTemplates.templates}
        reservationTemplatesLoading={state.reservationTemplates.loading}
        reservationEventTemplateId={form.reservationEventTemplateId}
        onReservationEventTemplateIdChange={form.setReservationEventTemplateId}
      />

      <EventsDeleteModal
        pendingDelete={state.pendingDelete}
        isDeleting={state.isDeleting}
        onClose={state.closeDeleteModal}
        onConfirm={() => void state.onConfirmDelete()}
      />

      <EventsViewOverlay viewEvent={state.viewEvent} onClose={() => state.setViewEvent(null)} />
    </div>
  );
}
