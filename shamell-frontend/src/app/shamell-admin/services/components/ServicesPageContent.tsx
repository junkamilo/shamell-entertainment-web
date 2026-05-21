import AdminModuleHero from "@/components/admin/AdminModuleHero";
import type { useServicesPage } from "../hooks/useServicesPage";
import ServicesClearMediaModal from "./ServicesClearMediaModal";
import ServicesDeleteModal from "./ServicesDeleteModal";
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
  const activeTypesCount = catalog.serviceTypes.filter((item) => item.isActive).length;

  return (
    <div className="mx-auto w-full min-w-0 max-w-6xl overflow-x-hidden">
      <AdminModuleHero
        title="Services"
        actionLabel="New service"
        onAction={state.openCreateModal}
        bordered={false}
      />

      {activeTypesCount === 0 ? <ServicesNoTypesBanner /> : null}

      <ServicesStatsBar stats={list.stats} typeMostUsedLabel={list.typeMostUsedLabel} />

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
        canDelete={state.canDeleteService}
        cannotDeactivate={state.cannotDeactivateWhileActive}
        getDeleteBlockedTitle={state.getDeleteBlockedTitle}
        onView={state.setViewService}
        onEdit={state.startEdit}
        onDelete={state.openDeleteConfirm}
        onToggle={(service) => void state.onToggleActive(service)}
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

      <ServicesDeleteModal
        isOpen={Boolean(state.pendingDelete)}
        title={state.pendingDeleteTitle}
        isDeleting={state.isDeleting}
        onClose={state.closeDeleteModal}
        onConfirm={() => void state.onConfirmDelete()}
      />
    </div>
  );
}
