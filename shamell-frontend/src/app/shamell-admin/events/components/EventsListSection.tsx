import { Calendar } from "lucide-react";
import AdminCatalogEmptyState from "@/components/admin/AdminCatalogEmptyState";
import type { AdminEvent } from "../types/events.types";
import EventsMobileCard from "./EventsMobileCard";
import EventsPagination from "./EventsPagination";
import EventsTable from "./EventsTable";

type Props = {
  isLoading: boolean;
  eventsCount: number;
  searchedCount: number;
  paginatedEvents: AdminEvent[];
  pageOffset: number;
  safePage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onCreateClick: () => void;
  togglingId: string | null;
  canDelete: (item: AdminEvent) => boolean;
  cannotDeactivate: (item: AdminEvent) => boolean;
  onView: (item: AdminEvent) => void;
  onEdit: (item: AdminEvent) => void;
  onDelete: (item: AdminEvent) => void;
  onToggleActive: (item: AdminEvent) => void;
};

export default function EventsListSection({
  isLoading,
  eventsCount,
  searchedCount,
  paginatedEvents,
  pageOffset,
  safePage,
  totalPages,
  onPageChange,
  onCreateClick,
  togglingId,
  canDelete,
  cannotDeactivate,
  onView,
  onEdit,
  onDelete,
  onToggleActive,
}: Props) {
  const rowProps = {
    canDelete,
    cannotDeactivate,
    togglingId,
    onView,
    onEdit,
    onDelete,
    onToggleActive: (item: AdminEvent) => void onToggleActive(item),
  };

  return (
    <section className="shamell-glass-surface rounded-xl p-4 md:p-5">
      <div className="md:hidden space-y-3 rounded-xl border border-gold/14 p-3">
        {isLoading ? (
          <p className="py-10 text-center font-body text-sm text-foreground/65">Loading...</p>
        ) : searchedCount === 0 ? (
          eventsCount === 0 ? (
            <AdminCatalogEmptyState
              title="No events yet"
              description="Add a performance with type, description, and line items for the team."
              tone="primary"
              variant="embedded"
              icon={Calendar}
              action={{ label: "New event", onClick: onCreateClick }}
            />
          ) : (
            <AdminCatalogEmptyState
              title="No matches for your search"
              description="Try different search words."
              tone="muted"
              variant="embedded"
              icon={Calendar}
            />
          )
        ) : (
          paginatedEvents.map((item) => (
            <EventsMobileCard
              key={item.id}
              item={item}
              deletable={canDelete(item)}
              blockDeactivate={cannotDeactivate(item)}
              isToggling={togglingId === item.id}
              onView={onView}
              onEdit={onEdit}
              onDelete={onDelete}
              onToggleActive={rowProps.onToggleActive}
            />
          ))
        )}
      </div>

      <EventsTable
        paginatedEvents={paginatedEvents}
        eventsCount={eventsCount}
        searchedCount={searchedCount}
        isLoading={isLoading}
        canDelete={canDelete}
        cannotDeactivate={cannotDeactivate}
        togglingId={togglingId}
        onCreateClick={onCreateClick}
        onView={onView}
        onEdit={onEdit}
        onDelete={onDelete}
        onToggleActive={rowProps.onToggleActive}
      />

      {isLoading ? <p className="mt-4 hidden text-sm text-foreground/65 md:block">Loading...</p> : null}

      <EventsPagination
        searchedCount={searchedCount}
        pageOffset={pageOffset}
        paginatedCount={paginatedEvents.length}
        safePage={safePage}
        totalPages={totalPages}
        onPageChange={onPageChange}
      />
    </section>
  );
}
