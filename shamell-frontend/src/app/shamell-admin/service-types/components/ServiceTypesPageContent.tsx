import AdminModuleHero from "@/components/admin/AdminModuleHero";
import type { useServiceTypesPage } from "../hooks/useServiceTypesPage";
import ServiceTypesDeleteModal from "./ServiceTypesDeleteModal";
import ServiceTypesFormModal from "./ServiceTypesFormModal";
import ServiceTypesListSection from "./ServiceTypesListSection";
import ServiceTypesStatsBar from "./ServiceTypesStatsBar";
import ServiceTypesToolbar from "./ServiceTypesToolbar";

type PageState = ReturnType<typeof useServiceTypesPage>;

type Props = {
  state: PageState;
};

export default function ServiceTypesPageContent({ state }: Props) {
  const { list, form } = state;

  return (
    <div className="mx-auto w-full max-w-6xl">
      <AdminModuleHero
        title="Service types"
        actionLabel="New type"
        onAction={state.openCreateModal}
        bordered={false}
      />

      <ServiceTypesStatsBar stats={list.stats} />

      <ServiceTypesToolbar
        searchQuery={list.searchQuery}
        onSearchChange={list.setSearchQuery}
        filterTab={list.filterTab}
        onFilterTabChange={list.setFilterTab}
      />

      <ServiceTypesListSection
        isLoading={list.isLoading}
        typesCount={list.types.length}
        filteredCount={list.filteredTypes.length}
        pagedTypes={list.pagedTypes}
        paginationMeta={list.paginationMeta}
        onPageChange={list.setPage}
        onPerPageChange={list.onPerPageChange}
        togglingId={state.togglingId}
        canDelete={state.canDeleteServiceType}
        cannotDeactivate={state.cannotDeactivateWhileActive}
        getDeleteBlockedTitle={state.getDeleteBlockedTitle}
        onEdit={state.startEdit}
        onDelete={state.openDeleteConfirm}
        onToggleActive={(item) => void state.onToggleActive(item)}
      />

      <ServiceTypesFormModal
        isOpen={state.isModalOpen}
        editingId={form.editingId}
        name={form.name}
        onNameChange={form.setName}
        canSubmit={form.canSubmit}
        isSubmitting={state.isSubmitting}
        onClose={state.closeModal}
        onSubmit={state.onSubmit}
      />

      <ServiceTypesDeleteModal
        pendingDelete={state.pendingDelete}
        isDeleting={state.isDeleting}
        onClose={state.closeDeleteModal}
        onConfirm={() => void state.onConfirmDelete()}
      />
    </div>
  );
}
