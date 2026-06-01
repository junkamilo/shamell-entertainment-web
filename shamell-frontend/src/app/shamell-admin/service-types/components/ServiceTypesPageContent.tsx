import AdminBlockedActionModal from "@/components/admin/AdminBlockedActionModal";
import AdminModuleHero from "@/components/admin/AdminModuleHero";
import { useAdminBlockedActionWarning } from "@/components/admin/useAdminBlockedActionWarning";
import type { useServiceTypesPage } from "../hooks/useServiceTypesPage";
import type { ServiceTypeItem } from "../types/serviceTypes.types";
import AdminDeleteConfirmModal, {
  AdminDeleteConfirmMessage,
} from "@/components/admin/AdminDeleteConfirmModal";
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
  const blockedWarning = useAdminBlockedActionWarning();

  const showDeactivateBlocked = (item: ServiceTypeItem) => {
    blockedWarning.openWarning({
      title: "Cannot deactivate",
      description: state.getDeactivateBlockedDescription(item),
    });
  };

  const showDeleteBlocked = (item: ServiceTypeItem) => {
    blockedWarning.openWarning({
      title: "Cannot delete",
      description: state.getDeleteBlockedDescription(item),
    });
  };

  const handleDelete = (item: ServiceTypeItem) => {
    if (!state.canDeleteServiceType(item)) {
      showDeleteBlocked(item);
      return;
    }
    state.openDeleteConfirm(item);
  };

  return (
    <div className="mx-auto min-w-0 w-full max-w-6xl">
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
        cannotDeactivate={state.cannotDeactivateWhileActive}
        onEdit={state.startEdit}
        onDelete={handleDelete}
        onToggleActive={(item) => void state.onToggleActive(item)}
        onBlockedDeactivate={showDeactivateBlocked}
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

      <AdminDeleteConfirmModal
        title="Delete service type"
        isOpen={Boolean(state.pendingDelete)}
        isDeleting={state.isDeleting}
        onClose={state.closeDeleteModal}
        onConfirm={() => void state.onConfirmDelete()}
      >
        <AdminDeleteConfirmMessage
          entityLabel="service type"
          name={state.pendingDelete?.name ?? ""}
          consequences={["It will be removed from the catalog.", "This action cannot be undone."]}
        />
      </AdminDeleteConfirmModal>

      <AdminBlockedActionModal
        isOpen={blockedWarning.isOpen}
        onClose={blockedWarning.closeWarning}
        title={blockedWarning.title}
        description={blockedWarning.description}
      />
    </div>
  );
}
