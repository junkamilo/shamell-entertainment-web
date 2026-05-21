import GalleryCategoriesCard from "./GalleryCategoriesCard";
import type { useGalleryCategoriesPage } from "../hooks/useGalleryCategoriesPage";

type PageState = ReturnType<typeof useGalleryCategoriesPage>;

type Props = {
  state: PageState;
};

export default function GalleryCategoriesLibrarySection({ state }: Props) {
  const { catalog, list, form, togglingId, onToggleCategoryActive } = state;

  return (
    <section className="shamell-glass-surface rounded-xl p-5 md:p-7">
      {catalog.isLoading ? <p className="text-sm text-foreground/65">Loading...</p> : null}
      {!catalog.isLoading && list.filteredCategories.length === 0 ? (
        <p className="text-sm text-foreground/65">
          {catalog.categories.length === 0
            ? "No categories yet."
            : "Nothing matches your search or filter."}
        </p>
      ) : null}

      <div className="mt-2 grid gap-5 sm:grid-cols-2 xl:grid-cols-2">
        {list.filteredCategories.map((category) => {
          const count = list.photoCountByCategory[category.id] ?? 0;
          const previews = list.previewUrlsByCategory[category.id] ?? [];
          const isSpotlight = Boolean(
            list.spotlightCategoryId && category.id === list.spotlightCategoryId,
          );

          return (
            <GalleryCategoriesCard
              key={category.id}
              category={category}
              count={count}
              previews={previews}
              isSpotlight={isSpotlight}
              isExpanded={list.expandedCategoryIds.has(category.id)}
              isToggling={togglingId === category.id}
              onToggleExpand={() => list.toggleCategoryExpanded(category.id)}
              onEdit={() => form.startCategoryEdit(category)}
              onToggleActive={() => void onToggleCategoryActive(category)}
            />
          );
        })}
      </div>
    </section>
  );
}
