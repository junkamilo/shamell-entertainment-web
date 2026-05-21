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

  return (
    <div className="mx-auto w-full max-w-6xl">
      <AdminModuleHero
        title="Events"
        actionLabel="New event"
        onAction={state.openCreateModal}
        bordered={false}
      />

      {!hasActiveTypes ? <EventsNoTypesBanner /> : null}

      <EventsStatsBar stats={list.stats} />

      <EventsSearchBar searchQuery={list.searchQuery} onSearchChange={list.setSearchQuery} />

      <EventsListSection
        isLoading={catalog.isLoading}
        eventsCount={catalog.events.length}
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
        existingImages={form.existingImages}
        pendingFiles={form.pendingFiles}
        pendingPreviewUrls={form.pendingPreviewUrls}
        onClose={state.closeModal}
        onSubmit={state.onSubmit}
        onPickCatalogImages={form.onPickCatalogImages}
        onRemovePendingAt={form.removePendingAt}
        onRemoveExistingImage={(id) => void state.removeExistingCatalogImage(id)}
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
