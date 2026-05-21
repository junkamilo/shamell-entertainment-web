import type { AdminService } from "../types/services.types";
import ServicesTableRow from "./ServicesTableRow";

type RowHandlers = {
  togglingId: string | null;
  canDelete: (service: AdminService) => boolean;
  cannotDeactivate: (service: AdminService) => boolean;
  getDeleteBlockedTitle: (service: AdminService) => string;
  onView: (service: AdminService) => void;
  onEdit: (service: AdminService) => void;
  onDelete: (service: AdminService) => void;
  onToggle: (service: AdminService) => void;
};

type Props = {
  services: AdminService[];
} & RowHandlers;

export default function ServicesTable({ services, ...handlers }: Props) {
  return (
    <div className="hidden overflow-x-auto rounded-xl border border-gold/14 lg:block">
      <table className="w-full min-w-[920px] border-collapse text-left">
        <thead>
          <tr className="border-b border-gold/12">
            <th className="w-14 px-2 py-3 font-brand text-[10px] tracking-[0.14em] text-gold/70" />
            <th className="px-3 py-3 font-brand text-[10px] tracking-[0.14em] text-gold/80">SERVICE</th>
            <th className="px-3 py-3 font-brand text-[10px] tracking-[0.14em] text-gold/80">TYPE</th>
            <th className="w-20 px-3 py-3 font-brand text-[10px] tracking-[0.14em] text-gold/80">ITEMS</th>
            <th className="w-24 px-3 py-3 font-brand text-[10px] tracking-[0.14em] text-gold/80">PRECIO</th>
            <th className="min-w-[9rem] px-3 py-3 font-brand text-[10px] tracking-[0.14em] text-gold/80">
              ESTADO
            </th>
            <th className="w-36 px-3 py-3 text-right font-brand text-[10px] tracking-[0.14em] text-gold/80">
              ACCIONES
            </th>
          </tr>
        </thead>
        <tbody>
          {services.map((service) => (
            <ServicesTableRow
              key={service.id}
              service={service}
              togglingId={handlers.togglingId}
              deletable={handlers.canDelete(service)}
              blockDeactivate={handlers.cannotDeactivate(service)}
              deleteBlockedTitle={handlers.getDeleteBlockedTitle(service)}
              onView={() => handlers.onView(service)}
              onEdit={() => handlers.onEdit(service)}
              onDelete={() => handlers.onDelete(service)}
              onToggle={() => handlers.onToggle(service)}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
