import AdminCatalogEmptyState from "@/components/admin/AdminCatalogEmptyState";
import AdminPagination from "@/components/admin/AdminPagination";
import type { PaginationMeta } from "@/lib/pagination";
import type { OccasionTypeItem } from "../types/occasionTypes.types";
import OccasionTypesMobileCard from "./OccasionTypesMobileCard";
import OccasionTypesTable from "./OccasionTypesTable";

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
  cannotDeactivate: (item: OccasionTypeItem) => boolean;
  onEdit: (item: OccasionTypeItem) => void;
  onDelete: (item: OccasionTypeItem) => void;
  onToggleActive: (item: OccasionTypeItem) => void;
  onBlockedDeactivate: (item: OccasionTypeItem) => void;
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
  cannotDeactivate,
  onEdit,
  onDelete,
  onToggleActive,
  onBlockedDeactivate,
}: Props) {
  const rowHandlers = {
    togglingId,
    cannotDeactivate,
    onEdit,
    onDelete,
    onToggleActive,
    onBlockedDeactivate,
  };

  return (
    <section className="shamell-glass-surface min-w-0 overflow-hidden rounded-xl p-4 md:p-5">
      {isLoading ? (
        <p className="py-12 text-center font-body text-sm text-foreground/65">Loading...</p>
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
          <div className="grid min-w-0 gap-3 lg:hidden">
            {pagedRows.map((item) => (
              <OccasionTypesMobileCard
                key={item.id}
                item={item}
                deactivateBlocked={cannotDeactivate(item)}
                isToggling={togglingId === item.id}
                onEdit={onEdit}
                onDelete={onDelete}
                onToggleActive={onToggleActive}
                onBlockedDeactivate={onBlockedDeactivate}
              />
            ))}
          </div>

          <div className="hidden min-w-0 w-full lg:block">
            <OccasionTypesTable rows={pagedRows} {...rowHandlers} />
          </div>

          <AdminPagination
            className="mt-6 border-t border-gold/10 pt-4"
            meta={paginationMeta}
            onPageChange={onPageChange}
            onPerPageChange={onPerPageChange}
          />
        </>
      )}

      {isLoading && filteredCount > 0 ? (
        <p className="mt-3 text-sm text-foreground/65">Refreshing...</p>
      ) : null}
    </section>
  );
}
