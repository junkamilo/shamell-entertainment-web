import AdminCatalogEmptyState from "@/components/admin/AdminCatalogEmptyState";
import AdminPagination from "@/components/admin/AdminPagination";
import type { PaginationMeta } from "@/lib/pagination";
import type { EventTypeItem } from "../types/eventTypes.types";
import EventTypesCard from "./EventTypesCard";

type Props = {
  isLoading: boolean;
  typesCount: number;
  filteredCount: number;
  pagedTypes: EventTypeItem[];
  paginationMeta: PaginationMeta;
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
  onCreateClick: () => void;
  togglingId: string | null;
  canDelete: (item: EventTypeItem) => boolean;
  cannotDeactivate: (item: EventTypeItem) => boolean;
  onEdit: (item: EventTypeItem) => void;
  onDelete: (item: EventTypeItem) => void;
  onToggleActive: (item: EventTypeItem) => void;
};

export default function EventTypesListSection({
  isLoading,
  typesCount,
  filteredCount,
  pagedTypes,
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
        typesCount === 0 ? (
          <AdminCatalogEmptyState
            title="No event types yet"
            description="Categories organize your experiences and link the occasions the client sees in contact."
            tone="primary"
            action={{ label: "Create event type", onClick: onCreateClick }}
          />
        ) : (
          <AdminCatalogEmptyState
            title="No matches for your search"
            description="Try different words or switch the filter between All, Active, and Inactive."
            tone="muted"
          />
        )
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {pagedTypes.map((item) => (
              <EventTypesCard
                key={item.id}
                item={item}
                deletable={canDelete(item)}
                blockDeactivate={cannotDeactivate(item)}
                isToggling={togglingId === item.id}
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
