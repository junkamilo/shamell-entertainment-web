"use client";

import { cn } from "@/lib/utils";

type Props = {
  fixedTicketCapacity: number;
  ticketsRemaining: number;
  ticketsSold?: number;
  soldOut?: boolean;
  size?: "sm" | "md";
  className?: string;
  inventoryType?: "ticket" | "table";
};

function StatBlock({
  value,
  label,
  compact,
  muted,
}: {
  value: number;
  label: string;
  compact?: boolean;
  muted?: boolean;
}) {
  return (
    <div className="min-w-0 text-center">
      <span
        className={cn(
          "block font-brand font-semibold tabular-nums tracking-[0.06em]",
          compact ? "text-xl" : "text-2xl md:text-3xl",
          muted ? "text-foreground/45" : "text-gold",
        )}
      >
        {value}
      </span>
      <span
        className={cn(
          "mt-1 block font-brand uppercase tracking-[0.14em]",
          compact ? "text-[9px]" : "text-[10px] md:text-xs",
          muted ? "text-foreground/40" : "text-foreground/55",
        )}
      >
        {label}
      </span>
    </div>
  );
}

export function FixedTicketInventoryDisplay({
  fixedTicketCapacity,
  ticketsRemaining,
  ticketsSold,
  soldOut = false,
  size = "md",
  className,
  inventoryType = "ticket",
}: Props) {
  const sold = ticketsSold ?? Math.max(0, fixedTicketCapacity - ticketsRemaining);
  const compact = size === "sm";
  const isTable = inventoryType === "table";
  const itemNoun = isTable ? "table" : "ticket";

  return (
    <div
      className={cn(
        "rounded-xl border bg-black/40",
        soldOut ? "border-foreground/15" : "border-gold/25",
        compact ? "px-3 py-3" : "px-4 py-4 md:px-6 md:py-5",
        className,
      )}
      role="status"
      aria-label={`${fixedTicketCapacity} ${itemNoun}s for sale, ${sold} sold, ${ticketsRemaining} available`}
    >
      {!compact ? (
        <p className="mb-4 text-center font-brand text-[10px] uppercase tracking-[0.2em] text-foreground/55 md:text-xs">
          {isTable ? "Table availability" : "Ticket availability"}
        </p>
      ) : null}

      <div className="grid grid-cols-3 gap-2 md:gap-4">
        <StatBlock
          value={fixedTicketCapacity}
          label="For sale"
          compact={compact}
          muted={soldOut}
        />
        <StatBlock value={sold} label="Sold" compact={compact} muted={soldOut} />
        <StatBlock
          value={ticketsRemaining}
          label="Available"
          compact={compact}
          muted={soldOut}
        />
      </div>
    </div>
  );
}
