import { Tags } from "lucide-react";
import { EVENT_TYPES_PATH } from "@/app/shamell-admin/event-types/lib/eventTypesRoutes";
import AdminCatalogEmptyState from "@/components/admin/AdminCatalogEmptyState";

export default function EventsNoTypesBanner() {
  return (
    <section className="mb-8 shamell-glass-surface rounded-xl p-5 md:p-7">
      <AdminCatalogEmptyState
        title="No active event types"
        description="Create or activate categories under Event types before you add performances here."
        tone="primary"
        icon={Tags}
        action={{ label: "Go to event types", href: EVENT_TYPES_PATH }}
      />
    </section>
  );
}
