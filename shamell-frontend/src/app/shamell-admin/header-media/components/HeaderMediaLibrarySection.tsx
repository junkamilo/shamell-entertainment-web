import { ImagePlus, Loader2 } from "lucide-react";
import AdminPagination from "@/components/admin/AdminPagination";
import type { PaginationMeta } from "@/lib/pagination";
import type { HeaderPhoto } from "../types/headerMedia.types";
import HeaderMediaLibraryCard from "./HeaderMediaLibraryCard";

type Props = {
  isLoading: boolean;
  photos: HeaderPhoto[];
  pagedPhotos: HeaderPhoto[];
  paginationMeta: PaginationMeta;
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
  onView: (photo: HeaderPhoto, globalIndex: number) => void;
  onFocus: (photo: HeaderPhoto) => void;
  onToggle: (photo: HeaderPhoto) => void;
  onDelete: (photo: HeaderPhoto) => void;
};

export default function HeaderMediaLibrarySection({
  isLoading,
  photos,
  pagedPhotos,
  paginationMeta,
  onPageChange,
  onPerPageChange,
  onView,
  onFocus,
  onToggle,
  onDelete,
}: Props) {
  return (
    <>
      <div className="mt-10 mb-4 flex flex-wrap items-center gap-2">
        <h2 className="font-brand text-lg tracking-[0.08em] text-gold">Library</h2>
        <span className="rounded-full border border-gold/35 bg-gold/10 px-2.5 py-0.5 font-brand text-[10px] tracking-widest text-gold">
          {isLoading ? "…" : `${paginationMeta.totalItems} item${paginationMeta.totalItems === 1 ? "" : "s"}`}
        </span>
      </div>

      {photos.length === 0 && !isLoading ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gold/20 px-6 py-12 text-center">
          <ImagePlus className="h-9 w-9 text-gold/35" />
          <p className="mt-3 text-sm text-foreground/55">No media in the main header yet.</p>
        </div>
      ) : isLoading && photos.length === 0 ? (
        <div className="flex justify-center py-14 text-gold">
          <Loader2 className="h-9 w-9 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {pagedPhotos.map((photo, idx) => {
            const globalIndex = (paginationMeta.page - 1) * paginationMeta.perPage + idx + 1;
            return (
              <HeaderMediaLibraryCard
                key={photo.id}
                photo={photo}
                globalIndex={globalIndex}
                onView={onView}
                onFocus={onFocus}
                onToggle={onToggle}
                onDelete={onDelete}
              />
            );
          })}
        </div>
      )}

      {photos.length > 0 ? (
        <AdminPagination
          className="mt-6 border-t border-gold/10 pt-4"
          meta={paginationMeta}
          onPageChange={onPageChange}
          onPerPageChange={onPerPageChange}
        />
      ) : null}
    </>
  );
}
