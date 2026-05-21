import type { GalleryCategory, GalleryPhoto } from "../types/gallery.types";
import GalleryAlbumSection from "./GalleryAlbumSection";

type Props = {
  isLoading: boolean;
  photosCount: number;
  filteredPhotosCount: number;
  categoriesForLibrary: GalleryCategory[];
  filteredPhotos: GalleryPhoto[];
  expandedAlbumIds: Set<string>;
  onToggleAlbumExpanded: (categoryId: string) => void;
  onUploadToCategory: (categoryId: string) => void;
  onEditPhoto: (photo: GalleryPhoto) => void;
  onDeletePhoto: (photoId: string) => void;
  onTogglePhoto: (photo: GalleryPhoto) => void;
};

export default function GalleryLibrarySection({
  isLoading,
  photosCount,
  filteredPhotosCount,
  categoriesForLibrary,
  filteredPhotos,
  expandedAlbumIds,
  onToggleAlbumExpanded,
  onUploadToCategory,
  onEditPhoto,
  onDeletePhoto,
  onTogglePhoto,
}: Props) {
  return (
    <section className="shamell-glass-surface rounded-xl p-5 md:p-6">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <h2 className="font-brand text-lg tracking-[0.08em] text-gold">Media library</h2>
        {isLoading ? <p className="text-xs text-foreground/60">Loading...</p> : null}
      </div>

      <div className="space-y-6">
        {categoriesForLibrary.map((cat) => {
          const catPhotos = filteredPhotos.filter((p) => p.category.id === cat.id);
          return (
            <GalleryAlbumSection
              key={cat.id}
              category={cat}
              photos={catPhotos}
              isExpanded={expandedAlbumIds.has(cat.id)}
              onToggleExpand={() => onToggleAlbumExpanded(cat.id)}
              onUploadHere={() => onUploadToCategory(cat.id)}
              onEditPhoto={onEditPhoto}
              onDeletePhoto={onDeletePhoto}
              onTogglePhoto={onTogglePhoto}
            />
          );
        })}
      </div>

      {!isLoading && filteredPhotosCount === 0 ? (
        <p className="mt-8 text-center text-sm text-foreground/60">
          {photosCount === 0
            ? 'No media yet. Use "Upload to category" or "Upload here" on an album.'
            : "Nothing matches the filter or search."}
        </p>
      ) : null}
    </section>
  );
}
