import AdminModuleHero from "@/components/admin/AdminModuleHero";
import type { useEventTypesPage } from "../hooks/useEventTypesPage";
import EventTypesDeleteModal from "./EventTypesDeleteModal";
import EventTypesFormModal from "./EventTypesFormModal";
import EventTypesListSection from "./EventTypesListSection";
import EventTypesStatsBar from "./EventTypesStatsBar";
import EventTypesToolbar from "./EventTypesToolbar";

type PageState = ReturnType<typeof useEventTypesPage>;

type Props = {
  state: PageState;
};

export default function EventTypesPageContent({ state }: Props) {
  const { list, form } = state;

  return (
    <div className="mx-auto w-full max-w-6xl">
      <AdminModuleHero
        title="Event types"
        actionLabel="New type"
        onAction={state.openCreateModal}
        bordered={false}
      />

      <EventTypesStatsBar stats={list.stats} />

      <EventTypesToolbar
        searchQuery={list.searchQuery}
        onSearchChange={list.setSearchQuery}
        filterTab={list.filterTab}
        onFilterTabChange={list.setFilterTab}
      />

      <EventTypesListSection
        isLoading={list.isLoading}
        typesCount={list.types.length}
        filteredCount={list.filteredTypes.length}
        pagedTypes={list.pagedTypes}
        paginationMeta={list.paginationMeta}
        onPageChange={list.setPage}
        onPerPageChange={list.onPerPageChange}
        onCreateClick={state.openCreateModal}
        togglingId={state.togglingId}
        canDelete={state.canDeleteEventType}
        cannotDeactivate={state.cannotDeactivateWhileActive}
        onEdit={state.startEdit}
        onDelete={state.openDeleteConfirm}
        onToggleActive={(item) => void state.onToggleActive(item)}
      />

      <EventTypesFormModal
        isOpen={state.isModalOpen}
        editingId={form.editingId}
        editingRow={form.editingRow}
        name={form.name}
        onNameChange={form.setName}
        occasionCatalog={state.occasionCatalog}
        activeOccasionsCatalog={form.activeOccasionsCatalog}
        linkedOccasionIds={form.linkedOccasionIds}
        linkedOrphanIds={form.linkedOrphanIds}
        canSubmit={form.canSubmit}
        isSubmitting={state.isSubmitting}
        onClose={state.closeModal}
        onSubmit={state.onSubmit}
        onToggleLinkedOccasion={form.toggleLinkedOccasion}
      />

      <EventTypesDeleteModal
        pendingDelete={state.pendingDelete}
        isDeleting={state.isDeleting}
        onClose={state.closeDeleteModal}
        onConfirm={() => void state.onConfirmDelete()}
      />
    </div>
  );
}
