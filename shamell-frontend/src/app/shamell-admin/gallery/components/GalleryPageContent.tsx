import AdminModuleHero from "@/components/admin/AdminModuleHero";
import type { useGalleryPage } from "../hooks/useGalleryPage";
import GalleryLibrarySection from "./GalleryLibrarySection";
import GalleryManageCategoriesLink from "./GalleryManageCategoriesLink";
import GalleryNoCategoriesBanner from "./GalleryNoCategoriesBanner";
import GalleryPhotoModal from "./GalleryPhotoModal";
import GalleryStatsBar from "./GalleryStatsBar";
import GalleryToolbar from "./GalleryToolbar";

type PageState = ReturnType<typeof useGalleryPage>;

type Props = {
  state: PageState;
};

export default function GalleryPageContent({ state }: Props) {
  const { catalog, library, form } = state;
  const hasActiveCategories = library.activeCategories.length > 0;

  return (
    <div className="mx-auto w-full max-w-6xl">
      <AdminModuleHero
        title="Gallery"
        actionLabel="Upload to category"
        onAction={state.openPhotoModalForCreate}
        bordered={false}
      />

      <GalleryManageCategoriesLink />

      {!hasActiveCategories ? <GalleryNoCategoriesBanner /> : null}

      <GalleryStatsBar stats={library.stats} />

      <GalleryToolbar
        searchQuery={library.searchQuery}
        onSearchChange={library.setSearchQuery}
        filterDropdownOpen={library.filterDropdownOpen}
        onFilterDropdownOpenChange={library.setFilterDropdownOpen}
        filterDropdownRef={library.filterDropdownRef}
        listCategoryFilter={library.listCategoryFilter}
        onListCategoryFilterChange={library.setListCategoryFilter}
        filterSummaryLabel={library.filterSummaryLabel}
        filterCount={library.filterCount}
        filterMedioLabel={library.filterMedioLabel}
        totalForFilterAll={library.totalForFilterAll}
        sortedActiveCategories={library.sortedActiveCategories}
        countByCategory={library.countByCategory}
      />

      <GalleryLibrarySection
        isLoading={catalog.isLoading}
        photosCount={catalog.photos.length}
        filteredPhotosCount={library.filteredPhotos.length}
        categoriesForLibrary={library.categoriesForLibrary}
        filteredPhotos={library.filteredPhotos}
        expandedAlbumIds={library.expandedAlbumIds}
        onToggleAlbumExpanded={library.toggleAlbumExpanded}
        onUploadToCategory={state.openUploadToCategory}
        onEditPhoto={state.startPhotoEdit}
        onDeletePhoto={(id) => void state.onDisablePhoto(id)}
        onTogglePhoto={(photo) => void state.onTogglePhotoActive(photo)}
      />

      <GalleryPhotoModal
        isOpen={state.isPhotoModalOpen}
        isSubmitting={state.isSubmittingPhoto}
        editingId={form.editingPhotoId}
        canSubmitPhoto={form.canSubmitPhoto}
        selectedCategoryId={form.selectedCategoryId}
        onSelectedCategoryIdChange={form.setSelectedCategoryId}
        imageFiles={form.imageFiles}
        onImageFilesChange={form.setImageFiles}
        sortedActiveCategories={library.sortedActiveCategories}
        countByCategory={library.countByCategory}
        selectedCategoryName={form.selectedCategoryName}
        selectedCategorySlug={form.selectedCategorySlug}
        onClose={state.closePhotoModal}
        onSubmit={state.onSubmitPhoto}
      />
    </div>
  );
}
