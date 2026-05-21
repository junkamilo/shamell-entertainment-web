import type { AdminService } from "../types/services.types";
import ServicesMobileCard from "./ServicesMobileCard";
import ServicesPagination from "./ServicesPagination";
import ServicesTable from "./ServicesTable";

type Props = {
  isLoading: boolean;
  filteredServices: AdminService[];
  paginatedServices: AdminService[];
  pageOffset: number;
  safePage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  togglingId: string | null;
  canDelete: (service: AdminService) => boolean;
  cannotDeactivate: (service: AdminService) => boolean;
  getDeleteBlockedTitle: (service: AdminService) => string;
  onView: (service: AdminService) => void;
  onEdit: (service: AdminService) => void;
  onDelete: (service: AdminService) => void;
  onToggle: (service: AdminService) => void;
};

export default function ServicesListSection({
  isLoading,
  filteredServices,
  paginatedServices,
  pageOffset,
  safePage,
  totalPages,
  onPageChange,
  togglingId,
  canDelete,
  cannotDeactivate,
  getDeleteBlockedTitle,
  onView,
  onEdit,
  onDelete,
  onToggle,
}: Props) {
  const rowHandlers = {
    togglingId,
    canDelete,
    cannotDeactivate,
    getDeleteBlockedTitle,
    onView,
    onEdit,
    onDelete,
    onToggle,
  };

  return (
    <section className="shamell-glass-surface min-w-0 overflow-hidden rounded-xl p-4 md:p-5">
      {filteredServices.length === 0 ? (
        isLoading ? (
          <p className="py-12 text-center font-body text-sm text-foreground/65">Loading...</p>
        ) : (
          <p className="py-12 text-center font-body text-sm text-foreground/60">No services to show.</p>
        )
      ) : (
        <>
          <div className="grid min-w-0 gap-3 lg:hidden">
            {paginatedServices.map((service) => (
              <ServicesMobileCard
                key={service.id}
                service={service}
                togglingId={togglingId}
                deletable={canDelete(service)}
                blockDeactivate={cannotDeactivate(service)}
                deleteBlockedTitle={getDeleteBlockedTitle(service)}
                onView={() => onView(service)}
                onEdit={() => onEdit(service)}
                onDelete={() => onDelete(service)}
                onToggle={() => onToggle(service)}
              />
            ))}
          </div>

          <ServicesTable services={paginatedServices} {...rowHandlers} />
        </>
      )}

      {filteredServices.length > 0 ? (
        <ServicesPagination
          filteredCount={filteredServices.length}
          pageOffset={pageOffset}
          paginatedCount={paginatedServices.length}
          safePage={safePage}
          totalPages={totalPages}
          onPageChange={onPageChange}
        />
      ) : null}

      {isLoading && filteredServices.length > 0 ? (
        <p className="mt-3 text-sm text-foreground/65">Refreshing...</p>
      ) : null}
    </section>
  );
}
