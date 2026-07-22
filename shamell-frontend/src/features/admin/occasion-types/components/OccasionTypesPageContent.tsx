import { BlockedActionModal, useBlockedActionWarning, ConfirmDeleteModal, ConfirmDeleteMessage } from "@/components/admin/overlays";
import { ModuleHero } from "@/components/admin/layout";
import type { useOccasionTypesPage } from "../hooks/useOccasionTypesPage";
import type { OccasionTypeItem } from "../types/occasionTypes.types";
import OccasionTypesFormModal from "./OccasionTypesFormModal";
import OccasionTypesListSection from "./OccasionTypesListSection";
import OccasionTypesToolbar from "./OccasionTypesToolbar";

type PageState = ReturnType<typeof useOccasionTypesPage>;

type Props = {
  state: PageState;
};

export default function OccasionTypesPageContent({ state }: Props) {
  const { list, form } = state;
  const blockedWarning = useBlockedActionWarning();

  const showDeactivateBlocked = (item: OccasionTypeItem) => {
    blockedWarning.openWarning({
      title: "Cannot deactivate",
      description: state.getDeactivateBlockedDescription(item),
    });
  };

  const showDeleteBlocked = (item: OccasionTypeItem) => {
    blockedWarning.openWarning({
      title: "Cannot delete",
      description: state.getDeleteBlockedDescription(item),
    });
  };

  const handleDelete = (item: OccasionTypeItem) => {
    if (!state.canDeleteOccasionType(item)) {
      showDeleteBlocked(item);
      return;
    }
    state.openDeleteConfirm(item);
  };

  return (
    <div className="mx-auto min-w-0 w-full max-w-6xl overflow-x-hidden">
      <ModuleHero
        title="Occasion types"
        actionLabel="New type"
        onAction={state.openCreateModal}
        bordered={false}
      />

      <OccasionTypesToolbar
        searchQuery={list.searchQuery}
        onSearchChange={list.setSearchQuery}
        filterTab={list.filterTab}
        onFilterTabChange={list.setFilterTab}
      />

      <OccasionTypesListSection
        isLoading={list.isLoading}
        rowsCount={list.rows.length}
        filteredCount={list.filtered.length}
        pagedRows={list.pagedRows}
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

      <OccasionTypesFormModal
        isOpen={state.isModalOpen}
        editingId={form.editingId}
        name={form.name}
        onNameChange={form.setName}
        canSubmit={form.canSubmit}
        isSubmitting={state.isSubmitting}
        onClose={state.closeModal}
        onSubmit={state.onSubmit}
      />

      <ConfirmDeleteModal
        title="Delete occasion type"
        isOpen={Boolean(state.pendingDelete)}
        isDeleting={state.isDeleting}
        onClose={state.closeDeleteModal}
        onConfirm={() => void state.onConfirmDelete()}
      >
        <ConfirmDeleteMessage
          entityLabel="occasion type"
          name={state.pendingDelete?.name ?? ""}
          consequences={[
            "It will also be removed from event types where it is linked (when there are no bookings).",
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
