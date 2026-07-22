import { Pagination } from "@/components/admin/data-display";
import type { PaginationMeta } from "@/lib/pagination";
import type { ServiceTypeItem } from "../types/serviceTypes.types";
import ServiceTypesMobileCard from "./ServiceTypesMobileCard";
import ServiceTypesTable from "./ServiceTypesTable";

type Props = {
  isLoading: boolean;
  typesCount: number;
  filteredCount: number;
  pagedTypes: ServiceTypeItem[];
  paginationMeta: PaginationMeta;
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
  togglingId: string | null;
  cannotDeactivate: (item: ServiceTypeItem) => boolean;
  onEdit: (item: ServiceTypeItem) => void;
  onDelete: (item: ServiceTypeItem) => void;
  onToggleActive: (item: ServiceTypeItem) => void;
  onBlockedDeactivate: (item: ServiceTypeItem) => void;
};

export default function ServiceTypesListSection({
  isLoading,
  typesCount,
  filteredCount,
  pagedTypes,
  paginationMeta,
  onPageChange,
  onPerPageChange,
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
      {filteredCount === 0 ? (
        isLoading ? (
          <p className="py-12 text-center font-body text-sm text-foreground/65">Loading...</p>
        ) : (
          <p className="py-12 text-center font-body text-sm text-foreground/60">
            {typesCount === 0 ? "No service types yet." : "Nothing matches your search or filter."}
          </p>
        )
      ) : (
        <>
          <div className="grid min-w-0 gap-3 lg:hidden">
            {pagedTypes.map((item) => (
              <ServiceTypesMobileCard
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
            <ServiceTypesTable types={pagedTypes} {...rowHandlers} />
          </div>
        </>
      )}

      {!isLoading && filteredCount > 0 ? (
        <Pagination
          className="mt-6 border-t border-gold/10 pt-4"
          meta={paginationMeta}
          onPageChange={onPageChange}
          onPerPageChange={onPerPageChange}
        />
      ) : null}

      {isLoading && filteredCount > 0 ? (
        <p className="mt-3 text-sm text-foreground/65">Refreshing...</p>
      ) : null}
    </section>
  );
}
