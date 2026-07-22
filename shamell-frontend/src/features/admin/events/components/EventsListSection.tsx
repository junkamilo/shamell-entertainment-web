import { EmptyState } from "@/components/admin/data-display";
import { Calendar } from "lucide-react";
import type { AdminEvent } from "../types/events.types";
import EventsMobileCard from "./EventsMobileCard";
import EventsPagination from "./EventsPagination";
import EventsTable from "./EventsTable";

type Props = {
  isLoading: boolean;
  sectionEventsCount: number;
  searchedCount: number;
  paginatedEvents: AdminEvent[];
  pageOffset: number;
  safePage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onCreateClick: () => void;
  togglingId: string | null;
  cannotDeactivate: (item: AdminEvent) => boolean;
  onView: (item: AdminEvent) => void;
  onEdit: (item: AdminEvent) => void;
  onDelete: (item: AdminEvent) => void;
  onToggleActive: (item: AdminEvent) => void;
  onBlockedDeactivate: (item: AdminEvent) => void;
};

export default function EventsListSection({
  isLoading,
  sectionEventsCount,
  searchedCount,
  paginatedEvents,
  pageOffset,
  safePage,
  totalPages,
  onPageChange,
  onCreateClick,
  togglingId,
  cannotDeactivate,
  onView,
  onEdit,
  onDelete,
  onToggleActive,
  onBlockedDeactivate,
}: Props) {
  const rowHandlers = {
    togglingId,
    cannotDeactivate,
    onView,
    onEdit,
    onDelete,
    onToggleActive,
    onBlockedDeactivate,
  };

  return (
    <section className="shamell-glass-surface min-w-0 overflow-hidden rounded-xl p-4 md:p-5">
      {isLoading ? (
        <p className="py-12 text-center font-body text-sm text-foreground/65">Loading...</p>
      ) : searchedCount === 0 ? (
        sectionEventsCount === 0 ? (
          <EmptyState
            title="No events yet"
            description="Add a performance with type, description, and line items for the team."
            tone="primary"
            icon={Calendar}
            action={{ label: "New event", onClick: onCreateClick }}
          />
        ) : (
          <EmptyState
            title="No matches for your search"
            description="Try different search words."
            tone="muted"
            icon={Calendar}
          />
        )
      ) : (
        <>
          <div className="grid min-w-0 gap-3 lg:hidden">
            {paginatedEvents.map((item) => (
              <EventsMobileCard
                key={item.id}
                item={item}
                togglingId={togglingId}
                deactivateBlocked={cannotDeactivate(item)}
                onView={() => onView(item)}
                onEdit={() => onEdit(item)}
                onDelete={() => onDelete(item)}
                onToggleActive={() => onToggleActive(item)}
                onBlockedDeactivate={() => onBlockedDeactivate(item)}
              />
            ))}
          </div>

          <EventsTable events={paginatedEvents} {...rowHandlers} />
        </>
      )}

      {searchedCount > 0 ? (
        <EventsPagination
          searchedCount={searchedCount}
          pageOffset={pageOffset}
          paginatedCount={paginatedEvents.length}
          safePage={safePage}
          totalPages={totalPages}
          onPageChange={onPageChange}
        />
      ) : null}

      {isLoading && searchedCount > 0 ? (
        <p className="mt-3 text-sm text-foreground/65">Refreshing...</p>
      ) : null}
    </section>
  );
}
