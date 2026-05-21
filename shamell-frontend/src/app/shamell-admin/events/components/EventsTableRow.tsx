import { Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  eventTitleForTablePreview,
  firstLineOfEventDescription,
  pillClassForTypeName,
} from "../lib/eventsDisplay";
import { formatPriceEn } from "../lib/eventsPrice";
import type { AdminEvent } from "../types/events.types";
import { EventsActionButtons, EventsStatusToggle } from "./EventsRowActions";

type Props = {
  item: AdminEvent;
  deletable: boolean;
  blockDeactivate: boolean;
  isToggling: boolean;
  onView: (item: AdminEvent) => void;
  onEdit: (item: AdminEvent) => void;
  onDelete: (item: AdminEvent) => void;
  onToggleActive: (item: AdminEvent) => void;
};

export default function EventsTableRow({
  item,
  deletable,
  blockDeactivate,
  isToggling,
  onView,
  onEdit,
  onDelete,
  onToggleActive,
}: Props) {
  const titlePreview = eventTitleForTablePreview(item.description);
  const titleFull = firstLineOfEventDescription(item.description) || "No description";

  return (
    <tr
      className={cn("border-b border-gold/8 transition hover:bg-gold/5", !item.isActive && "opacity-55")}
    >
      <td className="px-2 py-3 align-middle">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-gold/22 bg-gold/10">
          <Calendar className="h-4 w-4 text-gold/85" strokeWidth={1.4} />
        </div>
      </td>
      <td className="max-w-44 min-w-0 px-3 py-3 align-middle sm:max-w-52 md:max-w-60">
        <p
          className="truncate font-brand text-sm tracking-[0.04em] text-gold"
          title={titleFull !== titlePreview ? titleFull : undefined}
        >
          {titlePreview}
        </p>
      </td>
      <td className="px-3 py-3 align-middle">
        <span
          className={cn(
            "inline-flex rounded-full border px-2.5 py-1 font-body text-[11px]",
            pillClassForTypeName(item.eventTypeName),
          )}
        >
          {item.eventTypeName}
        </span>
      </td>
      <td className="px-3 py-3 align-middle font-body text-sm text-foreground/75">{item.items.length}</td>
      <td className="px-3 py-3 align-middle font-body text-sm text-foreground/75 whitespace-nowrap">
        {formatPriceEn(item.price)}
      </td>
      <td className="px-3 py-3 align-middle">
        <EventsStatusToggle
          item={item}
          blockDeactivate={blockDeactivate}
          isToggling={isToggling}
          onToggleActive={onToggleActive}
        />
      </td>
      <td className="px-3 py-3 align-middle">
        <EventsActionButtons
          item={item}
          deletable={deletable}
          onView={onView}
          onEdit={onEdit}
          onDelete={onDelete}
          layout="table"
        />
      </td>
    </tr>
  );
}
