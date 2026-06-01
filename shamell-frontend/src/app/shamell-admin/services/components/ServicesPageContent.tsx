import AdminBlockedActionModal from "@/components/admin/AdminBlockedActionModal";
import AdminModuleHero from "@/components/admin/AdminModuleHero";
import { useAdminBlockedActionWarning } from "@/components/admin/useAdminBlockedActionWarning";
import type { AdminService } from "../types/services.types";
import type { useServicesPage } from "../hooks/useServicesPage";
import ServicesClearMediaModal from "./ServicesClearMediaModal";
import AdminDeleteConfirmModal, {
  AdminDeleteConfirmMessage,
} from "@/components/admin/AdminDeleteConfirmModal";
import ServicesFormLightbox from "./ServicesFormLightbox";
import ServicesFormModal from "./ServicesFormModal";
import ServicesListSection from "./ServicesListSection";
import ServicesNoTypesBanner from "./ServicesNoTypesBanner";
import ServicesStatsBar from "./ServicesStatsBar";
import ServicesToolbar from "./ServicesToolbar";
import ServicesViewOverlay from "./ServicesViewOverlay";

type PageState = ReturnType<typeof useServicesPage>;

type Props = {
  state: PageState;
};

export default function ServicesPageContent({ state }: Props) {
  const { catalog, list, form } = state;
  const blockedWarning = useAdminBlockedActionWarning();
  const activeTypesCount = catalog.serviceTypes.filter((item) => item.isActive).length;

  const showDeactivateBlocked = (service: AdminService) => {
    blockedWarning.openWarning({
      title: "Cannot deactivate",
      description: state.getDeactivateBlockedDescription(service),
    });
  };

  const showDeleteBlocked = (service: AdminService) => {
    blockedWarning.openWarning({
      title: "Cannot delete",
      description: state.getDeleteBlockedDescription(service),
    });
  };

  const handleDelete = (service: AdminService) => {
    if (!state.canDeleteService(service)) {
      showDeleteBlocked(service);
      return;
    }
    state.openDeleteConfirm(service);
  };

  return (
    <div className="mx-auto w-full min-w-0 max-w-6xl overflow-x-hidden">
      <AdminModuleHero
        title="Services"
        actionLabel="New service"
        onAction={state.openCreateModal}
        bordered={false}
      />

      {activeTypesCount === 0 ? <ServicesNoTypesBanner /> : null}

      <ServicesStatsBar stats={list.stats} />

      <ServicesToolbar
        searchQuery={list.searchQuery}
        onSearchChange={list.setSearchQuery}
        filterTab={list.filterTab}
        onFilterTabChange={list.setFilterTab}
        tabCounts={list.tabCounts}
        filtersOpen={list.filtersOpen}
        onFiltersOpenChange={list.setFiltersOpen}
        typeFilterId={list.typeFilterId}
        onTypeFilterChange={list.setTypeFilterId}
        serviceTypes={catalog.serviceTypes}
      />

      <ServicesListSection
        isLoading={catalog.isLoading}
        filteredServices={list.filteredServices}
        paginatedServices={list.paginatedServices}
        pageOffset={list.pageOffset}
        safePage={list.safePage}
        totalPages={list.totalPages}
        onPageChange={list.setPage}
        togglingId={state.togglingId}
        cannotDeactivate={state.cannotDeactivateWhileActive}
        onView={state.setViewService}
        onEdit={state.startEdit}
        onDelete={handleDelete}
        onToggle={(service) => void state.onToggleActive(service)}
        onBlockedDeactivate={showDeactivateBlocked}
      />

      <ServicesFormModal
        isOpen={state.isModalOpen}
        isSubmitting={state.isSubmitting}
        isClearingMedia={state.isClearingMedia}
        editingId={form.editingId}
        canSubmit={form.canSubmit}
        serviceTypeId={form.serviceTypeId}
        setServiceTypeId={form.setServiceTypeId}
        description={form.description}
        setDescription={form.setDescription}
        itemsText={form.itemsText}
        setItemsText={form.setItemsText}
        priceInput={form.priceInput}
        setPriceInput={form.setPriceInput}
        image={form.image}
        setImage={form.setImage}
        imagePreviewUrl={form.imagePreviewUrl}
        existingImageUrl={form.existingImageUrl}
        formPreviewMediaIsVideo={form.formPreviewMediaIsVideo}
        isTypeDropdownOpen={form.isTypeDropdownOpen}
        setIsTypeDropdownOpen={form.setIsTypeDropdownOpen}
        setIsPreviewLightboxOpen={form.setIsPreviewLightboxOpen}
        activeServiceTypes={form.activeServiceTypes}
        selectedTypeName={form.selectedTypeName}
        mediaFileInputRef={form.mediaFileInputRef}
        clearMediaFileInput={form.clearMediaFileInput}
        onClose={state.closeModal}
        onSubmit={state.onSubmit}
        onRequestClearSavedMedia={() => state.setPendingClearMedia(true)}
      />

      <ServicesFormLightbox
        isOpen={form.isPreviewLightboxOpen}
        src={form.imagePreviewUrl ?? form.existingImageUrl}
        isVideo={form.formPreviewMediaIsVideo}
        onClose={() => form.setIsPreviewLightboxOpen(false)}
      />

      <ServicesViewOverlay service={state.viewService} onClose={() => state.setViewService(null)} />

      <ServicesClearMediaModal
        isOpen={state.pendingClearMedia}
        isClearing={state.isClearingMedia}
        onClose={state.closeClearMediaModal}
        onConfirm={() => void state.onConfirmClearMedia()}
      />

      <AdminDeleteConfirmModal
        title="Delete service"
        isOpen={Boolean(state.pendingDelete)}
        isDeleting={state.isDeleting}
        onClose={state.closeDeleteModal}
        onConfirm={() => void state.onConfirmDelete()}
      >
        <AdminDeleteConfirmMessage
          entityLabel="service"
          name={state.pendingDeleteTitle}
          meta={state.pendingDelete?.serviceTypeName}
          consequences={[
            "It will be removed from the catalog and from cloud storage.",
            "This action cannot be undone.",
          ]}
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
