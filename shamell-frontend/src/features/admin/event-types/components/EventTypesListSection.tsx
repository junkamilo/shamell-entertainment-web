import { EmptyState, Pagination } from "@/components/admin/data-display";
import type { PaginationMeta } from "@/lib/pagination";
import type { EventTypeItem } from "../types/eventTypes.types";
import EventTypesMobileCard from "./EventTypesMobileCard";
import EventTypesTable from "./EventTypesTable";

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
  cannotDeactivate: (item: EventTypeItem) => boolean;
  onEdit: (item: EventTypeItem) => void;
  onDelete: (item: EventTypeItem) => void;
  onToggleActive: (item: EventTypeItem) => void;
  onBlockedDeactivate: (item: EventTypeItem) => void;
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
        typesCount === 0 ? (
          <EmptyState
            title="No event types yet"
            description="Categories organize your experiences and link the occasions the client sees in contact."
            tone="primary"
            action={{ label: "Create event type", onClick: onCreateClick }}
          />
        ) : (
          <EmptyState
            title="No matches for your search"
            description="Try different words or switch the filter between All, Active, and Inactive."
            tone="muted"
          />
        )
      ) : (
        <>
          <div className="grid min-w-0 gap-3 lg:hidden">
            {pagedTypes.map((item) => (
              <EventTypesMobileCard
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
            <EventTypesTable types={pagedTypes} {...rowHandlers} />
          </div>

          <Pagination
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
