import AdminModuleHero from "@/components/admin/AdminModuleHero";
import type { useOccasionTypesPage } from "../hooks/useOccasionTypesPage";
import OccasionTypesDeleteModal from "./OccasionTypesDeleteModal";
import OccasionTypesFormModal from "./OccasionTypesFormModal";
import OccasionTypesListSection from "./OccasionTypesListSection";
import OccasionTypesToolbar from "./OccasionTypesToolbar";

type PageState = ReturnType<typeof useOccasionTypesPage>;

type Props = {
  state: PageState;
};

export default function OccasionTypesPageContent({ state }: Props) {
  const { list, form } = state;

  return (
    <div className="mx-auto w-full max-w-6xl">
      <AdminModuleHero
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
        canDelete={state.canDeleteOccasionType}
        cannotDeactivate={state.cannotDeactivateWhileActive}
        onEdit={state.startEdit}
        onDelete={state.openDeleteConfirm}
        onToggleActive={(item) => void state.onToggleActive(item)}
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

      <OccasionTypesDeleteModal
        pendingDelete={state.pendingDelete}
        isDeleting={state.isDeleting}
        onClose={state.closeDeleteModal}
        onConfirm={() => void state.onConfirmDelete()}
      />
    </div>
  );
}
