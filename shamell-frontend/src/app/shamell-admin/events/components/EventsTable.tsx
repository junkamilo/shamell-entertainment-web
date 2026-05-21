import { Calendar } from "lucide-react";
import AdminCatalogEmptyState from "@/components/admin/AdminCatalogEmptyState";
import type { AdminEvent } from "../types/events.types";
import EventsTableRow from "./EventsTableRow";

type Props = {
  paginatedEvents: AdminEvent[];
  eventsCount: number;
  searchedCount: number;
  isLoading: boolean;
  canDelete: (item: AdminEvent) => boolean;
  cannotDeactivate: (item: AdminEvent) => boolean;
  togglingId: string | null;
  onCreateClick: () => void;
  onView: (item: AdminEvent) => void;
  onEdit: (item: AdminEvent) => void;
  onDelete: (item: AdminEvent) => void;
  onToggleActive: (item: AdminEvent) => void;
};

export default function EventsTable({
  paginatedEvents,
  eventsCount,
  searchedCount,
  isLoading,
  canDelete,
  cannotDeactivate,
  togglingId,
  onCreateClick,
  onView,
  onEdit,
  onDelete,
  onToggleActive,
}: Props) {
  return (
    <div className="hidden overflow-x-auto rounded-xl border border-gold/14 md:block">
      <table className="w-full min-w-[960px] border-collapse text-left">
        <thead>
          <tr className="border-b border-gold/12">
            <th className="w-14 px-2 py-3 font-brand text-[10px] tracking-[0.14em] text-gold/70" />
            <th className="px-3 py-3 font-brand text-[10px] tracking-[0.14em] text-gold/80">EVENT</th>
            <th className="px-3 py-3 font-brand text-[10px] tracking-[0.14em] text-gold/80">TYPE</th>
            <th className="w-16 px-3 py-3 font-brand text-[10px] tracking-[0.14em] text-gold/80">ITEMS</th>
            <th className="min-w-24 px-3 py-3 font-brand text-[10px] tracking-[0.14em] text-gold/80">PRICE</th>
            <th className="min-w-36 px-3 py-3 font-brand text-[10px] tracking-[0.14em] text-gold/80">STATUS</th>
            <th className="w-32 px-3 py-3 text-right font-brand text-[10px] tracking-[0.14em] text-gold/80">
              ACTIONS
            </th>
          </tr>
        </thead>
        <tbody>
          {paginatedEvents.map((item) => (
            <EventsTableRow
              key={item.id}
              item={item}
              deletable={canDelete(item)}
              blockDeactivate={cannotDeactivate(item)}
              isToggling={togglingId === item.id}
              onView={onView}
              onEdit={onEdit}
              onDelete={onDelete}
              onToggleActive={onToggleActive}
            />
          ))}
          {!isLoading && searchedCount === 0 ? (
            <tr>
              <td colSpan={7} className="border-b border-gold/8 p-0 align-middle">
                {eventsCount === 0 ? (
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
                )}
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}
