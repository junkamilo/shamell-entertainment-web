import { BlockedActionModal, useBlockedActionWarning, ConfirmDeleteModal, ConfirmDeleteMessage } from "@/components/admin/overlays";
import { ModuleHero } from "@/components/admin/layout";
import type { useEventTypesPage } from "../hooks/useEventTypesPage";
import type { EventTypeItem } from "../types/eventTypes.types";
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
  const blockedWarning = useBlockedActionWarning();

  const showDeactivateBlocked = (item: EventTypeItem) => {
    blockedWarning.openWarning({
      title: "Cannot deactivate",
      description: state.getDeactivateBlockedDescription(item),
    });
  };

  const showDeleteBlocked = (item: EventTypeItem) => {
    blockedWarning.openWarning({
      title: "Cannot delete",
      description: state.getDeleteBlockedDescription(item),
    });
  };

  const handleDelete = (item: EventTypeItem) => {
    if (!state.canDeleteEventType(item)) {
      showDeleteBlocked(item);
      return;
    }
    state.openDeleteConfirm(item);
  };

  return (
    <div className="mx-auto min-w-0 w-full max-w-6xl overflow-x-hidden">
      <ModuleHero
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
        cannotDeactivate={state.cannotDeactivateWhileActive}
        onEdit={state.startEdit}
        onDelete={handleDelete}
        onToggleActive={(item) => void state.onToggleActive(item)}
        onBlockedDeactivate={showDeactivateBlocked}
      />

      <EventTypesFormModal
        isOpen={state.isModalOpen}
        editingId={form.editingId}
        editingRow={form.editingRow}
        name={form.name}
        onNameChange={form.setName}
        contactInquiryCode={form.contactInquiryCode}
        onContactInquiryCodeChange={form.setContactInquiryCode}
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

      <ConfirmDeleteModal
        title="Delete event type"
        isOpen={Boolean(state.pendingDelete)}
        isDeleting={state.isDeleting}
        onClose={state.closeDeleteModal}
        onConfirm={() => void state.onConfirmDelete()}
      >
        <ConfirmDeleteMessage
          entityLabel="event type"
          name={state.pendingDelete?.name ?? ""}
          consequences={[
            "Occasion-type links on this type will also be removed.",
            "This action cannot be undone.",
          ]}
        />
      </ConfirmDeleteModal>

      <BlockedActionModal
        isOpen={blockedWarning.isOpen}
        onClose={blockedWarning.closeWarning}
        title={blockedWarning.title}
        description={blockedWarning.description}
      />
    </div>
  );
}
