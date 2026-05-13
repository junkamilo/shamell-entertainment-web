"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type AdminServicesMultiOption = { id: string; label: string };

type Props = {
  options: AdminServicesMultiOption[];
  /** Selected service row ids (order preserved; first id is primary `serviceId`). */
  value: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
  className?: string;
  /** Trigger label when nothing is selected (should not happen if one option stays enforced upstream). */
  emptyDisplay?: string;
  ariaLabel?: string;
};

export default function AdminServicesMultiSelect({
  options,
  value,
  onChange,
  disabled = false,
  className,
  emptyDisplay = "Select services",
  ariaLabel = "Services",
}: Props) {
  const listId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  const labelById = useMemo(
    () => Object.fromEntries(options.map((o) => [o.id, o.label])),
    [options],
  );

  const summaryText = useMemo(() => {
    const parts = value.map((id) => labelById[id]).filter(Boolean);
    return parts.length ? parts.join(" · ") : emptyDisplay;
  }, [value, labelById, emptyDisplay]);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const el = containerRef.current;
      if (el && !el.contains(e.target as Node)) close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, close]);

  const toggle = (id: string) => {
    if (disabled) return;
    if (value.includes(id)) {
      if (value.length <= 1) return;
      onChange(value.filter((x) => x !== id));
    } else {
      onChange([...value, id]);
    }
  };

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <button
        type="button"
        disabled={disabled}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={listId}
        aria-label={ariaLabel}
        onClick={() => !disabled && setOpen((v) => !v)}
        className={cn(
          "shamell-glass-trigger flex w-full min-h-[52px] items-center justify-between gap-3 rounded-xl px-4 py-3 text-left",
          "font-body text-base tracking-wide text-foreground",
          disabled && "cursor-not-allowed opacity-45",
          open && "ring-2 ring-gold/25",
        )}
      >
        <span className="min-w-0 flex-1 line-clamp-2">{summaryText}</span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-gold/85 transition-transform duration-200",
            open && "rotate-180",
          )}
          strokeWidth={1.75}
          aria-hidden
        />
      </button>

      {open ? (
        <div
          id={listId}
          role="listbox"
          aria-label={ariaLabel}
          aria-multiselectable="true"
          className={cn(
            "shamell-glass-menu absolute left-0 right-0 top-[calc(100%+6px)] z-[120] max-h-[min(18rem,calc(55vh-6rem))] overflow-y-auto rounded-xl",
            "shamell-scrollbar",
          )}
        >
          {options.map((opt) => {
            const selected = value.includes(opt.id);
            return (
              <button
                key={opt.id}
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => toggle(opt.id)}
                className={cn(
                  "flex w-full items-center gap-3 border-b border-gold/8 px-4 py-3 text-left transition-colors last:border-b-0",
                  "hover:bg-gold/7",
                  selected && "bg-gold/12",
                )}
              >
                <span
                  className={cn(
                    "flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-md border transition-colors",
                    selected
                      ? "border-gold/70 bg-gold/15 shadow-[inset_0_0_0_1px_rgba(197,165,90,0.25)]"
                      : "border-gold/30 bg-gold/8",
                  )}
                  aria-hidden
                >
                  {selected ? <Check className="h-3.5 w-3.5 text-gold" strokeWidth={2.25} /> : null}
                </span>
                <span className="min-w-0 flex-1 font-body text-base leading-snug tracking-wide text-foreground">
                  {opt.label}
                </span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
