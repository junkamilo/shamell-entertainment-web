import AdminCatalogEmptyState from "@/components/admin/AdminCatalogEmptyState";
import AdminPagination from "@/components/admin/AdminPagination";
import type { PaginationMeta } from "@/lib/pagination";
import type { OccasionTypeItem } from "../types/occasionTypes.types";
import OccasionTypesRow from "./OccasionTypesRow";

type Props = {
  isLoading: boolean;
  rowsCount: number;
  filteredCount: number;
  pagedRows: OccasionTypeItem[];
  paginationMeta: PaginationMeta;
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
  onCreateClick: () => void;
  togglingId: string | null;
  canDelete: (item: OccasionTypeItem) => boolean;
  cannotDeactivate: (item: OccasionTypeItem) => boolean;
  onEdit: (item: OccasionTypeItem) => void;
  onDelete: (item: OccasionTypeItem) => void;
  onToggleActive: (item: OccasionTypeItem) => void;
};

export default function OccasionTypesListSection({
  isLoading,
  rowsCount,
  filteredCount,
  pagedRows,
  paginationMeta,
  onPageChange,
  onPerPageChange,
  onCreateClick,
  togglingId,
  canDelete,
  cannotDeactivate,
  onEdit,
  onDelete,
  onToggleActive,
}: Props) {
  return (
    <section className="shamell-glass-surface rounded-xl p-5 md:p-7">
      {isLoading ? (
        <p className="py-16 text-center font-body text-sm text-foreground/65">Loading...</p>
      ) : filteredCount === 0 ? (
        rowsCount === 0 ? (
          <AdminCatalogEmptyState
            title="No occasion types yet"
            description="These are the options clients see for each event type."
            tone="primary"
            action={{
              label: "Create occasion type",
              onClick: onCreateClick,
            }}
          />
        ) : (
          <AdminCatalogEmptyState
            title="No matches for your search"
            description="Try different search words or switch the filter between All, Active, and Inactive."
            tone="muted"
          />
        )
      ) : (
        <>
          <div className="grid gap-3">
            {pagedRows.map((item) => (
              <OccasionTypesRow
                key={item.id}
                item={item}
                deletable={canDelete(item)}
                blockDeactivate={cannotDeactivate(item)}
                togglingId={togglingId}
                onEdit={onEdit}
                onDelete={onDelete}
                onToggleActive={onToggleActive}
              />
            ))}
          </div>

          <AdminPagination
            className="mt-6 border-t border-gold/10 pt-4"
            meta={paginationMeta}
            onPageChange={onPageChange}
            onPerPageChange={onPerPageChange}
          />
        </>
      )}
    </section>
  );
}
