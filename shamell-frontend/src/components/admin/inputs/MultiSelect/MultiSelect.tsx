"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type MultiSelectOption = { id: string; label: string };

export type MultiSelectProps = {
  options: MultiSelectOption[];
  /** Selected option ids (order preserved). */
  value: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
  className?: string;
  emptyDisplay?: string;
  ariaLabel?: string;
  isLoading?: boolean;
  error?: string;
};

export function MultiSelect({
  options,
  value,
  onChange,
  disabled = false,
  className,
  emptyDisplay = "Select options",
  ariaLabel = "Options",
  isLoading = false,
  error,
}: MultiSelectProps) {
  const listId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const isDisabled = disabled || isLoading;

  const labelById = useMemo(
    () => Object.fromEntries(options.map((o) => [o.id, o.label])),
    [options],
  );

  const summaryText = useMemo(() => {
    if (isLoading) return "Loading…";
    const parts = value.map((id) => labelById[id]).filter(Boolean);
    return parts.length ? parts.join(" · ") : emptyDisplay;
  }, [value, labelById, emptyDisplay, isLoading]);

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
    if (isDisabled) return;
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
        disabled={isDisabled}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={listId}
        aria-label={ariaLabel}
        aria-invalid={error ? true : undefined}
        onClick={() => !isDisabled && setOpen((v) => !v)}
        className={cn(
          "shamell-glass-trigger flex w-full min-h-[52px] items-center justify-between gap-3 rounded-xl px-4 py-3 text-left",
          "font-body text-base tracking-wide text-foreground",
          isDisabled && "cursor-not-allowed opacity-45",
          open && "ring-2 ring-gold/25",
          error && "ring-2 ring-red-400/35",
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

      {error ? (
        <p className="mt-1.5 font-body text-sm text-red-300/90" role="alert">
          {error}
        </p>
      ) : null}

      {open ? (
        <div
          id={listId}
          role="listbox"
          aria-label={ariaLabel}
          aria-multiselectable="true"
          className={cn(
            "shamell-glass-menu absolute left-0 right-0 top-[calc(100%+6px)] z-[120] max-h-[min(18rem,calc(55vh-6rem))] overflow-x-hidden overflow-y-auto rounded-xl",
            "shamell-scrollbar [scrollbar-gutter:auto]",
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
                  "flex w-full min-w-full box-border items-center gap-3 border-b border-gold/8 px-4 py-3 text-left transition-colors last:border-b-0",
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
