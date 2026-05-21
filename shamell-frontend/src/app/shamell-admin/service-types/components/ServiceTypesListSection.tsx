import AdminPagination from "@/components/admin/AdminPagination";
import type { PaginationMeta } from "@/lib/pagination";
import type { ServiceTypeItem } from "../types/serviceTypes.types";
import ServiceTypesCard from "./ServiceTypesCard";

type Props = {
  isLoading: boolean;
  typesCount: number;
  filteredCount: number;
  pagedTypes: ServiceTypeItem[];
  paginationMeta: PaginationMeta;
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
  togglingId: string | null;
  canDelete: (item: ServiceTypeItem) => boolean;
  cannotDeactivate: (item: ServiceTypeItem) => boolean;
  getDeleteBlockedTitle: (item: ServiceTypeItem) => string;
  onEdit: (item: ServiceTypeItem) => void;
  onDelete: (item: ServiceTypeItem) => void;
  onToggleActive: (item: ServiceTypeItem) => void;
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
  canDelete,
  cannotDeactivate,
  getDeleteBlockedTitle,
  onEdit,
  onDelete,
  onToggleActive,
}: Props) {
  return (
    <section className="shamell-glass-surface rounded-xl p-5 md:p-7">
      {isLoading ? <p className="text-sm text-foreground/65">Loading...</p> : null}
      {!isLoading && filteredCount === 0 ? (
        <p className="text-sm text-foreground/65">
          {typesCount === 0 ? "No service types yet." : "Nothing matches your search or filter."}
        </p>
      ) : null}

      <div className="mt-2 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {pagedTypes.map((item) => (
          <ServiceTypesCard
            key={item.id}
            item={item}
            deletable={canDelete(item)}
            blockDeactivate={cannotDeactivate(item)}
            isToggling={togglingId === item.id}
            deleteBlockedTitle={getDeleteBlockedTitle(item)}
            onEdit={onEdit}
            onDelete={onDelete}
            onToggleActive={onToggleActive}
          />
        ))}
      </div>

      {!isLoading && filteredCount > 0 ? (
        <AdminPagination
          className="mt-6 border-t border-gold/10 pt-4"
          meta={paginationMeta}
          onPageChange={onPageChange}
          onPerPageChange={onPerPageChange}
        />
      ) : null}
    </section>
  );
}
