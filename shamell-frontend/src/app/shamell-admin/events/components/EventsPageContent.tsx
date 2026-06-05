import AdminBlockedActionModal from "@/components/admin/AdminBlockedActionModal";
import AdminModuleHero from "@/components/admin/AdminModuleHero";
import { useAdminBlockedActionWarning } from "@/components/admin/useAdminBlockedActionWarning";
import type { useEventsPage } from "../hooks/useEventsPage";
import type { AdminEvent } from "../types/events.types";
import EventsDeleteModal from "./EventsDeleteModal";
import EventsFormModal from "./EventsFormModal";
import EventsListSection from "./EventsListSection";
import EventsSearchBar from "./EventsSearchBar";
import EventsStatsBar from "./EventsStatsBar";
import EventsViewOverlay from "./EventsViewOverlay";

type PageState = ReturnType<typeof useEventsPage>;

type Props = {
  state: PageState;
};

export default function EventsPageContent({ state }: Props) {
  const { catalog, list, form } = state;
  const blockedWarning = useAdminBlockedActionWarning();

  const showDeactivateBlocked = (item: AdminEvent) => {
    blockedWarning.openWarning({
      title: "Cannot deactivate",
      description: state.getDeactivateBlockedDescription(item),
    });
  };

  const showDeleteBlocked = (item: AdminEvent) => {
    blockedWarning.openWarning({
      title: "Cannot delete",
      description: state.getDeleteBlockedDescription(item),
    });
  };

  const handleDelete = (item: AdminEvent) => {
    if (!state.canDeleteEvent(item)) {
      showDeleteBlocked(item);
      return;
    }
    state.openDeleteConfirm(item);
  };

  const wrapperClass = state.embedded
    ? "w-full min-w-0 overflow-x-hidden"
    : "mx-auto min-w-0 w-full max-w-6xl overflow-x-hidden";

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

      <EventsStatsBar
        stats={list.stats}
        variant={state.upcomingOnly ? "upcomingSite" : "general"}
      />

      <EventsSearchBar
        searchQuery={list.searchQuery}
        onSearchChange={list.setSearchQuery}
        sectionFilter={list.sectionFilter}
        onSectionFilterChange={list.setSectionFilter}
        hideSectionFilter
        upcomingOnly={state.upcomingOnly}
      />

      <EventsListSection
        isLoading={catalog.isLoading}
        sectionEventsCount={list.sectionEventsCount}
        searchedCount={list.searchedEvents.length}
        paginatedEvents={list.paginatedEvents}
        pageOffset={list.pageOffset}
        safePage={list.safePage}
        totalPages={list.totalPages}
        onPageChange={list.setPage}
        onCreateClick={state.openCreateModal}
        togglingId={state.togglingId}
        cannotDeactivate={state.cannotDeactivateWhileActive}
        onView={state.setViewEvent}
        onEdit={state.startEdit}
        onDelete={handleDelete}
        onToggleActive={(item) => void state.onToggleActive(item)}
        onBlockedDeactivate={showDeactivateBlocked}
      />

      <EventsFormModal
        isOpen={state.isModalOpen}
        editingId={form.editingId}
        isSubmitting={state.isSubmitting}
        submittingMessage={state.submittingMessage}
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
        existingImages={form.existingImages}
        pendingFiles={form.pendingFiles}
        pendingPreviewUrls={form.pendingPreviewUrls}
        onClose={state.closeModal}
        onSubmit={state.onSubmit}
        onPickCatalogImages={form.onPickCatalogImages}
        onRemovePendingAt={form.removePendingAt}
        onRemoveExistingImage={(id) => void state.removeExistingCatalogImage(id)}
        experienceMode={form.experienceMode}
        onExperienceModeChange={form.setExperienceMode}
        schedule={form.schedule}
        onScheduleChange={form.setSchedule}
        enableVenueSeating={form.enableVenueSeating}
        onEnableVenueSeatingChange={form.setEnableVenueSeating}
        fixedTicketCapacityInput={form.fixedTicketCapacityInput}
        onFixedTicketCapacityInputChange={form.setFixedTicketCapacityInput}
        monthPackageEnabled={form.monthPackageEnabled}
        onMonthPackageEnabledChange={form.setMonthPackageEnabled}
        monthPackagePrice={form.monthPackagePrice}
        onMonthPackagePriceChange={form.setMonthPackagePrice}
        monthPackageLabel={form.monthPackageLabel}
        onMonthPackageLabelChange={form.setMonthPackageLabel}
      />

      <EventsDeleteModal
        pendingDelete={state.pendingDelete}
        isDeleting={state.isDeleting}
        onClose={state.closeDeleteModal}
        onConfirm={() => void state.onConfirmDelete()}
      />

      <EventsViewOverlay viewEvent={state.viewEvent} onClose={() => state.setViewEvent(null)} />

      <AdminBlockedActionModal
        isOpen={blockedWarning.isOpen}
        onClose={blockedWarning.closeWarning}
        title={blockedWarning.title}
        description={blockedWarning.description}
      />
    </div>
  );
}
