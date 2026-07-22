import { ModuleHero } from "@/components/admin/layout";
import type { useGalleryCategoriesPage } from "../hooks/useGalleryCategoriesPage";
import GalleryCategoriesFormModal from "./GalleryCategoriesFormModal";
import GalleryCategoriesGoToGalleryLink from "./GalleryCategoriesGoToGalleryLink";
import GalleryCategoriesLibrarySection from "./GalleryCategoriesLibrarySection";
import GalleryCategoriesStatsBar from "./GalleryCategoriesStatsBar";
import GalleryCategoriesToolbar from "./GalleryCategoriesToolbar";

type PageState = ReturnType<typeof useGalleryCategoriesPage>;

type Props = {
  state: PageState;
};

export default function GalleryCategoriesPageContent({ state }: Props) {
  const { catalog, list, form, isSubmittingCategory, onSubmitCategory } = state;

  return (
    <div className="mx-auto w-full max-w-6xl">
      <ModuleHero
        title="Gallery categories"
        subtitle="Curated albums for your public gallery."
        actionLabel="New category"
        onAction={form.openCategoryCreate}
        bordered={false}
      />

      <GalleryCategoriesGoToGalleryLink />

      <GalleryCategoriesStatsBar stats={list.stats} />

      <GalleryCategoriesToolbar
        searchQuery={list.searchQuery}
        onSearchChange={list.setSearchQuery}
        filterTab={list.filterTab}
        onFilterTabChange={list.setFilterTab}
      />

      <GalleryCategoriesLibrarySection state={state} />

      <GalleryCategoriesFormModal
        isOpen={form.isCategoryModalOpen}
        editingCategoryId={form.editingCategoryId}
        categoryName={form.categoryName}
        onCategoryNameChange={form.setCategoryName}
        categories={catalog.categories}
        isSubmitting={isSubmittingCategory}
        onClose={form.closeCategoryModal}
        onSubmit={onSubmitCategory}
      />
    </div>
  );
}
